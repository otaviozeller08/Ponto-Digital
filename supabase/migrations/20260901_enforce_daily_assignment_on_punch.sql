-- ============================================================
-- PONTO DIGITAL
-- REGISTRO DE PONTO COM LOCAL DA ALOCAÇÃO DO DIA
--
-- REGRA:
-- - HORÁRIO NÃO BLOQUEIA
-- - LOCALIZAÇÃO BLOQUEIA
-- - SE HOUVER ALOCAÇÃO, SOMENTE O LOCAL DELA É ACEITO
-- - SE NÃO HOUVER ALOCAÇÃO, MANTÉM FALLBACK DOS LOCAIS AUTORIZADOS
-- ============================================================

begin;


create or replace function public.register_time_entry(

    p_entry_type text,

    p_latitude double precision default null,

    p_longitude double precision default null,

    p_accuracy double precision default null,

    p_client_recorded_at timestamptz default null,

    p_user_agent text default null,

    p_device_info jsonb default '{}'::jsonb

)
returns public.time_entries

language plpgsql

security definer

set search_path = public

as $$

declare

    v_employee public.employees%rowtype;

    v_company public.companies%rowtype;

    v_settings public.point_settings%rowtype;

    v_location public.locations%rowtype;

    v_assignment public.employee_daily_assignments%rowtype;

    v_work_date date;

    v_distance double precision;

    v_geofence boolean := false;

    v_low_accuracy boolean := false;

    v_status text := 'valid';

    v_expected text;

    v_last_at timestamptz;

    v_elapsed_seconds numeric;

    v_result public.time_entries%rowtype;

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

    where user_id = auth.uid()
      and status = 'active'

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

    where id = v_employee.company_id
      and active = true

    limit 1;


    if not found then

        raise exception
            'Empresa ativa não encontrada';

    end if;


    -- ========================================================
    -- 05. DATA OFICIAL DA EMPRESA
    -- ========================================================

    v_work_date :=
        (
            now()
            at time zone
            coalesce(
                v_company.timezone,
                'America/Sao_Paulo'
            )
        )::date;


    -- ========================================================
    -- 06. EVITA REGISTROS CONCORRENTES
    -- ========================================================

    perform pg_advisory_xact_lock(
        hashtext(
            v_employee.id::text
        ),
        hashtext(
            v_work_date::text
        )
    );


    -- ========================================================
    -- 07. CONFIGURAÇÕES DO PONTO
    -- ========================================================

    select *
    into v_settings

    from public.point_settings

    where company_id =
          v_employee.company_id

    limit 1;


    if not found then

        raise exception
            'Configurações de ponto não encontradas';

    end if;


    -- ========================================================
    -- 08. ORDEM DOS REGISTROS
    --
    -- Continua obrigatório:
    --
    -- Entrada
    -- Intervalo
    -- Retorno
    -- Saída
    --
    -- O HORÁRIO NÃO É VERIFICADO AQUI.
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
    -- 09. PROTEÇÃO CONTRA DUPLO CLIQUE
    --
    -- Isso NÃO é regra de horário.
    --
    -- É apenas proteção contra:
    -- clicar duas vezes / requisições duplicadas.
    -- ========================================================

    select occurred_at
    into v_last_at

    from public.time_entries

    where employee_id =
          v_employee.id

      and work_date =
          v_work_date

      and status <>
          'cancelled'

    order by occurred_at desc

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
    -- 10. GPS É OBRIGATÓRIO
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
        -- 11. PROCURA A ALOCAÇÃO DO FUNCIONÁRIO PARA HOJE
        -- ====================================================

        select *
        into v_assignment

        from public.employee_daily_assignments

        where employee_id =
              v_employee.id

          and company_id =
              v_employee.company_id

          and work_date =
              v_work_date

          and status =
              'active'

        limit 1;


        -- ====================================================
        -- 12. SE EXISTIR ALOCAÇÃO:
        --
        -- O LOCAL DA ALOCAÇÃO É O ÚNICO LOCAL ACEITO.
        -- ====================================================

        if found then

            select *
            into v_location

            from public.locations

            where id =
                  v_assignment.location_id

              and company_id =
                  v_employee.company_id

              and active = true

            limit 1;


            if not found then

                raise exception
                    'O local definido na sua alocação não está disponível';

            end if;


        else

            -- =================================================
            -- 13. SEM ALOCAÇÃO:
            --
            -- Por enquanto mantém compatibilidade com o sistema
            -- anterior.
            --
            -- Procura o local autorizado mais próximo.
            -- =================================================

            select l.*
            into v_location

            from public.locations l

            where
                l.company_id =
                v_employee.company_id

                and

                l.active = true

                and (

                    not exists (

                        select 1

                        from public.employee_locations el

                        where el.employee_id =
                              v_employee.id

                    )

                    or

                    exists (

                        select 1

                        from public.employee_locations el

                        where el.employee_id =
                              v_employee.id

                          and el.location_id =
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

            limit 1;


            if not found then

                raise exception
                    'Nenhum local autorizado encontrado';

            end if;

        end if;


        -- ====================================================
        -- 14. CALCULA DISTÂNCIA REAL
        -- ====================================================

        v_distance :=
            public.distance_meters(

                p_latitude,

                p_longitude,

                v_location.latitude,

                v_location.longitude

            );


        -- ====================================================
        -- 15. VALIDA O RAIO DO LOCAL
        -- ====================================================

        v_geofence :=
            v_distance <=
            v_location.radius_meters;


        -- ====================================================
        -- 16. PRECISÃO DO GPS
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
        -- 17. FORA DO LOCAL = BLOQUEIA
        --
        -- Essa é a regra principal.
        -- ====================================================

        if not v_geofence then

            raise exception
                'Você está fora do local autorizado para hoje';

        end if;


        -- ====================================================
        -- 18. STATUS
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
    -- 19. REGISTRA O PONTO
    --
    -- IMPORTANTE:
    -- NÃO EXISTE VALIDAÇÃO DE HORÁRIO AQUI.
    --
    -- 07:00
    -- 07:20
    -- 08:30
    --
    -- TODOS PODEM SER REGISTRADOS.
    --
    -- O servidor salva o horário REAL.
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
-- PERMISSÕES
-- ============================================================

revoke all
on function public.register_time_entry(
    text,
    double precision,
    double precision,
    double precision,
    timestamptz,
    text,
    jsonb
)
from public;


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
    'REGISTRO DE PONTO AGORA RESPEITA A ALOCAÇÃO DO DIA'
    as resultado;