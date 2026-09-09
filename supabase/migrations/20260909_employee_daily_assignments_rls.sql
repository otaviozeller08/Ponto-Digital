begin;


-- ============================================================
-- PONTO DIGITAL
-- BLINDAGEM RLS - ALOCAÇÕES DIÁRIAS
-- ============================================================


alter table public.employee_daily_assignments
enable row level security;


-- ============================================================
-- REMOVER POLICIES ATUAIS
-- ============================================================

drop policy if exists
    employee_assignment_select
on public.employee_daily_assignments;


drop policy if exists
    employee_assignment_insert
on public.employee_daily_assignments;


drop policy if exists
    employee_assignment_update
on public.employee_daily_assignments;


drop policy if exists
    employee_assignment_delete
on public.employee_daily_assignments;


-- ============================================================
-- 01. SELECT
--
-- FUNCIONÁRIO:
-- vê SOMENTE as próprias alocações.
--
-- RH / ADMIN:
-- vê as alocações da própria empresa.
-- ============================================================

create policy employee_assignment_select
on public.employee_daily_assignments

for select

to authenticated

using (

    (
        company_id =
            public.current_company_id()

        and

        public.is_rh_or_admin()
    )

    or

    exists (

        select 1

        from public.employees e

        where
            e.id =
                employee_daily_assignments.employee_id

            and

            e.user_id =
                auth.uid()

            and

            e.company_id =
                employee_daily_assignments.company_id
    )

);


-- ============================================================
-- 02. INSERT
--
-- SOMENTE RH / ADMIN
-- DA MESMA EMPRESA.
-- ============================================================

create policy employee_assignment_insert
on public.employee_daily_assignments

for insert

to authenticated

with check (

    public.is_rh_or_admin()

    and

    company_id =
        public.current_company_id()

);


-- ============================================================
-- 03. UPDATE
--
-- SOMENTE RH / ADMIN
-- DA MESMA EMPRESA.
-- ============================================================

create policy employee_assignment_update
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


-- ============================================================
-- 04. DELETE
--
-- SOMENTE RH / ADMIN
-- DA MESMA EMPRESA.
-- ============================================================

create policy employee_assignment_delete
on public.employee_daily_assignments

for delete

to authenticated

using (

    public.is_rh_or_admin()

    and

    company_id =
        public.current_company_id()

);


commit;


-- ============================================================
-- RESULTADO
-- ============================================================

select
    'RLS DAS ALOCAÇÕES DIÁRIAS CONFIGURADO COM SUCESSO'
    as resultado;