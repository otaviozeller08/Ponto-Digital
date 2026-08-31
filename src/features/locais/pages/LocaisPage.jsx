import {
  ArrowLeft,
  MapPinned,
  Plus,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import {
  useAuth,
} from '../../auth/hooks/useAuth'

import LocationForm from '../components/LocationForm'
import LocationCard from '../components/LocationCard'

import {
  createLocation,
  getLocations,
} from '../services/locationService'

export default function LocaisPage() {
  const {
    profile,
    isRH,
  } = useAuth()

  const [
    locations,
    setLocations,
  ] = useState([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    showForm,
    setShowForm,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  async function loadLocations() {
    try {
      setLoading(true)
      setError('')

      const data =
        await getLocations()

      setLocations(data)
    } catch (error) {
      console.error(error)

      setError(
        'Não foi possível carregar os locais.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLocations()
  }, [])

  async function handleCreateLocation(
    values
  ) {
    try {
      setSaving(true)
      setError('')

      await createLocation({
        companyId:
          profile.company_id,

        name:
          values.name,

        description:
          values.description,

        address:
          values.address,

        latitude:
          values.latitude,

        longitude:
          values.longitude,

        radiusMeters:
          values.radiusMeters,
      })

      await loadLocations()

      setShowForm(false)
    } catch (error) {
      console.error(error)

      setError(
        error.message ||
        'Não foi possível salvar o local.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (!isRH) {
    return (
      <main className="location-page">
        <div className="location-empty">
          Você não possui permissão
          para gerenciar locais.
        </div>
      </main>
    )
  }

  return (
    <main className="location-page">
      <div className="location-page__container">
        <header className="location-page__header">
          <div className="location-page__title">
            <Link
              to="/app"
              className="location-back"
            >
              <ArrowLeft
                size={20}
              />
            </Link>

            <div>
              <span>
                Administração
              </span>

              <h1>
                Locais autorizados
              </h1>
            </div>
          </div>

          <button
            type="button"
            className="location-add-button"
            onClick={() =>
              setShowForm(
                current =>
                  !current
              )
            }
          >
            <Plus size={19} />

            Novo local
          </button>
        </header>

        <section className="location-summary">
          <div className="location-summary__icon">
            <MapPinned
              size={27}
            />
          </div>

          <div>
            <strong>
              {locations.length}
            </strong>

            <span>
              locais cadastrados
            </span>
          </div>
        </section>

        {showForm && (
          <LocationForm
            saving={saving}
            onSubmit={
              handleCreateLocation
            }
          />
        )}

        {error && (
          <div className="location-error">
            {error}
          </div>
        )}

        <section className="location-list">
          <div className="location-list__header">
            <h2>
              Locais
            </h2>
          </div>

          {loading ? (
            <div className="location-empty">
              Carregando locais...
            </div>
          ) : locations.length === 0 ? (
            <div className="location-empty">
              Nenhum local cadastrado.
            </div>
          ) : (
            locations.map(
              location => (
                <LocationCard
                  key={
                    location.id
                  }
                  location={
                    location
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