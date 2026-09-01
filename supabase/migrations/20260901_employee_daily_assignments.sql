-- ============================================================
-- PONTO DIGITAL
-- ALOCAÇÕES DIÁRIAS
-- OBRA / MANUTENÇÃO / LOCAL DO DIA
-- ============================================================

begin;


-- ============================================================
-- 01. TABELA DE ALOCAÇÕES DIÁRIAS
-- ============================================================

create table if not exists public.employee_daily_assignments (

    id uuid
        primary key
        default gen_random_uuid(),

    company_id uuid
        not null
        references public.companies(id)
        on delete cascade,

    employee_id uuid
        not null
        references public.employees(id)
        on delete cascade,

    work_date date
        not null,

    assignment_type text
        not null
        check (
            assignment_type in (
                'obra',
                'manutencao',
                'outro'
            )
        ),

    location_id uuid
        not null
        references public.locations(id),

    schedule_id uuid
        references public.work_schedules(id)
        on delete set null,

    -- Snapshot da jornada daquele dia.
    -- Isso protege o histórico mesmo se a jornada
    -- padrão mudar no futuro.

    expected_clock_in time
        not null,

    expected_break_start time
        not null,

    expected_break_end time
        not null,

    expected_clock_out time
        not null,

    notes text,

    status text
        not null
        default 'active'
        check (
            status in (
                'active',
                'completed',
                'cancelled'
            )
        ),

    created_by uuid
        references auth.users(id)
        on delete set null,

    created_at timestamptz
        not null
        default now(),

    updated_at timestamptz
        not null
        default now(),

    constraint employee_daily_assignments_unique_day
        unique (
            employee_id,
            work_date
        )
);


-- ============================================================
-- 02. ÍNDICES
-- ============================================================

create index if not exists
employee_daily_assignments_company_date_idx
on public.employee_daily_assignments (
    company_id,
    work_date
);


create index if not exists
employee_daily_assignments_employee_date_idx
on public.employee_daily_assignments (
    employee_id,
    work_date
);


create index if not exists
employee_daily_assignments_location_idx
on public.employee_daily_assignments (
    location_id
);


-- ============================================================
-- 03. UPDATED_AT
-- ============================================================

create or replace function
public.update_employee_assignment_timestamp()
returns trigger

language plpgsql

set search_path = public

as $$

begin

    new.updated_at = now();

    return new;

end;

$$;


drop trigger if exists
employee_daily_assignments_updated_at
on public.employee_daily_assignments;


create trigger
employee_daily_assignments_updated_at

before update
on public.employee_daily_assignments

for each row

execute function
public.update_employee_assignment_timestamp();


-- ============================================================
-- 04. RLS
-- ============================================================

alter table
public.employee_daily_assignments
enable row level security;


drop policy if exists
"employee_assignment_select"
on public.employee_daily_assignments;


create policy
"employee_assignment_select"

on public.employee_daily_assignments

for select

to authenticated

using (

    company_id =
    public.current_company_id()

    and (

        public.is_rh_or_admin()

        or

        employee_id in (

            select e.id

            from public.employees e

            where e.user_id =
                  auth.uid()

        )

    )

);


drop policy if exists
"employee_assignment_insert"
on public.employee_daily_assignments;


create policy
"employee_assignment_insert"

on public.employee_daily_assignments

for insert

to authenticated

with check (

    public.is_rh_or_admin()

    and

    company_id =
    public.current_company_id()

);


drop policy if exists
"employee_assignment_update"
on public.employee_daily_assignments;


create policy
"employee_assignment_update"

on public.employee_daily_assignments

for update

to authenticated

using (

    public.is_rh_or_admin()

    and

    company_id =
    public.current_company_id()

)

with check (

    public.is_rh_or_admin()

    and

    company_id =
    public.current_company_id()

);


drop policy if exists
"employee_assignment_delete"
on public.employee_daily_assignments;


create policy
"employee_assignment_delete"

on public.employee_daily_assignments

for delete

to authenticated

using (

    public.is_rh_or_admin()

    and

    company_id =
    public.current_company_id()

);


-- ============================================================
-- 05. FUNÇÃO: MINHA ALOCAÇÃO DE HOJE
-- ============================================================

create or replace function
public.get_my_today_assignment()

returns table (

    assignment_id uuid,

    employee_id uuid,

    work_date date,

    assignment_type text,

    location_id uuid,

    location_name text,

    location_address text,

    location_latitude double precision,

    location_longitude double precision,

    location_radius integer,

    expected_clock_in time,

    expected_break_start time,

    expected_break_end time,

    expected_clock_out time,

    notes text

)

language plpgsql

security definer

set search_path = public

as $$

declare

    v_employee public.employees%rowtype;

    v_timezone text;

    v_today date;

begin

    if auth.uid() is null then
        raise exception 'Usuário não autenticado';
    end if;


    select *
    into v_employee

    from public.employees

    where user_id = auth.uid()
      and status = 'active'

    limit 1;


    if not found then
        raise exception 'Funcionário não encontrado';
    end if;


    select
        coalesce(
            c.timezone,
            'America/Sao_Paulo'
        )

    into v_timezone

    from public.companies c

    where c.id =
          v_employee.company_id;


    v_today :=
        (
            now()
            at time zone v_timezone
        )::date;


    return query

    select

        a.id,

        a.employee_id,

        a.work_date,

        a.assignment_type,

        l.id,

        l.name,

        l.address,

        l.latitude,

        l.longitude,

        l.radius_meters,

        a.expected_clock_in,

        a.expected_break_start,

        a.expected_break_end,

        a.expected_clock_out,

        a.notes

    from
        public.employee_daily_assignments a

    join
        public.locations l
        on l.id =
           a.location_id

    where
        a.employee_id =
        v_employee.id

        and

        a.work_date =
        v_today

        and

        a.status =
        'active'

    limit 1;

end;

$$;


grant execute
on function
public.get_my_today_assignment()
to authenticated;


commit;


select
    'ALOCAÇÕES DIÁRIAS CRIADAS COM SUCESSO'
    as resultado;