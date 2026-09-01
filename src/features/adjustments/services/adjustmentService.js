import { supabase } from '../../../lib/supabase'


// ============================================================
// FUNCIONÁRIO LOGADO
// ============================================================

export async function getCurrentEmployee() {
  const {
    data: {
      user,
    },
    error: userError,
  } =
    await supabase.auth.getUser()


  if (
    userError ||
    !user
  ) {
    throw new Error(
      'Usuário não autenticado.'
    )
  }


  const {
    data,
    error,
  } =
    await supabase
      .from('employees')
      .select(`
        id,
        user_id,
        company_id,
        full_name,
        job_title,
        status
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


  if (error) {
    throw error
  }


  return data
}


// ============================================================
// CRIAR SOLICITAÇÃO
// ============================================================

export async function createAdjustmentRequest({
  workDate,
  entryType,
  requestedTime,
  reason,
}) {
  const employee =
    await getCurrentEmployee()


  const {
    data,
    error,
  } =
    await supabase
      .from(
        'adjustment_requests'
      )
      .insert({
        company_id:
          employee.company_id,

        employee_id:
          employee.id,

        work_date:
          workDate,

        entry_type:
          entryType,

        requested_time:
          requestedTime,

        reason:
          reason.trim(),

        status:
          'pending',
      })
      .select()
      .single()


  if (error) {
    throw error
  }


  return data
}


// ============================================================
// MINHAS SOLICITAÇÕES
// ============================================================

export async function getMyAdjustmentRequests() {
  const employee =
    await getCurrentEmployee()


  const {
    data,
    error,
  } =
    await supabase
      .from(
        'adjustment_requests'
      )
      .select(`
        id,
        employee_id,
        work_date,
        entry_type,
        requested_time,
        reason,
        status,
        review_notes,
        created_at,
        reviewed_at
      `)
      .eq(
        'employee_id',
        employee.id
      )
      .order(
        'created_at',
        {
          ascending:
            false,
        }
      )


  if (error) {
    throw error
  }


  return data ?? []
}


// ============================================================
// RH - BUSCAR TODAS
// ============================================================

export async function getAdjustmentRequestsForRH() {
  const {
    data: requests,
    error,
  } =
    await supabase
      .from(
        'adjustment_requests'
      )
      .select(`
        id,
        company_id,
        employee_id,
        work_date,
        entry_type,
        requested_time,
        reason,
        status,
        review_notes,
        created_at,
        reviewed_at
      `)
      .order(
        'created_at',
        {
          ascending:
            false,
        }
      )


  if (error) {
    throw error
  }


  if (!requests?.length) {
    return []
  }


  const employeeIds =
    [
      ...new Set(
        requests.map(
          request =>
            request.employee_id
        )
      ),
    ]


  const {
    data: employees,
    error:
      employeesError,
  } =
    await supabase
      .from('employees')
      .select(`
        id,
        full_name,
        job_title
      `)
      .in(
        'id',
        employeeIds
      )


  if (employeesError) {
    throw employeesError
  }


  return requests.map(
    request => ({
      ...request,

      employee:
        employees?.find(
          employee =>
            employee.id ===
            request.employee_id
        ) ?? null,
    })
  )
}


// ============================================================
// RH - APROVAR / RECUSAR
//
// POR ENQUANTO:
// atualiza a solicitação.
//
// Na próxima etapa vamos ligar a aprovação à criação/correção
// efetiva do time_entry pelo backend.
// ============================================================

export async function reviewAdjustmentRequest({
  requestId,
  status,
  reviewNotes,
}) {
  if (
    ![
      'approved',
      'rejected',
    ].includes(
      status
    )
  ) {
    throw new Error(
      'Status de revisão inválido.'
    )
  }


  const {
    data: {
      user,
    },
    error: userError,
  } =
    await supabase.auth.getUser()


  if (
    userError ||
    !user
  ) {
    throw new Error(
      'Usuário não autenticado.'
    )
  }


  const {
    data,
    error,
  } =
    await supabase
      .from(
        'adjustment_requests'
      )
      .update({
        status,

        review_notes:
          reviewNotes?.trim() ||
          null,

        reviewed_by:
          user.id,

        reviewed_at:
          new Date()
            .toISOString(),
      })
      .eq(
        'id',
        requestId
      )
      .select()
      .single()


  if (error) {
    throw error
  }


  return data
}