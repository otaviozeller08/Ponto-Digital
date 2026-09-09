begin;


-- ============================================================
-- PONTO DIGITAL
-- GEOFENCE COM MÚLTIPLAS PARADAS NO ROTEIRO
--
-- REGRA:
--
-- employee_daily_assignments
-- = jornada do dia
--
-- employee_assignment_stops
-- = locais autorizados naquele dia
--
-- Se existir roteiro:
-- → qualquer parada não cancelada pode validar o ponto
--
-- Se NÃO existir roteiro:
-- → mantém compatibilidade com location_id da alocação antiga
--
-- Se NÃO existir alocação:
-- → mantém compatibilidade com employee_locations / locais
-- ============================================================


create or replace function public.register_time_entry(

    p_entry_type text,

    p_latitude double precision
        default null,

    p_longitude double precision
        default null,

    p_accuracy double precision
        default null,

    p_client_recorded_at timestamptz
        default null,

    p_user_agent text
        default null,

    p_device_info jsonb
        default '{}'::jsonb

)

returns public.time_entries

language plpgsql

security definer

set search_path = public

as $$

declare

    v_employee
        public.employees%rowtype;

    v_company
        public.companies%rowtype;

    v_settings
        public.point_settings%rowtype;

    v_location
        public.locations%rowtype;

    v_assignment
        public.employee_daily_assignments%rowtype;

    v_work_date date;

    v_distance
        double precision;

    v_geofence
        boolean := false;

    v_low_accuracy
        boolean := false;

    v_status
        text := 'valid';

    v_expected
        text;

    v_last_at
        timestamptz;

    v_elapsed_seconds
        numeric;

    v_result
        public.time_entries%rowtype;

    v_has_route
        boolean := false;


