import {
  FilePenLine,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Settings,
  ShieldCheck,
} from 'lucide-react'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import {
  useAuth,
} from '../../auth/hooks/useAuth'

import {
  useGeolocation,
} from '../../geolocation/hooks/useGeolocation'

import {
  findNearestLocation,
  getCompanyLocations,
  getCurrentEmployee,
} from '../services/pointService'

import {
  getTodayAssignment,
} from '../services/todayAssignmentService'

import {
  useTodayEntries,
} from '../hooks/useTodayEntries'

import {
  usePoint,
} from '../hooks/usePoint'

import ClockCard from '../components/ClockCard'
import LocationValidationCard from '../components/LocationValidationCard'
import NextPunchCard from '../components/NextPunchCard'
import PunchButton from '../components/PunchButton'
import PunchTimeline from '../components/PunchTimeline'
import WorkdaySummary from '../components/WorkdaySummary'
import TodayAssignmentCard from '../components/TodayAssignmentCard'


export default function DashboardFuncionarioPage() {
  const {
    profile,
    logout,
    isRH,
  } = useAuth()


  const [
    employee,
    setEmployee,
  ] = useState(null)


  const [
    locations,
    setLocations,
  ] = useState([])


  const [
    assignment,
    setAssignment,
  ] = useState(null)


  const [
    assignmentLoading,
    setAssignmentLoading,
  ] = useState(true)


  const [
    loadingDashboard,
    setLoadingDashboard,
  ] = useState(true)


  const [
    dashboardError,
    setDashboardError,
  ] = useState(null)


  const {
    position,

    loading:
      locationLoading,

    error:
      locationError,

    requestLocation,
  } = useGeolocation()


  const {
    entries,

    workedMinutes,

    loadTodayEntries,
  } = useTodayEntries()


  const {
    nextEntryType,

    registering,

    error:
      pointError,

    success:
      pointSuccess,

    loadNextEntryType,

    punch,

    clearMessages,
  } = usePoint()


  // =========================================================
  // LOCAL DESIGNADO PARA HOJE
  // =========================================================

  const assignedLocation =
    useMemo(
      () => {
        if (!assignment) {
          return null
        }


        return {
          id:
            assignment.location_id,

          name:
            assignment.location_name,

          address:
            assignment.location_address,

          latitude:
            Number(
              assignment.location_latitude
            ),

          longitude:
            Number(
              assignment.location_longitude
            ),

          radius_meters:
            Number(
              assignment.location_radius
            ),
        }
      },
      [
        assignment,
      ]
    )


  // =========================================================
  // LOCAIS QUE O GPS PODE USAR
  // =========================================================

  const validationLocations =
    useMemo(
      () => {
        if (assignedLocation) {
          return [
            assignedLocation,
          ]
        }


        return locations
      },
      [
        assignedLocation,
        locations,
      ]
    )


  // =========================================================
  // LOCAL MAIS PRÓXIMO
  // =========================================================

  const nearestLocation =
    useMemo(
      () =>
        findNearestLocation(
          position,
          validationLocations
        ),
      [
        position,
        validationLocations,
      ]
    )


  // =========================================================
  // CARREGAR ALOCAÇÃO
  // =========================================================

  const loadAssignment =
    useCallback(
      async () => {
        try {
          setAssignmentLoading(
            true
          )


          const data =
            await getTodayAssignment()


          setAssignment(
            data
          )
        } catch (error) {
          console.error(
            'Erro ao carregar alocação:',
            error
          )


          setAssignment(
            null
          )
        } finally {
          setAssignmentLoading(
            false
          )
        }
      },
      []
    )


  // =========================================================
  // CARREGAR DASHBOARD
  // =========================================================

  const loadDashboard =
    useCallback(
      async () => {
        try {
          setLoadingDashboard(
            true
          )


          setDashboardError(
            null
          )


          const employeeData =
            await getCurrentEmployee()


          setEmployee(
            employeeData
          )


          const [
            locationsData,
          ] =
            await Promise.all([

              getCompanyLocations(
                employeeData.company_id
              ),

              loadTodayEntries(
                employeeData.id
              ),

              loadNextEntryType(
                employeeData.id
              ),

              loadAssignment(),

            ])


          setLocations(
            locationsData
          )
        } catch (error) {
          console.error(
            'Erro ao carregar dashboard:',
            error
          )


          setDashboardError(
            error.message ||
            'Não foi possível carregar o dashboard.'
          )
        } finally {
          setLoadingDashboard(
            false
          )
        }
      },
      [
        loadTodayEntries,
        loadNextEntryType,
        loadAssignment,
      ]
    )


  // =========================================================
  // INICIALIZAÇÃO
  // =========================================================

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])


  // =========================================================
  // GPS AUTOMÁTICO
  // =========================================================

  useEffect(() => {
    requestLocation()
      .catch(() => {
        // erro tratado pelo hook
      })
  }, [requestLocation])


  // =========================================================
  // BATER PONTO
  // =========================================================

  async function handlePunch() {
    clearMessages()


    if (!employee?.id) {
      return
    }


    try {
      const currentPosition =
        await requestLocation()


      await punch({
        position:
          currentPosition,
      })


      await Promise.all([

        loadTodayEntries(
          employee.id
        ),

        loadNextEntryType(
          employee.id
        ),

        loadAssignment(),

      ])
    } catch (error) {
      console.error(
        'Erro ao registrar ponto:',
        error
      )
    }
  }


  // =========================================================
  // LOGOUT
  // =========================================================

  async function handleLogout() {
    try {
      await logout()
    } catch (error) {
      console.error(
        'Erro ao sair:',
        error
      )
    }
  }


  // =========================================================
  // LOADING
  // =========================================================

  if (loadingDashboard) {
    return (
      <main className="point-loading-page">

        <span className="point-loading-spinner" />

        <strong>
          Carregando seu ponto...
        </strong>

      </main>
    )
  }


  // =========================================================
  // ERRO
  // =========================================================

  if (dashboardError) {
    return (
      <main className="point-loading-page">

        <div className="point-message point-message--error">
          {dashboardError}
        </div>

      </main>
    )
  }


  const finished =
    nextEntryType ===
    'finished'


  return (
    <main className="employee-dashboard">

      <div className="employee-dashboard__container">


        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="employee-header">

          <div>

            <span className="employee-header__brand">
              Ponto Digital
            </span>


            <h1>
              Olá,{' '}
              {profile?.full_name ||
                employee?.full_name ||
                'Funcionário'}
            </h1>


            <p>
              Registre sua jornada
              com segurança.
            </p>

          </div>


          <div className="employee-header__actions">


            {/* AJUSTE DE PONTO */}

            <Link
              to="/app/ajustes"
              className="employee-header-button"
              title="Ajuste de ponto"
            >
              <FilePenLine
                size={20}
              />
            </Link>


            {/* PAINEL RH */}

            {isRH && (
              <Link
                to="/rh"
                className="employee-header-button"
                title="Painel do RH"
              >
                <LayoutDashboard
                  size={20}
                />
              </Link>
            )}


            {/* LOCAIS */}

            {isRH && (
              <Link
                to="/rh/locais"
                className="employee-header-button"
                title="Locais autorizados"
              >
                <MapPinned
                  size={20}
                />
              </Link>
            )}


            {/* CONFIGURAÇÕES */}

            <button
              type="button"
              className="employee-header-button"
              title="Configurações"
            >
              <Settings
                size={20}
              />
            </button>


            {/* LOGOUT */}

            <button
              type="button"
              className="
                employee-header-button
                employee-header-button--logout
              "
              title="Sair"
              onClick={
                handleLogout
              }
            >
              <LogOut
                size={20}
              />
            </button>

          </div>

        </header>


        {/* ====================================================
            RELÓGIO OFICIAL
        ==================================================== */}

        <ClockCard />


        {/* ====================================================
            ALOCAÇÃO / ATIVIDADE DO DIA
        ==================================================== */}

        <TodayAssignmentCard
          assignment={
            assignment
          }
          loading={
            assignmentLoading
          }
        />


        {/* ====================================================
            LOCALIZAÇÃO
        ==================================================== */}

        <LocationValidationCard

          position={
            position
          }

          nearestLocation={
            nearestLocation
          }

          loading={
            locationLoading
          }

          error={
            locationError
          }

          onRefresh={
            requestLocation
          }

        />


        {/* ====================================================
            FACIAL
        ==================================================== */}

        <section className="face-future-card">

          <div className="face-future-card__icon">

            <ShieldCheck
              size={22}
            />

          </div>


          <div>

            <strong>
              Reconhecimento facial
            </strong>

            <span>
              Será ativado na próxima
              etapa de segurança.
            </span>

          </div>


          <span className="face-future-badge">
            Em breve
          </span>

        </section>


        {/* ====================================================
            PRÓXIMO PONTO
        ==================================================== */}

        <NextPunchCard
          entryType={
            nextEntryType
          }
        />


        {pointError && (
          <div className="point-message point-message--error">
            {pointError}
          </div>
        )}


        {pointSuccess && (
          <div className="point-message point-message--success">
            {pointSuccess}
          </div>
        )}


        {/* ====================================================
            BOTÃO BATER PONTO
        ==================================================== */}

        <PunchButton

          loading={
            registering
          }

          finished={
            finished
          }

          disabled={
            !position ||
            locationLoading
          }

          onClick={
            handlePunch
          }

        />


        {/* ====================================================
            RESUMO
        ==================================================== */}

        <WorkdaySummary

          workedMinutes={
            workedMinutes
          }

          schedule={
            employee?.work_schedules
          }

        />


        {/* ====================================================
            JORNADA DO DIA
        ==================================================== */}

        <PunchTimeline
          entries={
            entries
          }
        />


        <footer className="employee-dashboard-footer">

          <ShieldCheck
            size={15}
          />

          O horário oficial é
          registrado pelo servidor.

        </footer>


      </div>

    </main>
  )
}