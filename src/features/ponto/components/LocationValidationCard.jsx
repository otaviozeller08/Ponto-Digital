import {
  CheckCircle2,
  LocateFixed,
  MapPin,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react'

export default function LocationValidationCard({
  position,
  nearestLocation,
  loading,
  error,
  onRefresh,
}) {
  const inside =
    Boolean(
      nearestLocation?.inside
    )

  return (
    <section className="point-location-card">
      <header className="point-section-header">
        <div>
          <MapPin size={21} />

          <span>
            Localização
          </span>
        </div>

        <button
          type="button"
          className="point-icon-button"
          disabled={loading}
          onClick={onRefresh}
          aria-label="Atualizar localização"
        >
          <RefreshCw
            size={18}
            className={
              loading
                ? 'point-spin'
                : ''
            }
          />
        </button>
      </header>

      {loading && !position && (
        <div className="point-location-state">
          <LocateFixed
            size={30}
          />

          <div>
            <strong>
              Localizando...
            </strong>

            <span>
              Aguarde enquanto
              encontramos sua posição.
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="point-message point-message--error">
          <TriangleAlert
            size={19}
          />

          {error}
        </div>
      )}

      {position &&
        nearestLocation && (
          <>
            <div
              className={[
                'point-location-status',

                inside
                  ? 'point-location-status--success'
                  : 'point-location-status--warning',
              ].join(' ')}
            >
              {inside ? (
                <CheckCircle2
                  size={26}
                />
              ) : (
                <TriangleAlert
                  size={26}
                />
              )}

              <div>
                <strong>
                  {inside
                    ? 'Localização validada'
                    : 'Fora do raio autorizado'}
                </strong>

                <span>
                  {nearestLocation.name}
                </span>
              </div>
            </div>

            <div className="point-location-details">
              <div>
                <span>
                  Distância
                </span>

                <strong>
                  {Math.round(
                    nearestLocation.distance
                  )}
                  m
                </strong>
              </div>

              <div>
                <span>
                  Raio
                </span>

                <strong>
                  {
                    nearestLocation.radius_meters
                  }
                  m
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
          </>
        )}

      {position &&
        !nearestLocation && (
          <div className="point-message point-message--warning">
            <TriangleAlert
              size={19}
            />

            Nenhum local autorizado
            cadastrado.
          </div>
        )}
    </section>
  )
}