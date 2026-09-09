import {
  supabase,
} from '../../../lib/supabase'


// ============================================================
// DATA LOCAL YYYY-MM-DD
// ============================================================

function formatLocalDate(
  date
) {

  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    )

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    )


  return `${year}-${month}-${day}`
}


// ============================================================
// ALOCAÇÃO DE HOJE
// ============================================================

export async function getTodayAssignment() {

  const {
    data,
    error,
  } =
    await supabase.rpc(
      'get_my_today_assignment'
    )


  if (error) {
    throw error
  }


  return data?.[0] ?? null
}


// ============================================================
// ROTEIRO DE HOJE
// ============================================================

export async function getTodayRoute(
  assignmentId
) {

  if (!assignmentId) {
    return []
  }


  const {
    data:
      stops,

    error:
      stopsError,
  } =
    await supabase
      .from(
        'employee_assignment_stops'
      )
      .select(`
        id,
        assignment_id,
        company_id,
        location_id,
        sequence,
        expected_arrival,
        expected_departure,
        notes,
        status
      `)
      .eq(
        'assignment_id',
        assignmentId
      )
      .neq(
        'status',
        'cancelled'
      )
      .order(
        'sequence',
        {
          ascending:
            true,
        }
      )


  if (stopsError) {
    throw stopsError
  }


  if (!stops?.length) {
    return []
  }


  const locationIds =
    [
      ...new Set(
        stops.map(
          stop =>
            stop.location_id
        )
      ),
    ]


  const {
    data:
      locations,

    error:
      locationsError,
  } =
    await supabase
      .from(
        'locations'
      )
      .select(`
        id,
        name,
        address,
        latitude,
        longitude,
        radius_meters,
        active
      `)
      .in(
        'id',
        locationIds
      )


  if (locationsError) {
    throw locationsError
  }


  return stops.map(
    stop => {

      const location =
        locations?.find(
          item =>
            item.id ===
            stop.location_id
        ) ?? null


      return {

        ...stop,

        location,

      }

    }
  )
}


// ============================================================
// FUNCIONÁRIO LOGADO
// ============================================================

async function getCurrentEmployee() {

  const {
    data: {
      user,
    },

    error:
      userError,
  } =
    await supabase
      .auth
      .getUser()


  if (
    userError ||
    !user
  ) {

    throw new Error(
      'Usuário não autenticado.'
    )

  }


  const {
    data:
      employee,

    error:
      employeeError,
  } =
    await supabase
      .from(
        'employees'
      )
      .select(`
        id,
        company_id,
        user_id
      `)
      .eq(
        'user_id',
        user.id
      )
      .eq(
        'status',
        'active'
      )
      .single()


  if (employeeError) {
    throw employeeError
  }


  return employee
}


// ============================================================
// PRÓXIMA ALOCAÇÃO
// ============================================================

export async function getNextAssignment() {

  const employee =
    await getCurrentEmployee()


  const tomorrow =
    new Date()


  tomorrow.setDate(
    tomorrow.getDate() + 1
  )


  const tomorrowDate =
    formatLocalDate(
      tomorrow
    )


  const {
    data:
      assignment,

    error:
      assignmentError,
  } =
    await supabase
      .from(
        'employee_daily_assignments'
      )
      .select(`
        id,
        company_id,
        employee_id,
        work_date,
        assignment_type,
        location_id,
        schedule_id,
        expected_clock_in,
        expected_break_start,
        expected_break_end,
        expected_clock_out,
        notes,
        status
      `)
      .eq(
        'employee_id',
        employee.id
      )
      .gte(
        'work_date',
        tomorrowDate
      )
      .neq(
        'status',
        'cancelled'
      )
      .order(
        'work_date',
        {
          ascending:
            true,
        }
      )
      .limit(1)
      .maybeSingle()


  if (assignmentError) {
    throw assignmentError
  }


  if (!assignment) {
    return null
  }


  let location =
    null


  if (
    assignment.location_id
  ) {

    const {
      data:
        locationData,

      error:
        locationError,
    } =
      await supabase
        .from(
          'locations'
        )
        .select(`
          id,
          name,
          address,
          latitude,
          longitude,
          radius_meters
        `)
        .eq(
          'id',
          assignment.location_id
        )
        .maybeSingle()


    if (locationError) {
      throw locationError
    }


    location =
      locationData
  }


  return {

    ...assignment,

    location_name:
      location?.name ||
      null,

    location_address:
      location?.address ||
      null,

    location_latitude:
      location?.latitude ??
      null,

    location_longitude:
      location?.longitude ??
      null,

    location_radius:
      location?.radius_meters ??
      null,

  }
}