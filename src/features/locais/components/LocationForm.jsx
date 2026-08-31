import {
  LocateFixed,
  MapPin,
  Save,
} from 'lucide-react'

import {
  useState,
} from 'react'

import Button from '../../../components/ui/Button'

import {
  useGeolocation,
} from '../../geolocation/hooks/useGeolocation'

import RadiusField from './RadiusField'

export default function LocationForm({
  onSubmit,
  saving = false,
}) {
  const {
    position,
    loading: gpsLoading,
    error: gpsError,
    requestLocation,
  } = useGeolocation()

  const [name, setName] =
    useState('')

  const [address, setAddress] =
    useState('')

  const [
    description,
    setDescription,
  ] = useState('')

  const [
    radiusMeters,
    setRadiusMeters,
  ] = useState(150)

  const [formError, setFormError] =
    useState('')

  async function handleGPS() {
    setFormError('')

    try {
      await requestLocation()
    } catch {
      // erro exibido abaixo
    }
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault()

    setFormError('')

    if (!name.trim()) {
      setFormError(
        'Informe o nome do local.'
      )

      return
    }

    if (!position) {
      setFormError(
        'Capture a localização GPS antes de salvar.'
      )

      return
    }

    const radius =
      Number(radiusMeters)

    if (
      !radius ||
      radius < 20
    ) {
      setFormError(
        'O raio deve ter pelo menos 20 metros.'
      )

      return
    }

    await onSubmit({
      name,
      address,
      description,

      latitude:
        position.latitude,

      longitude:
        position.longitude,

      accuracy:
        position.accuracy,

      radiusMeters:
        radius,
    })
  }

  return (
    <form
      className="location-form"
      onSubmit={handleSubmit}
    >
      <div className="location-form__header">
        <div>
          <span>
            Novo local autorizado
          </span>

          <h2>
            Cadastrar local
          </h2>
        </div>

        <MapPin
          size={28}
        />
      </div>

      <div className="location-field">
        <label htmlFor="location-name">
          Nome do local
        </label>

        <input
          id="location-name"
          type="text"
          value={name}
          disabled={saving}
          placeholder="Ex.: Sede Sinalert"
          onChange={event =>
            setName(
              event.target.value
            )
          }
        />
      </div>

      <div className="location-field">
        <label htmlFor="location-address">
          Endereço
        </label>

        <input
          id="location-address"
          type="text"
          value={address}
          disabled={saving}
          placeholder="Ex.: Rua Daniel Rossi, 308"
          onChange={event =>
            setAddress(
              event.target.value
            )
          }
        />

        <small>
          Esse campo é apenas
          descritivo. A validação
          real usa GPS.
        </small>
      </div>

      <div className="location-field">
        <label htmlFor="location-description">
          Descrição
        </label>

        <textarea
          id="location-description"
          value={description}
          disabled={saving}
          rows={3}
          placeholder="Ex.: Sede principal da empresa"
          onChange={event =>
            setDescription(
              event.target.value
            )
          }
        />
      </div>

      <section className="gps-capture-card">
        <div className="gps-capture-card__top">
          <div className="gps-capture-icon">
            <LocateFixed
              size={24}
            />
          </div>

          <div>
            <strong>
              Localização GPS
            </strong>

            <span>
              Use a posição atual
              deste dispositivo.
            </span>
          </div>
        </div>

        <button
          type="button"
          className="gps-capture-button"
          disabled={
            gpsLoading ||
            saving
          }
          onClick={handleGPS}
        >
          <LocateFixed
            size={19}
          />

          {gpsLoading
            ? 'Obtendo localização...'
            : position
              ? 'Atualizar localização'
              : 'Usar minha localização atual'}
        </button>

        {position && (
          <div className="gps-result">
            <div>
              <span>
                Latitude
              </span>

              <strong>
                {position.latitude.toFixed(
                  6
                )}
              </strong>
            </div>

            <div>
              <span>
                Longitude
              </span>

              <strong>
                {position.longitude.toFixed(
                  6
                )}
              </strong>
            </div>

            <div>
              <span>
                Precisão
              </span>

              <strong>
                ±
                {Math.round(
                  position.accuracy
                )}
                m
              </strong>
            </div>
          </div>
        )}

        {gpsError && (
          <div className="location-error">
            {gpsError}
          </div>
        )}
      </section>

      <RadiusField
        value={radiusMeters}
        onChange={
          setRadiusMeters
        }
        disabled={saving}
      />

      {formError && (
        <div className="location-error">
          {formError}
        </div>
      )}

      <Button
        type="submit"
        loading={saving}
      >
        <Save size={19} />

        Salvar local
      </Button>
    </form>
  )
}