begin


    -- ========================================================
    -- 01. AUTENTICAÇÃO
    -- ========================================================

    if auth.uid() is null then

        raise exception
            'Usuário não autenticado';

    end if;


    -- ========================================================
    -- 02. TIPO DE REGISTRO
    -- ========================================================

    if p_entry_type not in (

        'clock_in',
        'break_start',
        'break_end',
        'clock_out'

    ) then

        raise exception
            'Tipo de ponto inválido';

    end if;


    -- ========================================================
    -- 03. FUNCIONÁRIO
    -- ========================================================

    select *
    into v_employee

    from public.employees

    where
        user_id =
            auth.uid()

        and

        status =
            'active'

    limit 1;


    if not found then

        raise exception
            'Funcionário ativo não encontrado';

    end if;


    -- ========================================================
    -- 04. EMPRESA
    -- ========================================================

    select *
    into v_company

    from public.companies

    where
        id =
            v_employee.company_id

        and

        active =
            true

    limit 1;


    if not found then

        raise exception
            'Empresa ativa não encontrada';

    end if;


    -- ========================================================
    -- 05. DATA OFICIAL
    -- ========================================================

    v_work_date := (

        now()

        at time zone

        coalesce(
            v_company.timezone,
            'America/Sao_Paulo'
        )

    )::date;


    -- ========================================================
    -- 06. EVITAR REGISTROS CONCORRENTES
    -- ========================================================

    perform
        pg_advisory_xact_lock(

            hashtext(
                v_employee.id::text
            ),

            hashtext(
                v_work_date::text
            )

        );


    -- ========================================================
    -- 07. CONFIGURAÇÕES
    -- ========================================================

    select *
    into v_settings

    from public.point_settings

    where
        company_id =
            v_employee.company_id

    limit 1;


    if not found then

        raise exception
            'Configurações de ponto não encontradas';

    end if;


    -- ========================================================
    -- 08. ORDEM DOS PONTOS
    -- ========================================================

    v_expected :=
        public.get_next_entry_type(

            v_employee.id,

            v_work_date

        );


    if v_expected = 'finished' then

        raise exception
            'Jornada do dia já finalizada';

    end if;


    if p_entry_type <> v_expected then

        raise exception
            'Registro inválido. Próximo registro esperado: %',
            v_expected;

    end if;


    -- ========================================================
    -- 09. DUPLO CLIQUE
    -- ========================================================

    select
        occurred_at

    into
        v_last_at

    from
        public.time_entries

    where
        employee_id =
            v_employee.id

        and

        work_date =
            v_work_date

        and

        status <>
            'cancelled'

    order by
        occurred_at desc

    limit 1;


    if

        not v_settings.allow_fast_test_punches

        and

        v_last_at is not null

    then

        v_elapsed_seconds :=
            extract(

                epoch from (

                    now() -
                    v_last_at

                )

            );


        if

            v_elapsed_seconds <
            v_settings.minimum_seconds_between_entries

        then

            raise exception
                'Aguarde alguns segundos antes de realizar outro registro';

        end if;

    end if;


    -- ========================================================
    -- 10. GPS
    -- ========================================================

    if v_settings.require_geolocation then


        if

            p_latitude is null

            or

            p_longitude is null

            or

            p_accuracy is null

        then

            raise exception
                'Localização GPS obrigatória para registrar o ponto';

        end if;


        -- ====================================================
        -- 11. ALOCAÇÃO DO DIA
        -- ====================================================

        select *
        into v_assignment

        from
            public.employee_daily_assignments

        where
            employee_id =
                v_employee.id

            and

            company_id =
                v_employee.company_id

            and

            work_date =
                v_work_date

            and

            status =
                'active'

        limit 1;


        if found then


            -- =================================================
            -- 12. VERIFICAR SE EXISTE ROTEIRO
            -- =================================================

            select exists (

                select 1

                from
                    public.employee_assignment_stops s

                join
                    public.locations l

                on
                    l.id =
                        s.location_id

                where
                    s.assignment_id =
                        v_assignment.id

                    and

                    s.company_id =
                        v_employee.company_id

                    and

                    s.status <>
                        'cancelled'

                    and

                    l.company_id =
                        v_employee.company_id

                    and

                    l.active =
                        true

            )

            into
                v_has_route;


            -- =================================================
            -- 13. COM ROTEIRO
            --
            -- Procura o local do roteiro MAIS PRÓXIMO
            -- da posição atual do funcionário.
            -- =================================================

            if v_has_route then


                select
                    l.*

                into
                    v_location

                from
                    public.employee_assignment_stops s

                join
                    public.locations l

                on
                    l.id =
                        s.location_id

                where
                    s.assignment_id =
                        v_assignment.id

                    and

                    s.company_id =
                        v_employee.company_id

                    and

                    s.status <>
                        'cancelled'

                    and

                    l.company_id =
                        v_employee.company_id

                    and

                    l.active =
                        true

                order by

                    public.distance_meters(

                        p_latitude,

                        p_longitude,

                        l.latitude,

                        l.longitude

                    )

                asc

                limit 1;


                if not found then

                    raise exception
                        'Nenhum local válido encontrado no seu roteiro de hoje';

                end if;


            -- =================================================
            -- 14. SEM ROTEIRO
            --
            -- Compatibilidade com alocações antigas:
            -- usa location_id principal.
            -- =================================================

            else


                select *
                into v_location

                from
                    public.locations

                where
                    id =
                        v_assignment.location_id

                    and

                    company_id =
                        v_employee.company_id

                    and

                    active =
                        true

                limit 1;


                if not found then

                    raise exception
                        'O local definido na sua alocação não está disponível';

                end if;


            end if;


        -- ====================================================
        -- 15. SEM ALOCAÇÃO
        --
        -- Mantém compatibilidade com o sistema antigo.
        -- ====================================================

        else


            select
                l.*

            into
                v_location

            from
                public.locations l

            where

                l.company_id =
                    v_employee.company_id

                and

                l.active =
                    true

                and (

                    not exists (

                        select 1

                        from
                            public.employee_locations el

                        where
                            el.employee_id =
                                v_employee.id

                    )

                    or

                    exists (

                        select 1

                        from
                            public.employee_locations el

                        where
                            el.employee_id =
                                v_employee.id

                            and

                            el.location_id =
                                l.id

                    )

                )

            order by

                public.distance_meters(

                    p_latitude,

                    p_longitude,

                    l.latitude,

                    l.longitude

                )

            asc

            limit 1;


            if not found then

                raise exception
                    'Nenhum local autorizado encontrado';

            end if;


        end if;


        -- ====================================================
        -- 16. DISTÂNCIA
        -- ====================================================

        v_distance :=
            public.distance_meters(

                p_latitude,

                p_longitude,

                v_location.latitude,

                v_location.longitude

            );


        -- ====================================================
        -- 17. GEOFENCE
        -- ====================================================

        v_geofence :=

            v_distance <=
            v_location.radius_meters;


        -- ====================================================
        -- 18. PRECISÃO GPS
        -- ====================================================

        v_low_accuracy :=

            p_accuracy >
            v_settings.max_gps_accuracy_meters;


        if

            v_low_accuracy

            and

            v_settings.block_low_accuracy

        then

            raise exception
                'Precisão do GPS insuficiente. Atualize sua localização e tente novamente';

        end if;


        -- ====================================================
        -- 19. FORA DE TODOS OS LOCAIS
        -- ====================================================

        if not v_geofence then

            raise exception
                'Você está fora dos locais autorizados do seu roteiro de hoje';

        end if;


        -- ====================================================
        -- 20. STATUS
        -- ====================================================

        if v_low_accuracy then

            v_status :=
                'low_accuracy';

        else

            v_status :=
                'valid';

        end if;


    end if;


    -- ========================================================
    -- 21. REGISTRAR PONTO
    -- ========================================================

    insert into public.time_entries (

        company_id,

        employee_id,

        work_date,

        entry_type,

        occurred_at,

        client_recorded_at,

        latitude,

        longitude,

        gps_accuracy,

        location_id,

        distance_meters,

        geofence_validated,

        face_verified,

        liveness_verified,

        source,

        status,

        user_agent,

        device_info,

        created_by

    )

    values (

        v_employee.company_id,

        v_employee.id,

        v_work_date,

        p_entry_type,

        now(),

        p_client_recorded_at,

        p_latitude,

        p_longitude,

        p_accuracy,

        v_location.id,

        v_distance,

        v_geofence,

        false,

        false,

        'web',

        v_status,

        p_user_agent,

        coalesce(
            p_device_info,
            '{}'::jsonb
        ),

        auth.uid()

    )

    returning *
    into v_result;


    return v_result;


end;

$$;


-- ============================================================
-- PERMISSÃO
-- ============================================================

grant execute
on function public.register_time_entry(
    text,
    double precision,
    double precision,
    double precision,
    timestamptz,
    text,
    jsonb
)
to authenticated;


commit;


select
    'GEOFENCE COM ROTEIRO CONFIGURADA COM SUCESSO'
    as resultado;