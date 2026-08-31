import {
  useCallback,
  useState,
} from 'react'

import {
  getNextEntryType,
  registerPoint,
} from '../services/pointService'

export function usePoint() {
  const [
    nextEntryType,
    setNextEntryType,
  ] = useState(
    'clock_in'
  )

  const [
    registering,
    setRegistering,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState(null)

  const [
    success,
    setSuccess,
  ] = useState(null)

  const loadNextEntryType =
    useCallback(
      async employeeId => {
        if (!employeeId) {
          return
        }

        try {
          const next =
            await getNextEntryType(
              employeeId
            )

          setNextEntryType(
            next
          )

          return next
        } catch (error) {
          console.error(error)

          setError(
            'Não foi possível identificar o próximo registro.'
          )
        }
      },
      []
    )

  async function punch({
    position,
  }) {
    if (!position) {
      throw new Error(
        'Localização não disponível.'
      )
    }

    try {
      setRegistering(true)
      setError(null)
      setSuccess(null)

      const result =
        await registerPoint({
          entryType:
            nextEntryType,

          latitude:
            position.latitude,

          longitude:
            position.longitude,

          accuracy:
            position.accuracy,
        })

      setSuccess(
        'Ponto registrado com sucesso.'
      )

      return result
    } catch (error) {
      console.error(
        'Erro ao registrar ponto:',
        error
      )

      const message =
        error.message ||
        'Não foi possível registrar o ponto.'

      setError(message)

      throw error
    } finally {
      setRegistering(false)
    }
  }

  function clearMessages() {
    setError(null)
    setSuccess(null)
  }

  return {
    nextEntryType,

    registering,

    error,

    success,

    loadNextEntryType,

    punch,

    clearMessages,
  }
}