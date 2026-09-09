import {
  supabase,
} from '../../../lib/supabase'


// ============================================================
// FUNCIONÁRIO LOGADO
// ============================================================

export async function getCurrentEmployee() {

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
    data,
    error,
  } =
    await supabase
      .from(
        'employees'
      )
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


  if (!workDate) {
    throw new Error(
      'Informe a data do ajuste.'
    )
  }


  if (
    ![
      'clock_in',
      'break_start',
      'break_end',
      'clock_out',
    ].includes(
      entryType
    )
  ) {
    throw new Error(
      'Tipo de registro inválido.'
    )
  }


  if (!requestedTime) {
    throw new Error(
      'Informe o horário correto.'
    )
  }


  if (
    !reason ||
    !reason.trim()
  ) {
    throw new Error(
      'Informe o motivo do ajuste.'
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
// RH - BUSCAR SOLICITAÇÕES
// ============================================================

export async function getAdjustmentRequestsForRH() {

  const {
    data:
      requests,

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
    data:
      employees,

    error:
      employeesError,
  } =
    await supabase
      .from(
        'employees'
      )
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
// RH - APROVAR / RECUSAR AJUSTE
//
// IMPORTANTE:
//
// NÃO alteramos adjustment_requests diretamente.
//
// A aprovação passa pela Edge Function:
//
// review-adjustment
//
// Ela chama a RPC:
//
// review_adjustment_request
//
// Assim:
//
// APROVADO
// → cria ou corrige time_entries
// → depois marca solicitação approved
//
// RECUSADO
// → marca solicitação rejected
//
// Toda regra sensível fica no backend.
// ============================================================

export async function reviewAdjustmentRequest({
  requestId,
  status,
  reviewNotes,
}) {

  if (!requestId) {
    throw new Error(
      'Solicitação não informada.'
    )
  }


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


  // =========================================================
  // GARANTIR SESSÃO
  // =========================================================

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


  // =========================================================
  // EDGE FUNCTION
  // =========================================================

  const {
    data,
    error,
  } =
    await supabase
      .functions
      .invoke(
        'review-adjustment',
        {
          body: {

            requestId,

            status,

            reviewNotes:
              reviewNotes
                ?.trim() ||
              null,

          },
        }
      )


  if (error) {

    console.error(
      'Erro na função review-adjustment:',
      error
    )


    throw new Error(
      error.message ||
      'Não foi possível revisar a solicitação.'
    )
  }


  if (!data) {
    throw new Error(
      'O servidor não retornou uma resposta.'
    )
  }


  if (!data.success) {
    throw new Error(
      data.error ||
      'Não foi possível revisar a solicitação.'
    )
  }


  return data.result
}