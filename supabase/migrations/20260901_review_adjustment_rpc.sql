begin;


-- ============================================================
-- PONTO DIGITAL
-- APROVAÇÃO / RECUSA DE AJUSTES DE PONTO
-- ============================================================


create or replace function public.review_adjustment_request(
    p_request_id uuid,
    p_status text,
    p_review_notes text default null
)

returns jsonb

language plpgsql

security definer

set search_path = public

as $$

declare

    v_request
        public.adjustment_requests%rowtype;

    v_employee
        public.employees%rowtype;

    v_profile
        public.profiles%rowtype;

    v_company_timezone text;

    v_adjusted_timestamp timestamptz;

    v_existing_entry_id uuid;

    v_assignment_location_id uuid;

begin


    -- ========================================================
    -- 01. AUTENTICAÇÃO
    -- ========================================================

    if auth.uid() is null then

        raise exception
            'Usuário não autenticado.';

    end if;


    -- ========================================================
    -- 02. PERFIL DE QUEM ESTÁ REVISANDO
    -- ========================================================

    select *
    into v_profile

    from public.profiles

    where id = auth.uid()

    limit 1;


    if not found then

        raise exception
            'Perfil do usuário não encontrado.';

    end if;


    if v_profile.role not in (
        'rh',
        'admin'
    ) then

        raise exception
            'Você não possui permissão para revisar ajustes.';

    end if;


    -- ========================================================
    -- 03. STATUS RECEBIDO
    -- ========================================================

    if p_status not in (
        'approved',
        'rejected'
    ) then

        raise exception
            'Status inválido.';

    end if;


    -- ========================================================
    -- 04. BUSCAR SOLICITAÇÃO
    -- ========================================================

    select *
    into v_request

    from public.adjustment_requests

    where id = p_request_id

    for update;


    if not found then

        raise exception
            'Solicitação não encontrada.';

    end if;


    -- ========================================================
    -- 05. GARANTIR MESMA EMPRESA
    -- ========================================================

    if
        v_request.company_id
        is distinct from
        v_profile.company_id
    then

        raise exception
            'Solicitação pertence a outra empresa.';

    end if;


    -- ========================================================
    -- 06. NÃO REVISAR DUAS VEZES
    -- ========================================================

    if v_request.status <> 'pending' then

        raise exception
            'Esta solicitação já foi revisada.';

    end if;


    -- ========================================================
    -- 07. SE RECUSADO
    -- ========================================================

    if p_status = 'rejected' then

        update public.adjustment_requests

        set
            status = 'rejected',

            review_notes =
                nullif(
                    trim(
                        coalesce(
                            p_review_notes,
                            ''
                        )
                    ),
                    ''
                ),

            reviewed_by =
                auth.uid(),

            reviewed_at =
                now()

        where id =
            v_request.id;


        return jsonb_build_object(

            'success',
            true,

            'status',
            'rejected',

            'request_id',
            v_request.id

        );

    end if;


    -- ========================================================
    -- 08. FUNCIONÁRIO
    -- ========================================================

    select *
    into v_employee

    from public.employees

    where id =
        v_request.employee_id

    limit 1;


    if not found then

        raise exception
            'Funcionário não encontrado.';

    end if;


    if
        v_employee.company_id
        is distinct from
        v_profile.company_id
    then

        raise exception
            'Funcionário pertence a outra empresa.';

    end if;


    -- ========================================================
    -- 09. TIMEZONE DA EMPRESA
    -- ========================================================

    select
        coalesce(
            timezone,
            'America/Sao_Paulo'
        )

    into v_company_timezone

    from public.companies

    where id =
        v_employee.company_id;


    if v_company_timezone is null then

        v_company_timezone :=
            'America/Sao_Paulo';

    end if;


    -- ========================================================
    -- 10. MONTAR TIMESTAMP OFICIAL DO AJUSTE
    --
    -- work_date = 2026-09-01
    -- requested_time = 17:08
    --
    -- vira timestamp real no timezone da empresa
    -- ========================================================

    v_adjusted_timestamp :=
        (
            v_request.work_date
            +
            v_request.requested_time
        )
        at time zone
        v_company_timezone;


    -- ========================================================
    -- 11. DESCOBRIR LOCAL DA ALOCAÇÃO
    -- ========================================================

    select
        location_id

    into
        v_assignment_location_id

    from
        public.employee_daily_assignments

    where
        employee_id =
            v_employee.id

        and

        work_date =
            v_request.work_date

        and

        status <>
            'cancelled'

    limit 1;


    -- ========================================================
    -- 12. VER SE O PONTO JÁ EXISTE
    -- ========================================================

    select
        id

    into
        v_existing_entry_id

    from
        public.time_entries

    where
        employee_id =
            v_employee.id

        and

        work_date =
            v_request.work_date

        and

        entry_type =
            v_request.entry_type

    order by
        occurred_at asc

    limit 1

    for update;


    -- ========================================================
    -- 13. SE JÁ EXISTE → CORRIGE
    -- ========================================================

    if v_existing_entry_id is not null then

        update public.time_entries

        set
            occurred_at =
                v_adjusted_timestamp

        where id =
            v_existing_entry_id;


    -- ========================================================
    -- 14. SE NÃO EXISTE → CRIA
    -- ========================================================

    else

        insert into public.time_entries (

            employee_id,

            company_id,

            work_date,

            entry_type,

            occurred_at,

            location_id,

            geofence_validated

        )

        values (

            v_employee.id,

            v_employee.company_id,

            v_request.work_date,

            v_request.entry_type,

            v_adjusted_timestamp,

            v_assignment_location_id,

            false

        )

        returning id

        into v_existing_entry_id;

    end if;


    -- ========================================================
    -- 15. MARCAR SOLICITAÇÃO COMO APROVADA
    -- ========================================================

    update public.adjustment_requests

    set
        status =
            'approved',

        review_notes =
            nullif(
                trim(
                    coalesce(
                        p_review_notes,
                        ''
                    )
                ),
                ''
            ),

        reviewed_by =
            auth.uid(),

        reviewed_at =
            now()

    where id =
        v_request.id;


    -- ========================================================
    -- 16. RETORNO
    -- ========================================================

    return jsonb_build_object(

        'success',
        true,

        'status',
        'approved',

        'request_id',
        v_request.id,

        'time_entry_id',
        v_existing_entry_id,

        'occurred_at',
        v_adjusted_timestamp

    );

end;

$$;


grant execute
on function public.review_adjustment_request(
    uuid,
    text,
    text
)
to authenticated;


commit;


select
    'APROVAÇÃO DE AJUSTES CONFIGURADA COM SUCESSO'
    as resultado;