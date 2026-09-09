import {
  Clock3,
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


export default function TodayRouteCard({
  route,
  loading,
}) {

  if (loading) {

    return (
      <section
        className="point-location-card"
      >

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
    <section
      className="point-location-card"
    >

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

                  background:
                    '#f8fafc',

                  border:
                    '1px solid #e2e8f0',

                  borderRadius:
                    '13px',
                }}
              >

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
                      '#2563eb',

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
                      '5px',
                  }}
                >

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


                {mapsUrl && (

                  <a
                    href={
                      mapsUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    title="Abrir no Maps"
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
                        '#2563eb',

                      background:
                        '#eff6ff',

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