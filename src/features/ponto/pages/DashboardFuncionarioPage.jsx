import {
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
  getCompanyLocations,
  getCurrentEmployee,
  findNearestLocation,
} from '../services/pointService'

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


  // ========================================================
  // LOCAL MAIS PRÓXIMO
  // ========================================================

  const nearestLocation =
    useMemo(
      () =>
        findNearestLocation(
          position,
          locations
        ),
      [
        position,
        locations,
      ]
    )


  // ========================================================
  // CARREGAR DASHBOARD
  // ========================================================

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
            ])

          setLocations(
            locationsData
          )
        } catch (error) {
          console.error(
            'Erro no dashboard:',
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
      ]
    )


  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])


  // ========================================================
  // GPS AUTOMÁTICO
  // ========================================================

  useEffect(() => {
    requestLocation()
      .catch(() => {
        // erro já tratado
        // pelo hook
      })
  }, [requestLocation])


  // ========================================================
  // BATER PONTO
  // ========================================================

  async function handlePunch() {
    clearMessages()

    let currentPosition =
      position

    try {
      // Sempre busca uma posição nova
      // antes de registrar o ponto.

      currentPosition =
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
      ])
    } catch (error) {
      console.error(error)
    }
  }


  // ========================================================
  // LOADING
  // ========================================================

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


  // ========================================================
  // ERRO
  // ========================================================

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

        {/* ================================================
            HEADER
        ================================================= */}

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

            <button
              type="button"
              className="employee-header-button"
              title="Configurações"
            >
              <Settings
                size={20}
              />
            </button>

            <button
              type="button"
              className="employee-header-button employee-header-button--logout"
              title="Sair"
              onClick={logout}
            >
              <LogOut
                size={20}
              />
            </button>
          </div>
        </header>


        {/* ================================================
            RELÓGIO
        ================================================= */}

        <ClockCard />


        {/* ================================================
            LOCALIZAÇÃO
        ================================================= */}

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


        {/* ================================================
            FACIAL - RESERVADO
        ================================================= */}

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


        {/* ================================================
            PRÓXIMO PONTO
        ================================================= */}

        <NextPunchCard
          entryType={
            nextEntryType
          }
        />


        {/* ================================================
            MENSAGENS
        ================================================= */}

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


        {/* ================================================
            BOTÃO
        ================================================= */}

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


        {/* ================================================
            RESUMO
        ================================================= */}

        <WorkdaySummary
          workedMinutes={
            workedMinutes
          }

          schedule={
            employee
              ?.work_schedules
          }
        />


        {/* ================================================
            TIMELINE
        ================================================= */}

        <PunchTimeline
          entries={
            entries
          }
        />


        {/* ================================================
            RODAPÉ
        ================================================= */}

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