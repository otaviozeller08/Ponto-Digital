import { useState } from 'react'

import {
  getCurrentPosition,
} from '../services/geolocationService'

export function useGeolocation() {
  const [position, setPosition] =
    useState(null)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState(null)

  async function requestLocation() {
    try {
      setLoading(true)
      setError(null)

      const currentPosition =
        await getCurrentPosition()

      setPosition(
        currentPosition
      )

      return currentPosition
    } catch (error) {
      setError(error.message)

      throw error
    } finally {
      setLoading(false)
    }
  }

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