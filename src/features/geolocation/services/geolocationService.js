export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error(
          'Geolocalização não é suportada neste dispositivo.'
        )
      )

      return
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude:
            position.coords.latitude,

          longitude:
            position.coords.longitude,

          accuracy:
            position.coords.accuracy,

          altitude:
            position.coords.altitude,

          heading:
            position.coords.heading,

          speed:
            position.coords.speed,

          timestamp:
            position.timestamp,
        })
      },

      error => {
        let message =
          'Não foi possível obter sua localização.'

        if (error.code === 1) {
          message =
            'Permissão de localização negada.'
        }

        if (error.code === 2) {
          message =
            'Localização indisponível.'
        }

        if (error.code === 3) {
          message =
            'Tempo limite ao buscar localização.'
        }

        reject(
          new Error(message)
        )
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
        ...options,
      }
    )
  })
}