import {
  useCallback,
  useState,
} from 'react'

import {
  getCurrentPosition,
} from '../services/geolocationService'

export function useGeolocation() {
  const [
    position,
    setPosition,
  ] = useState(null)

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState(null)

  const requestLocation =
    useCallback(
      async () => {
        try {
          setLoading(true)
          setError(null)

          const result =
            await getCurrentPosition()

          setPosition(result)

          return result
        } catch (error) {
          setError(
            error.message ||
            'Não foi possível obter sua localização.'
          )

          throw error
        } finally {
          setLoading(false)
        }
      },
      []
    )

  function clearLocation() {
    setPosition(null)
    setError(null)
  }

  return {
    position,

    loading,

    error,

    requestLocation,

    clearLocation,
  }
}