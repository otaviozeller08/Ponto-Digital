import { supabase } from '../../../lib/supabase'


export async function getTodayAssignment() {
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