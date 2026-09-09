import {
  supabase,
} from '../../../lib/supabase'


export const ASSIGNMENT_PRESETS = {

  obra: {

    label:
      'Obra',

    clockIn:
      '07:00',

    breakStart:
      '12:00',

    breakEnd:
      '13:00',

    clockOut:
      '17:00',

  },


  manutencao: {

    label:
      'Manutenção',

    clockIn:
      '08:00',

    breakStart:
      '12:00',

    breakEnd:
      '13:00',

    clockOut:
      '18:00',

  },

}


// ============================================================
// FUNCIONÁRIOS ATIVOS
// ============================================================

export async function getActiveEmployees() {

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'employees'
      )
      .select(`
        id,
        company_id,
        full_name,
        job_title,
        status
      `)
      .eq(
        'status',
        'active'
      )
      .order(
        'full_name'
      )


  if (error) {
    throw error
  }


  return data ?? []
}


// ============================================================
// LOCAIS ATIVOS
// ============================================================

export async function getActiveLocations() {

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'locations'
      )
      .select(`
        id,
        company_id,
        name,
        address,
        latitude,
        longitude,
        radius_meters,
        active
      `)
      .eq(
        'active',
        true
      )
      .order(
        'name'
      )


  if (error) {
    throw error
  }


  return data ?? []
}


// ============================================================
// BUSCAR PARADAS DAS ALOCAÇÕES
// ============================================================

async function getStopsForAssignments(
  assignmentIds
) {

  if (
    !assignmentIds?.length
  ) {
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
        company_id,
        assignment_id,
        location_id,
        sequence,
        expected_arrival,
        expected_departure,
        notes,
        status
      `)
      .in(
        'assignment_id',
        assignmentIds
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
        radius_meters
      `)
      .in(
        'id',
        locationIds
      )


  if (locationsError) {
    throw locationsError
  }


  return stops.map(
    stop => ({

      ...stop,

      location:
        locations?.find(
          location =>
            location.id ===
            stop.location_id
        ) ?? null,

    })
  )
}


// ============================================================
// ALOCAÇÕES POR DATA
// ============================================================

