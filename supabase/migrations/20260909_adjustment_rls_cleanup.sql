begin;


-- ============================================================
-- PONTO DIGITAL
-- LIMPEZA E BLINDAGEM DAS POLICIES DE AJUSTE DE PONTO
-- ============================================================


alter table public.adjustment_requests
enable row level security;


-- ============================================================
-- REMOVER POLICIES ANTIGAS / DUPLICADAS
-- ============================================================

drop policy if exists
    adjustment_insert_employee
on public.adjustment_requests;


drop policy if exists
    adjustments_employee_insert
on public.adjustment_requests;


drop policy if exists
    adjustment_select
on public.adjustment_requests;


drop policy if exists
    adjustments_select
on public.adjustment_requests;


drop policy if exists
    adjustment_update_rh
on public.adjustment_requests;


drop policy if exists
    adjustments_rh_update
on public.adjustment_requests;


-- ============================================================
-- 01. FUNCIONÁRIO CRIA SOMENTE O PRÓPRIO AJUSTE
-- ============================================================

create policy adjustment_employee_insert
on public.adjustment_requests

for insert

to authenticated

with check (

    status = 'pending'

    and

    company_id =
        public.current_company_id()

    and

    exists (

        select 1

        from public.employees e

        where
            e.id =
                adjustment_requests.employee_id

            and

            e.user_id =
                auth.uid()

            and

            e.company_id =
                public.current_company_id()

    )

);


-- ============================================================
-- 02. LEITURA
--
-- FUNCIONÁRIO:
-- somente solicitações próprias
--
-- RH / ADMIN:
-- solicitações da própria empresa
-- ============================================================

create policy adjustment_select
on public.adjustment_requests

for select

to authenticated

using (

    exists (

        select 1

        from public.employees e

        where
            e.id =
                adjustment_requests.employee_id

            and

            e.user_id =
                auth.uid()

    )

    or

    (

        public.is_rh_or_admin()

        and

        company_id =
            public.current_company_id()

    )

);


-- ============================================================
-- 03. ATUALIZAÇÃO
--
-- SOMENTE RH / ADMIN
-- DA MESMA EMPRESA
--
-- Funcionário NÃO pode aprovar,
-- recusar ou editar solicitação.
-- ============================================================

create policy adjustment_rh_update
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


-- ============================================================
-- RESULTADO
-- ============================================================

select
    'RLS DE AJUSTES ORGANIZADO E PROTEGIDO'
    as resultado;