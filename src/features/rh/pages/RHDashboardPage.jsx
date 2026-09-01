import {
  ArrowLeft,
  CalendarRange,
  FilePenLine,
  MapPinned,
  RefreshCw,
  Search,
  Settings2,
  Users,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import RHSummaryCards from '../components/RHSummaryCards'
import EmployeeStatusCard from '../components/EmployeeStatusCard'

import {
  getPendingAdjustmentsCount,
  getTodayRHData,
} from '../services/rhService'


export default function RHDashboardPage() {

  const [
    employees,
    setEmployees,
  ] =
    useState([])


  const [
    pendingAdjustments,
    setPendingAdjustments,
  ] =
    useState(0)


  const [
    search,
    setSearch,
  ] =
    useState('')


  const [
    loading,
    setLoading,
  ] =
    useState(true)


  const [
    error,
    setError,
  ] =
    useState('')


  // =========================================================
  // CARREGAR DASHBOARD
  // =========================================================

  async function loadDashboard() {

    try {

      setLoading(true)

      setError('')


      const [
        employeesData,
        pendingData,
      ] =
        await Promise.all([

          getTodayRHData(),

          getPendingAdjustmentsCount(),

        ])


      setEmployees(
        employeesData
      )


      setPendingAdjustments(
        pendingData
      )

    } catch (error) {

      console.error(
        error
      )


      setError(
        error.message ||
        'Não foi possível carregar o dashboard do RH.'
      )

    } finally {

      setLoading(false)

    }

  }


  // =========================================================
  // INICIALIZAÇÃO
  // =========================================================

  useEffect(() => {

    loadDashboard()

  }, [])


  // =========================================================
  // FILTRO
  // =========================================================

  const filteredEmployees =
    useMemo(
      () => {

        const term =
          search
            .trim()
            .toLowerCase()


        if (!term) {
          return employees
        }


        return employees.filter(
          employee =>

            employee.full_name
              ?.toLowerCase()
              .includes(
                term
              )

            ||

            employee.job_title
              ?.toLowerCase()
              .includes(
                term
              )

        )

      },
      [
        employees,
        search,
      ]
    )


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="rh-dashboard">

      <div className="rh-dashboard__container">


        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="rh-header">

          <div className="rh-header__left">

            <Link
              to="/app"
              className="rh-header-button"
              title="Voltar ao ponto"
            >

              <ArrowLeft
                size={21}
              />

            </Link>


            <div>

              <span>
                Ponto Digital • RH
              </span>

              <h1>
                Visão de hoje
              </h1>

              <p>
                Acompanhe a jornada
                dos funcionários em
                tempo real.
              </p>

            </div>

          </div>


          <div className="rh-header__actions">


            {/* FUNCIONÁRIOS */}

            <Link
              to="/rh/funcionarios"
              className="rh-header-button"
              title="Funcionários"
            >

              <Users
                size={20}
              />

            </Link>


            {/* ALOCAÇÕES */}

            <Link
              to="/rh/alocacoes"
              className="rh-header-button"
              title="Alocações"
            >

              <CalendarRange
                size={20}
              />

            </Link>


            {/* AJUSTES */}

            <Link
              to="/rh/ajustes"
              className="rh-header-button"
              title="Ajustes de ponto"
            >

              <FilePenLine
                size={20}
              />

            </Link>


            {/* LOCAIS */}

            <Link
              to="/rh/locais"
              className="rh-header-button"
              title="Locais"
            >

              <MapPinned
                size={20}
              />

            </Link>


            {/* CONFIGURAÇÕES */}

            <button
              type="button"
              className="rh-header-button"
              title="Configurações"
            >

              <Settings2
                size={20}
              />

            </button>

          </div>

        </header>


        {/* ====================================================
            RESUMO
        ==================================================== */}

        <RHSummaryCards

          employees={
            employees
          }

          pendingAdjustments={
            pendingAdjustments
          }

        />


        {/* ====================================================
            BARRA DE FERRAMENTAS
        ==================================================== */}

        <section className="rh-toolbar">

          <div className="rh-search">

            <Search
              size={19}
            />

            <input

              type="search"

              value={
                search
              }

              placeholder="Buscar funcionário..."

              onChange={
                event =>
                  setSearch(
                    event.target.value
                  )
              }

            />

          </div>


          <button
            type="button"
            className="rh-refresh-button"
            disabled={
              loading
            }
            onClick={
              loadDashboard
            }
          >

            <RefreshCw
              size={18}
              className={
                loading
                  ? 'point-spin'
                  : ''
              }
            />

            Atualizar

          </button>

        </section>


        {/* ====================================================
            ERRO
        ==================================================== */}

        {error && (

          <div className="point-message point-message--error">

            {error}

          </div>

        )}


        {/* ====================================================
            FUNCIONÁRIOS
        ==================================================== */}

        <section className="rh-employees">

          <div className="rh-employees__header">

            <h2>
              Funcionários hoje
            </h2>

            <span>
              {
                filteredEmployees.length
              }
              {' '}
              funcionários
            </span>

          </div>


          {loading ? (

            <div className="rh-empty">

              Carregando funcionários...

            </div>

          ) : filteredEmployees.length ===
            0 ? (

            <div className="rh-empty">

              Nenhum funcionário encontrado.

            </div>

          ) : (

            filteredEmployees.map(
              employee => (

                <EmployeeStatusCard

                  key={
                    employee.employee_id
                  }

                  employee={
                    employee
                  }

                />

              )
            )

          )}

        </section>

      </div>

    </main>
  )
}