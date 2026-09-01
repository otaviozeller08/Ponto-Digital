import { supabase } from '../../../lib/supabase'


export const ASSIGNMENT_PRESETS = {
  obra: {
    label: 'Obra',
    clockIn: '07:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    clockOut: '17:00',
  },

  manutencao: {
    label: 'Manutenção',
    clockIn: '08:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    clockOut: '18:00',
  },
}


// ============================================================
// FUNCIONÁRIOS ATIVOS
// ============================================================

export async function getActiveEmployees() {
  const {
    data,
    error,
  } = await supabase
    .from('employees')
    .select(`
      id,
      company_id,
      full_name,
      job_title,
      status
    `)
    .eq('status', 'active')
    .order('full_name')


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
  } = await supabase
    .from('locations')
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
    .eq('active', true)
    .order('name')


  if (error) {
    throw error
  }


  return data ?? []
}


// ============================================================
// ALOCAÇÕES POR DATA
// ============================================================

export async function getAssignmentsByDate(workDate) {
  const {
    data,
    error,
  } = await supabase
    .from('employee_daily_assignments')
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
    .eq('work_date', workDate)
    .neq('status', 'cancelled')
    .order('created_at', {
      ascending: true,
    })


  if (error) {
    throw error
  }


  return data ?? []
}


// ============================================================
// SALVAR ALOCAÇÃO
// ============================================================

export async function saveAssignment({
  employee,
  workDate,
  assignmentType,
  locationId,
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


  if (!locationId) {
    throw new Error(
      'Selecione o local de trabalho.'
    )
  }


  const {
    data: authData,
    error: authError,
  } =
    await supabase.auth.getUser()


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

    location_id:
      locationId,

    expected_clock_in:
      preset.clockIn,

    expected_break_start:
      preset.breakStart,

    expected_break_end:
      preset.breakEnd,

    expected_clock_out:
      preset.clockOut,

    notes:
      notes?.trim() || null,

    status:
      'active',

    created_by:
      authData.user?.id ?? null,
  }


  const {
    data,
    error,
  } = await supabase
    .from('employee_daily_assignments')
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


  return data
}


// ============================================================
// CANCELAR ALOCAÇÃO
// ============================================================

export async function cancelAssignment(
  assignmentId
) {
  const {
    error,
  } = await supabase
    .from('employee_daily_assignments')
    .update({
      status: 'cancelled',
    })
    .eq('id', assignmentId)


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
  } = await supabase.rpc(
    'get_my_today_assignment'
  )


  if (error) {
    throw error
  }


  return data?.[0] ?? null
}