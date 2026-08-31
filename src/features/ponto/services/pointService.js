import { supabase } from '../../../lib/supabase'


// ==========================================================
// DATA OFICIAL DE SÃO PAULO
// ==========================================================

export function getSaoPauloDate() {
  const formatter = new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }
  )

  const parts = formatter.formatToParts(
    new Date()
  )

  const year =
    parts.find(
      part => part.type === 'year'
    )?.value

  const month =
    parts.find(
      part => part.type === 'month'
    )?.value

  const day =
    parts.find(
      part => part.type === 'day'
    )?.value

  return `${year}-${month}-${day}`
}


// ==========================================================
// FUNCIONÁRIO LOGADO
// ==========================================================

export async function getCurrentEmployee() {
  const {
    data: authData,
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  const user =
    authData?.user

  if (!user) {
    throw new Error(
      'Usuário não autenticado.'
    )
  }

  const {
    data,
    error,
  } = await supabase
    .from('employees')
    .select(`
      id,
      company_id,
      user_id,
      department_id,
      schedule_id,
      employee_number,
      full_name,
      email,
      job_title,
      status,
      photo_url,

      work_schedules (
        id,
        name,
        timezone,
        weekly_minutes,
        tolerance_minutes
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (error) {
    throw error
  }

  return data
}


// ==========================================================
// PONTOS DE HOJE
// ==========================================================

export async function getTodayEntries(
  employeeId
) {
  const workDate =
    getSaoPauloDate()

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
      face_verified,
      liveness_verified,
      status,
      source,
      notes,

      locations (
        id,
        name,
        address,
        radius_meters
      )
    `)
    .eq(
      'employee_id',
      employeeId
    )
    .eq(
      'work_date',
      workDate
    )
    .neq(
      'status',
      'cancelled'
    )
    .order(
      'occurred_at',
      {
        ascending: true,
      }
    )

  if (error) {
    throw error
  }

  return data ?? []
}


// ==========================================================
// PRÓXIMO PONTO
// ==========================================================

export async function getNextEntryType(
  employeeId
) {
  const workDate =
    getSaoPauloDate()

  const {
    data,
    error,
  } = await supabase.rpc(
    'get_next_entry_type',
    {
      p_employee_id:
        employeeId,

      p_work_date:
        workDate,
    }
  )

  if (error) {
    throw error
  }

  return data
}


// ==========================================================
// MINUTOS TRABALHADOS
// ==========================================================

export async function getWorkedMinutes(
  employeeId
) {
  const workDate =
    getSaoPauloDate()

  const {
    data,
    error,
  } = await supabase.rpc(
    'calculate_worked_minutes',
    {
      p_employee_id:
        employeeId,

      p_work_date:
        workDate,
    }
  )

  if (error) {
    throw error
  }

  return Number(data ?? 0)
}


// ==========================================================
// LOCAIS DA EMPRESA
// ==========================================================

export async function getCompanyLocations(
  companyId
) {
  const {
    data,
    error,
  } = await supabase
    .from('locations')
    .select(`
      id,
      name,
      address,
      latitude,
      longitude,
      radius_meters,
      active
    `)
    .eq(
      'company_id',
      companyId
    )
    .eq(
      'active',
      true
    )

  if (error) {
    throw error
  }

  return data ?? []
}


// ==========================================================
// REGISTRAR PONTO REAL
// ==========================================================

export async function registerPoint({
  entryType,
  latitude,
  longitude,
  accuracy,
}) {
  const {
    data,
    error,
  } = await supabase.rpc(
    'register_time_entry',
    {
      p_entry_type:
        entryType,

      p_latitude:
        latitude,

      p_longitude:
        longitude,

      p_accuracy:
        accuracy,

      p_client_recorded_at:
        new Date().toISOString(),

      p_user_agent:
        navigator.userAgent,

      p_device_info: {
        platform:
          navigator.platform ||
          null,

        language:
          navigator.language ||
          null,

        screenWidth:
          window.screen?.width ||
          null,

        screenHeight:
          window.screen?.height ||
          null,
      },
    }
  )

  if (error) {
    throw error
  }

  return data
}


// ==========================================================
// DISTÂNCIA HAVERSINE NO FRONTEND
// Somente para visualização.
// A validação oficial continua sendo feita no Supabase.
// ==========================================================

export function calculateDistanceMeters(
  latitude1,
  longitude1,
  latitude2,
  longitude2
) {
  const earthRadius =
    6371000

  const toRadians =
    value =>
      (value * Math.PI) / 180

  const lat1 =
    toRadians(latitude1)

  const lat2 =
    toRadians(latitude2)

  const deltaLat =
    toRadians(
      latitude2 -
      latitude1
    )

  const deltaLon =
    toRadians(
      longitude2 -
      longitude1
    )

  const a =
    Math.sin(
      deltaLat / 2
    ) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(
        deltaLon / 2
      ) ** 2

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )

  return earthRadius * c
}


// ==========================================================
// LOCAL MAIS PRÓXIMO
// ==========================================================

export function findNearestLocation(
  position,
  locations
) {
  if (
    !position ||
    !locations?.length
  ) {
    return null
  }

  const calculated =
    locations.map(
      location => {
        const distance =
          calculateDistanceMeters(
            position.latitude,
            position.longitude,
            Number(
              location.latitude
            ),
            Number(
              location.longitude
            )
          )

        return {
          ...location,

          distance,

          inside:
            distance <=
            location.radius_meters,
        }
      }
    )

  calculated.sort(
    (a, b) =>
      a.distance -
      b.distance
  )

  return calculated[0]
}