begin;

-- ============================================================
-- PONTO DIGITAL
-- COMPATIBILIDADE DA TABELA adjustment_requests
-- ============================================================


-- ============================================================
-- 01. COLUNAS PRINCIPAIS
-- ============================================================

alter table public.adjustment_requests
add column if not exists company_id uuid
references public.companies(id)
on delete cascade;


alter table public.adjustment_requests
add column if not exists employee_id uuid
references public.employees(id)
on delete cascade;


alter table public.adjustment_requests
add column if not exists work_date date;


alter table public.adjustment_requests
add column if not exists entry_type text;


alter table public.adjustment_requests
add column if not exists requested_time time;


alter table public.adjustment_requests
add column if not exists reason text;


alter table public.adjustment_requests
add column if not exists status text
default 'pending';


alter table public.adjustment_requests
add column if not exists review_notes text;


alter table public.adjustment_requests
add column if not exists reviewed_by uuid
references auth.users(id)
on delete set null;


alter table public.adjustment_requests
add column if not exists reviewed_at timestamptz;


alter table public.adjustment_requests
add column if not exists created_at timestamptz
default now();


alter table public.adjustment_requests
add column if not exists updated_at timestamptz
default now();


-- ============================================================
-- 02. CONSTRAINTS
-- ============================================================

do $$
begin

    if not exists (
        select 1
        from pg_constraint
        where conname = 'adjustment_requests_entry_type_check'
    ) then

        alter table public.adjustment_requests
        add constraint adjustment_requests_entry_type_check
        check (
            entry_type in (
                'clock_in',
                'break_start',
                'break_end',
                'clock_out'
            )
        );

    end if;

end;
$$;


do $$
begin

    if not exists (
        select 1
        from pg_constraint
        where conname = 'adjustment_requests_status_check'
    ) then

        alter table public.adjustment_requests
        add constraint adjustment_requests_status_check
        check (
            status in (
                'pending',
                'approved',
                'rejected'
            )
        );

    end if;

end;
$$;


-- ============================================================
-- 03. ÍNDICES
-- ============================================================

create index if not exists
adjustment_requests_employee_date_idx
on public.adjustment_requests (
    employee_id,
    work_date
);


create index if not exists
adjustment_requests_company_status_idx
on public.adjustment_requests (
    company_id,
    status
);


-- ============================================================
-- 04. UPDATED_AT
-- ============================================================

create or replace function
public.update_adjustment_request_timestamp()
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
adjustment_requests_updated_at
on public.adjustment_requests;


create trigger
adjustment_requests_updated_at
before update
on public.adjustment_requests
for each row
execute function
public.update_adjustment_request_timestamp();


-- ============================================================
-- 05. RLS
-- ============================================================

alter table
public.adjustment_requests
enable row level security;


drop policy if exists
"adjustment_select"
on public.adjustment_requests;


create policy
"adjustment_select"
on public.adjustment_requests
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
            where e.user_id = auth.uid()
        )

    )

);


drop policy if exists
"adjustment_insert_employee"
on public.adjustment_requests;


create policy
"adjustment_insert_employee"
on public.adjustment_requests
for insert
to authenticated
with check (

    company_id =
    public.current_company_id()

    and

    employee_id in (
        select e.id
        from public.employees e
        where e.user_id = auth.uid()
    )

    and

    status = 'pending'

);


drop policy if exists
"adjustment_update_rh"
on public.adjustment_requests;


create policy
"adjustment_update_rh"
on public.adjustment_requests
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


commit;


select
    'AJUSTES DE PONTO CONFIGURADOS COM SUCESSO'
    as resultado;