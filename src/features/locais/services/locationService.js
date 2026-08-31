import {
  supabase,
} from '../../../lib/supabase'

export async function getLocations() {
  const {
    data,
    error,
  } = await supabase
    .from('locations')
    .select(`
      id,
      company_id,
      name,
      description,
      address,
      latitude,
      longitude,
      radius_meters,
      active,
      created_at,
      updated_at
    `)
    .order(
      'name',
      {
        ascending: true,
      }
    )

  if (error) {
    throw error
  }

  return data ?? []
}

export async function createLocation({
  companyId,
  name,
  description,
  address,
  latitude,
  longitude,
  radiusMeters,
}) {
  const {
    data,
    error,
  } = await supabase
    .from('locations')
    .insert({
      company_id:
        companyId,

      name:
        name.trim(),

      description:
        description?.trim() ||
        null,

      address:
        address?.trim() ||
        null,

      latitude,

      longitude,

      radius_meters:
        Number(radiusMeters),

      active: true,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateLocation(
  id,
  updates
) {
  const {
    data,
    error,
  } = await supabase
    .from('locations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function setLocationActive(
  id,
  active
) {
  return updateLocation(
    id,
    {
      active,
    }
  )
}