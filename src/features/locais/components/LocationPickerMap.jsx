import {
  useEffect,
  useRef,
} from 'react'

import L from 'leaflet'

import 'leaflet/dist/leaflet.css'


export default function LocationPickerMap({
  latitude,
  longitude,
  radiusMeters = 150,
  onChange,
}) {

  const mapContainerRef =
    useRef(null)

  const mapRef =
    useRef(null)

  const markerRef =
    useRef(null)

  const circleRef =
    useRef(null)


  // =========================================================
  // VALIDAR COORDENADAS
  // =========================================================

  const lat =
    Number(latitude)

  const lng =
    Number(longitude)


  const hasCoordinates =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180


  // =========================================================
  // CRIAR MAPA
  // =========================================================

  useEffect(() => {

    if (
      !mapContainerRef.current ||
      mapRef.current
    ) {
      return
    }


    const initialPosition =
      hasCoordinates
        ? [
            lat,
            lng,
          ]
        : [
            -23.55052,
            -46.633308,
          ]


    const map =
      L.map(
        mapContainerRef.current,
        {
          zoomControl:
            true,

          attributionControl:
            true,
        }
      )
        .setView(
          initialPosition,
          hasCoordinates
            ? 18
            : 12
        )


    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom:
          20,

        attribution:
          '&copy; OpenStreetMap',
      }
    )
      .addTo(map)


    mapRef.current =
      map


    // =======================================================
    // AJUSTAR TAMANHO
    // =======================================================

    setTimeout(
      () => {
        map.invalidateSize()
      },
      100
    )


    return () => {

      map.remove()

      mapRef.current =
        null

      markerRef.current =
        null

      circleRef.current =
        null

    }

  }, [])


  // =========================================================
  // ATUALIZAR PIN E CÍRCULO
  // =========================================================

  useEffect(() => {

    const map =
      mapRef.current


    if (
      !map ||
      !hasCoordinates
    ) {
      return
    }


    const position =
      [
        lat,
        lng,
      ]


    // =======================================================
    // ÍCONE CUSTOMIZADO
    //
    // Evita problema dos ícones padrão do Leaflet no Vite.
    // =======================================================

    const markerIcon =
      L.divIcon({

        className:
          'location-map-marker',

        html:
          `
            <div
              style="
                width: 34px;
                height: 34px;
                border-radius: 50% 50% 50% 0;
                background: #2563eb;
                border: 4px solid white;
                box-shadow: 0 5px 18px rgba(0,0,0,.28);
                transform: rotate(-45deg);
              "
            >
              <div
                style="
                  width: 10px;
                  height: 10px;
                  border-radius: 50%;
                  background: white;
                  position: absolute;
                  left: 8px;
                  top: 8px;
                "
              ></div>
            </div>
          `,

        iconSize:
          [
            34,
            34,
          ],

        iconAnchor:
          [
            17,
            34,
          ],

      })


    // =======================================================
    // MARKER
    // =======================================================

    if (!markerRef.current) {

      const marker =
        L.marker(
          position,
          {
            draggable:
              true,

            icon:
              markerIcon,
          }
        )
          .addTo(map)


      marker.on(
        'dragend',
        () => {

          const newPosition =
            marker.getLatLng()


          onChange?.({

            latitude:
              Number(
                newPosition.lat
                  .toFixed(7)
              ),

            longitude:
              Number(
                newPosition.lng
                  .toFixed(7)
              ),

          })

        }
      )


      markerRef.current =
        marker

    } else {

      markerRef.current
        .setLatLng(
          position
        )

    }


    // =======================================================
    // CÍRCULO DA GEOFENCE
    // =======================================================

    if (!circleRef.current) {

      circleRef.current =
        L.circle(
          position,
          {
            radius:
              Number(
                radiusMeters
              ) || 150,
          }
        )
          .addTo(map)

    } else {

      circleRef.current
        .setLatLng(
          position
        )

      circleRef.current
        .setRadius(
          Number(
            radiusMeters
          ) || 150
        )

    }


    // =======================================================
    // CENTRALIZAR NO PONTO
    // =======================================================

    map.setView(
      position,
      Math.max(
        map.getZoom(),
        17
      )
    )


    setTimeout(
      () => {
        map.invalidateSize()
      },
      50
    )

  }, [
    lat,
    lng,
    hasCoordinates,
    radiusMeters,
    onChange,
  ])


  // =========================================================
  // CLIQUE NO MAPA TAMBÉM MOVE O PIN
  // =========================================================

  useEffect(() => {

    const map =
      mapRef.current


    if (!map) {
      return
    }


    function handleMapClick(
      event
    ) {

      onChange?.({

        latitude:
          Number(
            event.latlng.lat
              .toFixed(7)
          ),

        longitude:
          Number(
            event.latlng.lng
              .toFixed(7)
          ),

      })

    }


    map.on(
      'click',
      handleMapClick
    )


    return () => {

      map.off(
        'click',
        handleMapClick
      )

    }

  }, [
    onChange,
  ])


  return (
    <section
      style={{
        display:
          'grid',

        gap:
          '10px',
      }}
    >

      <div>

        <strong
          style={{
            display:
              'block',

            marginBottom:
              '4px',
          }}
        >
          Ajuste o ponto no mapa
        </strong>


        <span
          style={{
            display:
              'block',

            fontSize:
              '13px',

            opacity:
              0.72,

            lineHeight:
              1.45,
          }}
        >
          Arraste o marcador ou clique
          exatamente no prédio onde o
          funcionário deverá estar.
        </span>

      </div>


      <div
        ref={
          mapContainerRef
        }
        style={{
          width:
            '100%',

          height:
            '330px',

          borderRadius:
            '18px',

          overflow:
            'hidden',

          border:
            '1px solid rgba(148, 163, 184, 0.35)',

          position:
            'relative',

          zIndex:
            0,
        }}
      />


      {hasCoordinates && (

        <small
          style={{
            lineHeight:
              1.5,

            opacity:
              0.72,
          }}
        >
          O círculo representa aproximadamente
          a área permitida de {Number(
            radiusMeters
          ) || 150} metros.
        </small>

      )}

    </section>
  )
}