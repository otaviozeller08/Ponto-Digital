import { supabase } from '../../../lib/supabase'

export async function signIn(
  email,
  password
) {
  const {
    data,
    error,
  } =
    await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

  if (error) {
    throw error
  }

  return data
}

export async function signOut() {
  const { error } =
    await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

export async function getProfile(
  userId
) {
  if (!userId) {
    return null
  }

  const {
    data,
    error,
  } = await supabase
    .from('profiles')
    .select(`
      id,
      company_id,
      full_name,
      email,
      phone,
      avatar_url,
      role,
      active,
      created_at,
      updated_at
    `)
    .eq('id', userId)
    .single()

  if (error) {
    throw error
  }

  return data
}