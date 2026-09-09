import {
  CheckCircle2,
  Clock3,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
} from 'lucide-react'


function shortTime(
  value
) {

  if (!value) {
    return '--:--'
  }


  return String(
    value
  ).slice(
    0,
    5
  )
}


// ============================================================
// GOOGLE MAPS
// ============================================================

function createMapsUrl(
  location
) {

  if (
    location?.latitude == null ||
    location?.longitude == null
  ) {
    return null
  }


  return (
    'https://www.google.com/maps/dir/?api=1' +
    `&destination=${location.latitude},${location.longitude}`
  )
}


// ============================================================
// COMPONENTE
// ============================================================

export default function TodayRouteCard({
  route,
  entries = [],
  nearestLocation,
  loading,
}) {

  // ==========================================================
  // LOCAIS QUE JÁ POSSUEM ALGUMA BATIDA
  // ==========================================================

  const visitedLocationIds =
    new Set(
      entries
        .filter(
          entry =>
            entry.location_id
        )
        .map(
          entry =>
            entry.location_id
        )
    )


  // ==========================================================
  // PRIMEIRA PARADA AINDA NÃO VISITADA
  // ==========================================================

  const nextStop =
    route?.find(
      stop =>
        !visitedLocationIds.has(
          stop.location_id
        )
    ) ?? null


  // ==========================================================
  // LOCAL ONDE O FUNCIONÁRIO ESTÁ AGORA
  // ==========================================================

  const currentStop =
    nearestLocation?.inside
      ? route?.find(
          stop =>
            stop.location_id ===
            nearestLocation.id
        ) ?? null
      : null


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <section className="point-location-card">

        <header className="point-section-header">

          <div>

            <Route
              size={21}
            />

            <span>
              Roteiro de hoje
            </span>

          </div>

        </header>


        <div className="point-location-state">

          <span>
            Carregando roteiro...
          </span>

        </div>

      </section>
    )

  }


  if (!route?.length) {
    return null
  }


  return (
    <section className="point-location-card">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="point-section-header">

        <div>

          <Route
            size={21}
          />

          <span>
            Roteiro de hoje
          </span>

        </div>


        <strong
          style={{
            fontSize:
              '11px',

            color:
              '#2563eb',

            background:
              '#eff6ff',

            padding:
              '6px 9px',

            borderRadius:
              '999px',
          }}
        >

          {route.length}

          {' '}

          parada
          {route.length !== 1
            ? 's'
            : ''
          }

        </strong>

      </header>


      {/* ======================================================
          LISTA
      ====================================================== */}

      <div
        style={{
          display:
            'grid',

          gap:
            '10px',
        }}
      >

        {route.map(
          (
            stop,
            index
          ) => {

            const mapsUrl =
              createMapsUrl(
                stop.location
              )


            const isCurrent =
              currentStop?.id ===
              stop.id


            const wasVisited =
              visitedLocationIds.has(
                stop.location_id
              )


            const isNext =
              !isCurrent &&
              !wasVisited &&
              nextStop?.id ===
                stop.id


            let statusLabel =
              'Depois'


            let statusIcon =
              null


            let statusStyle = {

              color:
                '#64748b',

              background:
                '#f1f5f9',

              border:
                '1px solid #e2e8f0',

            }


            let cardStyle = {

              background:
                '#f8fafc',

              border:
                '1px solid #e2e8f0',

            }


            let numberBackground =
              '#2563eb'


            if (isCurrent) {

              statusLabel =
                'Você está aqui'


              statusIcon =
                <LocateFixed
                  size={12}
                />


              statusStyle = {

                color:
                  '#15803d',

                background:
                  '#f0fdf4',

                border:
                  '1px solid #bbf7d0',

              }


              cardStyle = {

                background:
                  '#f0fdf4',

                border:
                  '1px solid #86efac',

              }


              numberBackground =
                '#16a34a'

            } else if (wasVisited) {

              statusLabel =
                'Passagem registrada'


              statusIcon =
                <CheckCircle2
                  size={12}
                />


              statusStyle = {

                color:
                  '#15803d',

                background:
                  '#f0fdf4',

                border:
                  '1px solid #bbf7d0',

              }


              numberBackground =
                '#16a34a'

            } else if (isNext) {

              statusLabel =
                'Próximo destino'


              statusIcon =
                <Navigation
                  size={12}
                />


              statusStyle = {

                color:
                  '#1d4ed8',

                background:
                  '#eff6ff',

                border:
                  '1px solid #bfdbfe',

              }


              cardStyle = {

                background:
                  '#eff6ff',

                border:
                  '1px solid #93c5fd',

              }

            }


            return (
              <article
                key={
                  stop.id
                }
                style={{
                  display:
                    'flex',

                  alignItems:
                    'flex-start',

                  gap:
                    '11px',

                  padding:
                    '12px',

                  borderRadius:
                    '13px',

                  transition:
                    '0.2s',

                  ...cardStyle,
                }}
              >

                {/* NÚMERO */}

                <div
                  style={{
                    width:
                      '32px',

                    height:
                      '32px',

                    flex:
                      '0 0 32px',

                    display:
                      'flex',

                    alignItems:
                      'center',

                    justifyContent:
                      'center',

                    color:
                      '#ffffff',

                    background:
                      numberBackground,

                    borderRadius:
                      '10px',

                    fontSize:
                      '11px',

                    fontWeight:
                      '800',
                  }}
                >

                  {index + 1}

                </div>


                {/* CONTEÚDO */}

                <div
                  style={{
                    minWidth:
                      0,

                    flex:
                      1,

                    display:
                      'flex',

                    flexDirection:
                      'column',

                    gap:
                      '6px',
                  }}
                >

                  {/* STATUS */}

                  <div>

                    <span
                      style={{
                        display:
                          'inline-flex',

                        alignItems:
                          'center',

                        gap:
                          '4px',

                        padding:
                          '4px 7px',

                        borderRadius:
                          '999px',

                        fontSize:
                          '8px',

                        fontWeight:
                          '800',

                        textTransform:
                          'uppercase',

                        letterSpacing:
                          '0.3px',

                        ...statusStyle,
                      }}
                    >

                      {statusIcon}

                      {statusLabel}

                    </span>

                  </div>


                  {/* LOCAL */}

                  <strong
                    style={{
                      color:
                        '#0f172a',

                      fontSize:
                        '13px',
                    }}
                  >

                    {stop.location
                      ?.name ||
                      'Local não informado'
                    }

                  </strong>


                  {/* ENDEREÇO */}

                  {stop.location
                    ?.address && (

                    <span
                      style={{
                        display:
                          'flex',

                        alignItems:
                          'flex-start',

                        gap:
                          '5px',

                        color:
                          '#64748b',

                        fontSize:
                          '10px',
                      }}
                    >

                      <MapPin
                        size={13}
                      />

                      {
                        stop.location.address
                      }

                    </span>

                  )}


                  {/* HORÁRIO */}

                  {(stop.expected_arrival ||
                    stop.expected_departure) && (

                    <span
                      style={{
                        display:
                          'flex',

                        alignItems:
                          'center',

                        gap:
                          '5px',

                        color:
                          '#64748b',

                        fontSize:
                          '10px',
                      }}
                    >

                      <Clock3
                        size={13}
                      />

                      {shortTime(
                        stop.expected_arrival
                      )}

                      {' — '}

                      {shortTime(
                        stop.expected_departure
                      )}

                    </span>

                  )}


                  {/* OBSERVAÇÃO */}

                  {stop.notes && (

                    <span
                      style={{
                        color:
                          '#475569',

                        fontSize:
                          '10px',
                      }}
                    >

                      {stop.notes}

                    </span>

                  )}

                </div>


                {/* MAPS */}

                {mapsUrl && (

                  <a
                    href={
                      mapsUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    title="Abrir rota no Maps"
                    style={{
                      width:
                        '34px',

                      height:
                        '34px',

                      flex:
                        '0 0 34px',

                      display:
                        'flex',

                      alignItems:
                        'center',

                      justifyContent:
                        'center',

                      color:
                        isCurrent
                          ? '#15803d'
                          : '#2563eb',

                      background:
                        isCurrent
                          ? '#dcfce7'
                          : '#eff6ff',

                      borderRadius:
                        '10px',

                      textDecoration:
                        'none',
                    }}
                  >

                    <Navigation
                      size={17}
                    />

                  </a>

                )}

              </article>
            )

          }
        )}

      </div>

    </section>
  )
}