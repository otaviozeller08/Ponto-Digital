import { supabase } from '../../../lib/supabase'


// ============================================================
// FUNCIONÁRIO
// ============================================================

export async function getHistoryEmployee(
  employeeId
) {
  const {
    data,
    error,
  } = await supabase
    .from('employees')
    .select(`
      id,
      user_id,
      company_id,
      full_name,
      job_title,
      status
    `)
    .eq('id', employeeId)
    .single()


  if (error) {
    throw error
  }


  return data
}


// ============================================================
// HISTÓRICO DE PONTOS
// ============================================================

export async function getEmployeeTimeEntries({
  employeeId,
  startDate,
  endDate,
}) {
  const {
    data,
    error,
  } = await supabase
    .from('time_entries')
    .select(`
      id,
      employee_id,
      work_date,
      entry_type,
      occurred_at,
      latitude,
      longitude,
      gps_accuracy,
      location_id,
      distance_meters,
      geofence_validated,
      status
    `)
    .eq(
      'employee_id',
      employeeId
    )
    .gte(
      'work_date',
      startDate
    )
    .lte(
      'work_date',
      endDate
    )
    .order(
      'work_date',
      {
        ascending:
          false,
      }
    )
    .order(
      'occurred_at',
      {
        ascending:
          true,
      }
    )


  if (error) {
    throw error
  }


  return data ?? []
}


// ============================================================
// ALOCAÇÕES DO PERÍODO
// ============================================================

export async function getEmployeeAssignments({
  employeeId,
  startDate,
  endDate,
}) {
  const {
    data,
    error,
  } = await supabase
    .from(
      'employee_daily_assignments'
    )
    .select(`
      id,
      employee_id,
      work_date,
      assignment_type,
      location_id,
      expected_clock_in,
      expected_break_start,
      expected_break_end,
      expected_clock_out,
      notes,
      status
    `)
    .eq(
      'employee_id',
      employeeId
    )
    .gte(
      'work_date',
      startDate
    )
    .lte(
      'work_date',
      endDate
    )
    .neq(
      'status',
      'cancelled'
    )


  if (error) {
    throw error
  }


  return data ?? []
}


// ============================================================
// LOCAIS
// ============================================================

export async function getLocationsByIds(
  locationIds
) {
  const cleanIds =
    [
      ...new Set(
        locationIds.filter(Boolean)
      ),
    ]


  if (!cleanIds.length) {
    return []
  }


  const {
    data,
    error,
  } = await supabase
    .from('locations')
    .select(`
      id,
      name,
      address
    `)
    .in(
      'id',
      cleanIds
    )


  if (error) {
    throw error
  }


  return data ?? []
}


// ============================================================
// CARREGAR ESPELHO COMPLETO
// ============================================================

export async function getEmployeeMonthlyHistory({
  employeeId,
  startDate,
  endDate,
}) {
  const [
    employee,
    entries,
    assignments,
  ] =
    await Promise.all([
      getHistoryEmployee(
        employeeId
      ),

      getEmployeeTimeEntries({
        employeeId,
        startDate,
        endDate,
      }),

      getEmployeeAssignments({
        employeeId,
        startDate,
        endDate,
      }),
    ])


  const locationIds = [
    ...entries.map(
      item =>
        item.location_id
    ),

    ...assignments.map(
      item =>
        item.location_id
    ),
  ]


  const locations =
    await getLocationsByIds(
      locationIds
    )


  return {
    employee,
    entries,
    assignments,
    locations,
  }
}