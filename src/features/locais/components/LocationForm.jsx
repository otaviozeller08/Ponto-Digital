import {
  ExternalLink,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  Save,
} from 'lucide-react'

import {
  useCallback,
  useMemo,
  useState,
} from 'react'

import Button from '../../../components/ui/Button'

import {
  useGeolocation,
} from '../../geolocation/hooks/useGeolocation'

import {
  createGoogleMapsUrl,
  geocodeAddress,
  parseLocationInput,
  validateCoordinates,
} from '../services/geocodingService'

import LocationPickerMap from './LocationPickerMap'
import RadiusField from './RadiusField'


export default function LocationForm({
  onSubmit,
  saving = false,
}) {

  const {
    loading:
      gpsLoading,

    error:
      gpsError,

    requestLocation,
  } =
    useGeolocation()


  const [
    name,
    setName,
  ] =
    useState('')


  const [
    address,
    setAddress,
  ] =
    useState('')


  const [
    description,
    setDescription,
  ] =
    useState('')


  const [
    latitude,
    setLatitude,
  ] =
    useState('')


  const [
    longitude,
    setLongitude,
  ] =
    useState('')


  const [
    locationInput,
    setLocationInput,
  ] =
    useState('')


  const [
    radiusMeters,
    setRadiusMeters,
  ] =
    useState(150)


  const [
    addressLoading,
    setAddressLoading,
  ] =
    useState(false)


  const [
    locationInputLoading,
    setLocationInputLoading,
  ] =
    useState(false)


  const [
    formError,
    setFormError,
  ] =
    useState('')


  const [
    locationSuccess,
    setLocationSuccess,
  ] =
    useState('')


  // =========================================================
  // COORDENADAS
  // =========================================================

  const latitudeNumber =
    Number(latitude)


  const longitudeNumber =
    Number(longitude)


  const coordinatesValid =
    useMemo(
      () =>
        validateCoordinates({

          latitude:
            latitudeNumber,

          longitude:
            longitudeNumber,

        }),
      [
        latitudeNumber,
        longitudeNumber,
      ]
    )


  // =========================================================
  // MAPS
  // =========================================================

  const mapsUrl =
    useMemo(
      () => {

        if (
          !coordinatesValid
        ) {
          return null
        }


        return createGoogleMapsUrl({

          latitude:
            latitudeNumber,

          longitude:
            longitudeNumber,

        })

      },
      [
        coordinatesValid,
        latitudeNumber,
        longitudeNumber,
      ]
    )


  // =========================================================
  // MENSAGENS
  // =========================================================

  function clearMessages() {

    setFormError('')

    setLocationSuccess('')

  }


  // =========================================================
  // MAPA ALTEROU COORDENADA
  // =========================================================

  const handleMapChange =
    useCallback(
      ({
        latitude:
          newLatitude,

        longitude:
          newLongitude,
      }) => {

        setLatitude(
          String(
            newLatitude
          )
        )


        setLongitude(
          String(
            newLongitude
          )
        )


        setLocationSuccess(
          'Ponto ajustado manualmente no mapa.'
        )


        setFormError('')

      },
      []
    )


  // =========================================================
  // GPS ATUAL
  // =========================================================

  async function handleGPS() {

    clearMessages()


    try {

      const currentPosition =
        await requestLocation()


      if (!currentPosition) {

        throw new Error(
          'Não foi possível obter a localização atual.'
        )

      }


      setLatitude(
        String(
          currentPosition.latitude
        )
      )


      setLongitude(
        String(
          currentPosition.longitude
        )
      )


      setLocationSuccess(
        `Localização atual capturada com precisão aproximada de ±${Math.round(
          currentPosition.accuracy
        )}m.`
      )

    } catch (error) {

      console.error(
        'Erro ao obter GPS:',
        error
      )


      setFormError(
        error?.message ||
        'Não foi possível obter sua localização.'
      )

    }

  }


  // =========================================================
  // BUSCAR ENDEREÇO
  // =========================================================

  async function handleAddressSearch() {

    clearMessages()


    if (!address.trim()) {

      setFormError(
        'Digite o endereço antes de buscar.'
      )

      return
    }


    try {

      setAddressLoading(
        true
      )


      const result =
        await geocodeAddress(
          address
        )


      setLatitude(
        String(
          result.latitude
        )
      )


      setLongitude(
        String(
          result.longitude
        )
      )


      setLocationSuccess(
        'Endereço localizado. Agora confira e ajuste o marcador no mapa.'
      )

    } catch (error) {

      console.error(
        'Erro ao buscar endereço:',
        error
      )


      setFormError(
        error?.message ||
        'Não foi possível localizar esse endereço.'
      )

    } finally {

      setAddressLoading(
        false
      )

    }

  }


  // =========================================================
  // COORDENADAS / MAPS
  // =========================================================

  async function handleLocationInput() {

    clearMessages()


    try {

      setLocationInputLoading(
        true
      )


      const result =
        parseLocationInput(
          locationInput
        )


      setLatitude(
        String(
          result.latitude
        )
      )


      setLongitude(
        String(
          result.longitude
        )
      )


      setLocationSuccess(
        'Localização importada. Confira o marcador no mapa.'
      )

    } catch (error) {

      console.error(
        'Erro ao interpretar localização:',
        error
      )


      setFormError(
        error?.message ||
        'Não foi possível interpretar a localização informada.'
      )

    } finally {

      setLocationInputLoading(
        false
      )

    }

  }


  // =========================================================
  // SALVAR
  // =========================================================

  async function handleSubmit(
    event
  ) {

    event.preventDefault()


    clearMessages()


    if (!name.trim()) {

      setFormError(
        'Informe o nome do local.'
      )

      return
    }


    if (!address.trim()) {

      setFormError(
        'Informe o endereço do local.'
      )

      return
    }


    if (
      !coordinatesValid
    ) {

      setFormError(
        'Informe uma latitude e longitude válidas.'
      )

      return
    }


    const radius =
      Number(
        radiusMeters
      )


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
        latitudeNumber,

      longitude:
        longitudeNumber,

      radiusMeters:
        radius,

    })
  }


  return (
    <form
      className="location-form"
      onSubmit={
        handleSubmit
      }
    >

      {/* ====================================================
          HEADER
      ==================================================== */}

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


      {/* ====================================================
          NOME
      ==================================================== */}

      <div className="location-field">

        <label htmlFor="location-name">

          Nome do local

        </label>


        <input
          id="location-name"
          type="text"
          value={
            name
          }
          disabled={
            saving
          }
          placeholder="Ex.: Cliente República"
          onChange={
            event =>
              setName(
                event.target.value
              )
          }
        />

      </div>


      {/* ====================================================
          ENDEREÇO
      ==================================================== */}

      <div className="location-field">

        <label htmlFor="location-address">

          Endereço

        </label>


        <input
          id="location-address"
          type="text"
          value={
            address
          }
          disabled={
            saving ||
            addressLoading
          }
          placeholder="Ex.: Rua Dr. Bráulio Gomes, 36, República, São Paulo - SP"
          onChange={
            event =>
              setAddress(
                event.target.value
              )
          }
        />


        <small>

          Informe rua, número, bairro,
          cidade e estado sempre que possível.

        </small>


        <button
          type="button"
          className="gps-capture-button"
          disabled={
            saving ||
            addressLoading ||
            !address.trim()
          }
          onClick={
            handleAddressSearch
          }
        >

          <Search
            size={18}
          />


          {addressLoading
            ? 'Buscando endereço...'
            : 'Buscar endereço'
          }

        </button>

      </div>


      {/* ====================================================
          IMPORTAR LOCALIZAÇÃO
      ==================================================== */}

      <section className="gps-capture-card">

        <div className="gps-capture-card__top">

          <div className="gps-capture-icon">

            <Navigation
              size={24}
            />

          </div>


          <div>

            <strong>
              Importar localização
            </strong>

            <span>

              Cole coordenadas ou
              um link completo do
              Google Maps.

            </span>

          </div>

        </div>


        <div className="location-field">

          <input
            type="text"
            value={
              locationInput
            }
            disabled={
              saving ||
              locationInputLoading
            }
            placeholder="-23.499221, -46.631544"
            onChange={
              event =>
                setLocationInput(
                  event.target.value
                )
            }
          />

        </div>


        <button
          type="button"
          className="gps-capture-button"
          disabled={
            saving ||
            locationInputLoading ||
            !locationInput.trim()
          }
          onClick={
            handleLocationInput
          }
        >

          <Navigation
            size={18}
          />


          {locationInputLoading
            ? 'Importando...'
            : 'Usar localização informada'
          }

        </button>

      </section>


      {/* ====================================================
          COORDENADAS
      ==================================================== */}

      <section className="gps-capture-card">

        <div className="gps-capture-card__top">

          <div className="gps-capture-icon">

            <LocateFixed
              size={24}
            />

          </div>


          <div>

            <strong>
              Coordenadas da geofence
            </strong>

            <span>

              Estas coordenadas definem
              o centro da área permitida.

            </span>

          </div>

        </div>


        <div className="gps-result">

          <div>

            <span>
              Latitude
            </span>

            <input
              type="number"
              step="any"
              value={
                latitude
              }
              disabled={
                saving
              }
              placeholder="-23.499221"
              onChange={
                event => {

                  clearMessages()

                  setLatitude(
                    event.target.value
                  )

                }
              }
            />

          </div>


          <div>

            <span>
              Longitude
            </span>

            <input
              type="number"
              step="any"
              value={
                longitude
              }
              disabled={
                saving
              }
              placeholder="-46.631544"
              onChange={
                event => {

                  clearMessages()

                  setLongitude(
                    event.target.value
                  )

                }
              }
            />

          </div>

        </div>


        <button
          type="button"
          className="gps-capture-button"
          disabled={
            gpsLoading ||
            saving
          }
          onClick={
            handleGPS
          }
        >

          <LocateFixed
            size={19}
          />


          {gpsLoading
            ? 'Obtendo localização...'
            : 'Usar minha localização atual'
          }

        </button>


        {mapsUrl && (

          <a
            href={
              mapsUrl
            }
            target="_blank"
            rel="noopener noreferrer"
            className="gps-capture-button"
            style={{
              textDecoration:
                'none',

              justifyContent:
                'center',
            }}
          >

            <ExternalLink
              size={18}
            />

            Abrir no Google Maps

          </a>

        )}


        {gpsError && (

          <div className="location-error">

            {gpsError}

          </div>

        )}

      </section>


      {/* ====================================================
          MINI MAPA
      ==================================================== */}

      {coordinatesValid && (

        <section className="gps-capture-card">

          <LocationPickerMap

            latitude={
              latitudeNumber
            }

            longitude={
              longitudeNumber
            }

            radiusMeters={
              radiusMeters
            }

            onChange={
              handleMapChange
            }

          />

        </section>

      )}


      {/* ====================================================
          DESCRIÇÃO
      ==================================================== */}

      <div className="location-field">

        <label htmlFor="location-description">

          Descrição

        </label>


        <textarea
          id="location-description"
          value={
            description
          }
          disabled={
            saving
          }
          rows={3}
          placeholder="Ex.: Manutenção da central de incêndio"
          onChange={
            event =>
              setDescription(
                event.target.value
              )
          }
        />

      </div>


      {/* ====================================================
          RAIO
      ==================================================== */}

      <RadiusField
        value={
          radiusMeters
        }
        onChange={
          setRadiusMeters
        }
        disabled={
          saving
        }
      />


      {/* ====================================================
          MENSAGENS
      ==================================================== */}

      {locationSuccess && (

        <div className="point-message point-message--success">

          {locationSuccess}

        </div>

      )}


      {formError && (

        <div className="location-error">

          {formError}

        </div>

      )}


      {/* ====================================================
          SALVAR
      ==================================================== */}

      <Button
        type="submit"
        loading={
          saving
        }
      >

        <Save
          size={19}
        />

        Salvar local

      </Button>

    </form>
  )
}