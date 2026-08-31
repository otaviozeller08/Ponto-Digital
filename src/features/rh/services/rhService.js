import { supabase } from '../../../lib/supabase'


export async function getTodayRHData() {
  const {
    data,
    error,
  } = await supabase.rpc(
    'get_rh_dashboard_today'
  )

  if (error) {
    throw error
  }

  return data ?? []
}


export async function getPendingAdjustmentsCount() {
  const {
    count,
    error,
  } = await supabase
    .from('adjustment_requests')
    .select(
      'id',
      {
        count: 'exact',
        head: true,
      }
    )
    .eq(
      'status',
      'pending'
    )

  if (error) {
    throw error
  }

  return count ?? 0
}