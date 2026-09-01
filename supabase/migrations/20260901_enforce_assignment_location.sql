begin;


-- ============================================================
-- GARANTE QUE A ALOCAÇÃO DO DIA É PRIORIDADE
-- NA VALIDAÇÃO DE LOCAL DO PONTO
-- ============================================================

create or replace function public.get_today_assigned_location(
    p_employee_id uuid
)
returns public.locations

language plpgsql

security definer

set search_path = public

as $$

declare

    v_company_id uuid;

    v_timezone text;

    v_today date;

    v_location public.locations%rowtype;

begin

    select
        e.company_id,
        coalesce(
            c.timezone,
            'America/Sao_Paulo'
        )

    into
        v_company_id,
        v_timezone

    from public.employees e

    join public.companies c
        on c.id =
           e.company_id

    where e.id =
          p_employee_id

    limit 1;


    if v_company_id is null then
        return null;
    end if;


    v_today :=
        (
            now()
            at time zone v_timezone
        )::date;


    select l.*

    into v_location

    from
        public.employee_daily_assignments a

    join
        public.locations l
        on l.id =
           a.location_id

    where
        a.employee_id =
        p_employee_id

        and

        a.company_id =
        v_company_id

        and

        a.work_date =
        v_today

        and

        a.status =
        'active'

        and

        l.active =
        true

    limit 1;


    if not found then
        return null;
    end if;


    return v_location;

end;

$$;


grant execute
on function
public.get_today_assigned_location(uuid)
to authenticated;


commit;


select
    'VALIDAÇÃO DE ALOCAÇÃO CRIADA'
    as resultado;