export async function getAssignmentsByDate(
  workDate
) {

  const {
    data:
      assignments,

    error,
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
        expected_clock_in,
        expected_break_start,
        expected_break_end,
        expected_clock_out,
        notes,
        status,
        created_at,

        employee:employees (
          id,
          full_name,
          job_title
        ),

        location:locations (
          id,
          name,
          address,
          radius_meters
        )
      `)
      .eq(
        'work_date',
        workDate
      )
      .neq(
        'status',
        'cancelled'
      )
      .order(
        'created_at',
        {
          ascending:
            true,
        }
      )


  if (error) {
    throw error
  }


  if (!assignments?.length) {
    return []
  }


  const assignmentIds =
    assignments.map(
      assignment =>
        assignment.id
    )


  const stops =
    await getStopsForAssignments(
      assignmentIds
    )


  return assignments.map(
    assignment => {

      const assignmentStops =
        stops.filter(
          stop =>
            stop.assignment_id ===
            assignment.id
        )


      // ======================================================
      // COMPATIBILIDADE COM ALOCAÇÕES ANTIGAS
      //
      // Se ainda não existir roteiro para uma alocação antiga,
      // o antigo location_id vira visualmente a primeira parada.
      // ======================================================

      if (
        assignmentStops.length ===
        0 &&
        assignment.location_id
      ) {

        return {

          ...assignment,

          stops: [
            {

              id:
                `legacy-${assignment.id}`,

              assignment_id:
                assignment.id,

              location_id:
                assignment.location_id,

              sequence:
                1,

              expected_arrival:
                assignment.expected_clock_in,

              expected_departure:
                assignment.expected_clock_out,

              notes:
                null,

              status:
                'planned',

              location:
                assignment.location,

            },
          ],

        }

      }


      return {

        ...assignment,

        stops:
          assignmentStops,

      }

    }
  )
}


// ============================================================
// VALIDAR ROTEIRO
// ============================================================

function validateStops(
  stops
) {

  if (
    !Array.isArray(stops) ||
    stops.length === 0
  ) {

    throw new Error(
      'Adicione pelo menos um local ao roteiro.'
    )

  }


  for (
    const stop
    of stops
  ) {

    if (!stop.locationId) {

      throw new Error(
        'Todas as paradas precisam de um local.'
      )

    }

  }


  const locationIds =
    stops.map(
      stop =>
        stop.locationId
    )


  if (
    new Set(
      locationIds
    ).size !==
    locationIds.length
  ) {

    throw new Error(
      'O mesmo local não pode aparecer duas vezes no roteiro.'
    )

  }

}


// ============================================================
// SALVAR PARADAS
// ============================================================

async function replaceAssignmentStops({
  assignment,
  stops,
}) {

  // =========================================================
  // APAGAR ROTEIRO ANTERIOR
  // =========================================================

  const {
    error:
      deleteError,
  } =
    await supabase
      .from(
        'employee_assignment_stops'
      )
      .delete()
      .eq(
        'assignment_id',
        assignment.id
      )


  if (deleteError) {
    throw deleteError
  }


  // =========================================================
  // NOVO ROTEIRO
  // =========================================================

  const payload =
    stops.map(
      (
        stop,
        index
      ) => ({

        company_id:
          assignment.company_id,

        assignment_id:
          assignment.id,

        location_id:
          stop.locationId,

        sequence:
          index + 1,

        expected_arrival:
          stop.expectedArrival ||
          null,

        expected_departure:
          stop.expectedDeparture ||
          null,

        notes:
          stop.notes?.trim() ||
          null,

        status:
          'planned',

      })
    )


  const {
    error:
      insertError,
  } =
    await supabase
      .from(
        'employee_assignment_stops'
      )
      .insert(
        payload
      )


  if (insertError) {
    throw insertError
  }
}


// ============================================================
// SALVAR ALOCAÇÃO + ROTEIRO
// ============================================================

export async function saveAssignment({
  employee,
  workDate,
  assignmentType,
  stops,
  notes,
}) {

  const preset =
    ASSIGNMENT_PRESETS[
      assignmentType
    ]


  if (!preset) {

    throw new Error(
      'Selecione um tipo de atividade válido.'
    )

  }


  if (!employee?.id) {

    throw new Error(
      'Selecione um funcionário.'
    )

  }


  if (!workDate) {

    throw new Error(
      'Selecione a data.'
    )

  }


  validateStops(
    stops
  )


  const firstStop =
    stops[0]


  const {
    data:
      authData,

    error:
      authError,
  } =
    await supabase
      .auth
      .getUser()


  if (authError) {
    throw authError
  }


  const payload = {

    company_id:
      employee.company_id,

    employee_id:
      employee.id,

    work_date:
      workDate,

    assignment_type:
      assignmentType,


    // ========================================================
    // O location_id principal continua sendo a primeira parada.
    //
    // Mantemos isso por compatibilidade com o sistema atual.
    // ========================================================

    location_id:
      firstStop.locationId,

    expected_clock_in:
      preset.clockIn,

    expected_break_start:
      preset.breakStart,

    expected_break_end:
      preset.breakEnd,

    expected_clock_out:
      preset.clockOut,

    notes:
      notes?.trim() ||
      null,

    status:
      'active',

    created_by:
      authData.user?.id ??
      null,

  }


  const {
    data:
      assignment,

    error,
  } =
    await supabase
      .from(
        'employee_daily_assignments'
      )
      .upsert(
        payload,
        {
          onConflict:
            'employee_id,work_date',
        }
      )
      .select()
      .single()


  if (error) {
    throw error
  }


  await replaceAssignmentStops({

    assignment,

    stops,

  })


  return assignment
}


// ============================================================
// CANCELAR ALOCAÇÃO
// ============================================================

export async function cancelAssignment(
  assignmentId
) {

  const {
    error:
      stopsError,
  } =
    await supabase
      .from(
        'employee_assignment_stops'
      )
      .update({
        status:
          'cancelled',
      })
      .eq(
        'assignment_id',
        assignmentId
      )


  if (stopsError) {
    throw stopsError
  }


  const {
    error,
  } =
    await supabase
      .from(
        'employee_daily_assignments'
      )
      .update({
        status:
          'cancelled',
      })
      .eq(
        'id',
        assignmentId
      )


  if (error) {
    throw error
  }
}


// ============================================================
// ALOCAÇÃO DO FUNCIONÁRIO LOGADO
// ============================================================

export async function getMyTodayAssignment() {

  const {
    data,
    error,
  } =
    await supabase
      .rpc(
        'get_my_today_assignment'
      )


  if (error) {
    throw error
  }


  return data?.[0] ?? null
}