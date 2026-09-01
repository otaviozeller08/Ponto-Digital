import { supabase } from '../../../lib/supabase'


// ============================================================
// LISTAR FUNCIONÁRIOS
// ============================================================

export async function getEmployees() {
  const {
    data: employees,
    error: employeesError,
  } = await supabase
    .from('employees')
    .select(`
      id,
      user_id,
      company_id,
      full_name,
      job_title,
      status,
      department_id,
      schedule_id,
      created_at
    `)
    .order('full_name')


  if (employeesError) {
    throw employeesError
  }


  if (!employees?.length) {
    return []
  }


  const userIds =
    employees
      .map(
        employee =>
          employee.user_id
      )
      .filter(Boolean)


  let profiles = []


  if (userIds.length) {
    const {
      data,
      error,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        role,
        full_name,
        company_id,
        active
      `)
      .in(
        'id',
        userIds
      )


    if (error) {
      throw error
    }


    profiles =
      data ?? []
  }


  return employees.map(
    employee => ({
      ...employee,

      profile:
        profiles.find(
          profile =>
            profile.id ===
            employee.user_id
        ) ?? null,
    })
  )
}


// ============================================================
// BUSCAR UM FUNCIONÁRIO
// ============================================================

export async function getEmployeeById(
  employeeId
) {
  const {
    data: employee,
    error,
  } = await supabase
    .from('employees')
    .select(`
      id,
      user_id,
      company_id,
      full_name,
      job_title,
      status,
      department_id,
      schedule_id,
      created_at
    `)
    .eq(
      'id',
      employeeId
    )
    .single()


  if (error) {
    throw error
  }


  let profile = null


  if (employee.user_id) {
    const {
      data,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role,
        active,
        company_id
      `)
      .eq(
        'id',
        employee.user_id
      )
      .maybeSingle()


    if (profileError) {
      throw profileError
    }


    profile = data
  }


  return {
    ...employee,
    profile,
  }
}


// ============================================================
// ATUALIZAR FUNCIONÁRIO
// ============================================================

export async function updateEmployee({
  employeeId,
  userId,
  fullName,
  jobTitle,
}) {
  const {
    error: employeeError,
  } = await supabase
    .from('employees')
    .update({
      full_name:
        fullName.trim(),

      job_title:
        jobTitle?.trim() ||
        null,
    })
    .eq(
      'id',
      employeeId
    )


  if (employeeError) {
    throw employeeError
  }


  if (userId) {
    const {
      error: profileError,
    } = await supabase
      .from('profiles')
      .update({
        full_name:
          fullName.trim(),
      })
      .eq(
        'id',
        userId
      )


    if (profileError) {
      throw profileError
    }
  }
}


// ============================================================
// ATIVAR / DESATIVAR
// ============================================================

export async function setEmployeeStatus({
  employeeId,
  userId,
  active,
}) {
  const employeeStatus =
    active
      ? 'active'
      : 'inactive'


  const {
    error: employeeError,
  } = await supabase
    .from('employees')
    .update({
      status:
        employeeStatus,
    })
    .eq(
      'id',
      employeeId
    )


  if (employeeError) {
    throw employeeError
  }


  if (userId) {
    const {
      error: profileError,
    } = await supabase
      .from('profiles')
      .update({
        active,
      })
      .eq(
        'id',
        userId
      )


    if (profileError) {
      throw profileError
    }
  }
}


// ============================================================
// ALOCAÇÃO DO FUNCIONÁRIO EM UMA DATA
// ============================================================

export async function getEmployeeAssignment(
  employeeId,
  workDate
) {
  const {
    data,
    error,
  } = await supabase
    .from(
      'employee_daily_assignments'
    )
    .select(`
      id,
      work_date,
      assignment_type,
      expected_clock_in,
      expected_break_start,
      expected_break_end,
      expected_clock_out,
      notes,
      status,

      location:locations (
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
    .maybeSingle()


  if (error) {
    throw error
  }


  return data ?? null
}


// ============================================================
// CRIAR FUNCIONÁRIO
// ============================================================

export async function createEmployee(
  payload
) {
  const {
    data,
    error,
  } =
    await supabase.functions.invoke(
      'create-employee',
      {
        body:
          payload,
      }
    )


  if (error) {
    throw error
  }


  if (!data?.success) {
    throw new Error(
      data?.error ||
      'Não foi possível cadastrar o funcionário.'
    )
  }


  return data
}