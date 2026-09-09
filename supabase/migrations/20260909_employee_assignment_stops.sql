begin;


-- ============================================================
-- PONTO DIGITAL
-- ROTEIRO DIÁRIO DE MANUTENÇÕES / PARADAS
--
-- employee_daily_assignments
-- = jornada do funcionário no dia
--
-- employee_assignment_stops
-- = locais / clientes que ele visitará durante essa jornada
-- ============================================================


create table if not exists public.employee_assignment_stops (

    id uuid
        primary key
        default gen_random_uuid(),


    -- ========================================================
    -- EMPRESA
    -- ========================================================

    company_id uuid
        not null
        references public.companies(id)
        on delete cascade,


    -- ========================================================
    -- ALOCAÇÃO / JORNADA DO DIA
    -- ========================================================

    assignment_id uuid
        not null
        references public.employee_daily_assignments(id)
        on delete cascade,


    -- ========================================================
    -- LOCAL / CLIENTE
    -- ========================================================

    location_id uuid
        not null
        references public.locations(id)
        on delete restrict,


    -- ========================================================
    -- ORDEM DO ROTEIRO
    --
    -- 1 = primeiro cliente
    -- 2 = segundo cliente
    -- 3 = terceiro cliente
    -- ========================================================

    sequence integer
        not null,


    -- ========================================================
    -- HORÁRIOS PREVISTOS
    --
    -- NÃO são pontos trabalhistas.
    -- São somente previsão operacional.
    -- ========================================================

    expected_arrival time,

    expected_departure time,


    -- ========================================================
    -- OBSERVAÇÃO
    -- ========================================================

    notes text,


    -- ========================================================
    -- STATUS OPERACIONAL
    -- ========================================================

    status text
        not null
        default 'planned',


    -- ========================================================
    -- DATAS
    -- ========================================================

    created_at timestamptz
        not null
        default now(),

    updated_at timestamptz
        not null
        default now(),


    -- ========================================================
    -- CONSTRAINTS
    -- ========================================================

    constraint employee_assignment_stops_sequence_check
        check (
            sequence > 0
        ),


    constraint employee_assignment_stops_status_check
        check (
            status in (
                'planned',
                'in_progress',
                'completed',
                'cancelled'
            )
        ),


    constraint employee_assignment_stops_unique_sequence
        unique (
            assignment_id,
            sequence
        ),


    constraint employee_assignment_stops_unique_location
        unique (
            assignment_id,
            location_id
        )

);


-- ============================================================
-- ÍNDICES
-- ============================================================

create index if not exists
    idx_employee_assignment_stops_assignment
on public.employee_assignment_stops (
    assignment_id
);


create index if not exists
    idx_employee_assignment_stops_company
on public.employee_assignment_stops (
    company_id
);


create index if not exists
    idx_employee_assignment_stops_location
on public.employee_assignment_stops (
    location_id
);


create index if not exists
    idx_employee_assignment_stops_route
on public.employee_assignment_stops (
    assignment_id,
    sequence
);


-- ============================================================
-- UPDATED_AT
-- ============================================================

create or replace function
public.set_employee_assignment_stop_updated_at()

returns trigger

language plpgsql

set search_path = public

as $$

begin

    new.updated_at :=
        now();


    return new;

end;

$$;


drop trigger if exists
    trg_employee_assignment_stops_updated_at
on public.employee_assignment_stops;


create trigger
    trg_employee_assignment_stops_updated_at

before update
on public.employee_assignment_stops

for each row

execute function
    public.set_employee_assignment_stop_updated_at();


-- ============================================================
-- RLS
-- ============================================================

alter table
    public.employee_assignment_stops
enable row level security;


-- ============================================================
-- REMOVER POLICIES CASO A MIGRATION SEJA EXECUTADA NOVAMENTE
-- ============================================================

drop policy if exists
    employee_assignment_stops_select
on public.employee_assignment_stops;


drop policy if exists
    employee_assignment_stops_insert
on public.employee_assignment_stops;


drop policy if exists
    employee_assignment_stops_update
on public.employee_assignment_stops;


drop policy if exists
    employee_assignment_stops_delete
on public.employee_assignment_stops;


-- ============================================================
-- SELECT
--
-- FUNCIONÁRIO:
-- vê apenas paradas das próprias alocações
--
-- RH / ADMIN:
-- vê todas as paradas da própria empresa
-- ============================================================

create policy
    employee_assignment_stops_select

on public.employee_assignment_stops

for select

to authenticated

using (

    (
        public.is_rh_or_admin()

        and

        company_id =
            public.current_company_id()
    )

    or

    exists (

        select 1

        from
            public.employee_daily_assignments a

        join
            public.employees e

        on
            e.id =
                a.employee_id

        where
            a.id =
                employee_assignment_stops.assignment_id

            and

            e.user_id =
                auth.uid()

            and

            e.company_id =
                employee_assignment_stops.company_id

    )

);


-- ============================================================
-- INSERT
--
-- SOMENTE RH / ADMIN
--
-- Também garantimos que:
-- - alocação pertence à empresa
-- - local pertence à mesma empresa
-- ============================================================

create policy
    employee_assignment_stops_insert

on public.employee_assignment_stops

for insert

to authenticated

with check (

    public.is_rh_or_admin()

    and

    company_id =
        public.current_company_id()

    and

    exists (

        select 1

        from public.employee_daily_assignments a

        where
            a.id =
                employee_assignment_stops.assignment_id

            and

            a.company_id =
                employee_assignment_stops.company_id

    )

    and

    exists (

        select 1

        from public.locations l

        where
            l.id =
                employee_assignment_stops.location_id

            and

            l.company_id =
                employee_assignment_stops.company_id

    )

);


-- ============================================================
-- UPDATE
--
-- SOMENTE RH / ADMIN
-- ============================================================

create policy
    employee_assignment_stops_update

on public.employee_assignment_stops

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

    and

    exists (

        select 1

        from public.employee_daily_assignments a

        where
            a.id =
                employee_assignment_stops.assignment_id

            and

            a.company_id =
                employee_assignment_stops.company_id

    )

    and

    exists (

        select 1

        from public.locations l

        where
            l.id =
                employee_assignment_stops.location_id

            and

            l.company_id =
                employee_assignment_stops.company_id

    )

);


-- ============================================================
-- DELETE
--
-- SOMENTE RH / ADMIN
-- ============================================================

create policy
    employee_assignment_stops_delete

on public.employee_assignment_stops

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
    'ROTEIRO DIÁRIO CONFIGURADO COM SUCESSO'
    as resultado;