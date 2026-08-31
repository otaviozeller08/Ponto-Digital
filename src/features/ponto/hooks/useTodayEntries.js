import {
  useCallback,
  useState,
} from 'react'

import {
  getTodayEntries,
  getWorkedMinutes,
} from '../services/pointService'

export function useTodayEntries() {
  const [
    entries,
    setEntries,
  ] = useState([])

  const [
    workedMinutes,
    setWorkedMinutes,
  ] = useState(0)

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState(null)

  const loadTodayEntries =
    useCallback(
      async employeeId => {
        if (!employeeId) {
          return
        }

        try {
          setLoading(true)
          setError(null)

          const [
            entriesData,
            minutesData,
          ] =
            await Promise.all([
              getTodayEntries(
                employeeId
              ),

              getWorkedMinutes(
                employeeId
              ),
            ])

          setEntries(
            entriesData
          )

          setWorkedMinutes(
            minutesData
          )

          return entriesData
        } catch (error) {
          console.error(error)

          setError(
            'Não foi possível carregar os registros de hoje.'
          )
        } finally {
          setLoading(false)
        }
      },
      []
    )

  return {
    entries,
    workedMinutes,
    loading,
    error,

    loadTodayEntries,
  }
}