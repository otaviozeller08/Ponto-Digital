// ============================================================
// PONTO DIGITAL
// SERVIÇO DE GEOCODIFICAÇÃO
//
// Responsabilidades:
//
// - buscar coordenadas por endereço
// - interpretar coordenadas digitadas
// - tentar extrair coordenadas de links completos do Google Maps
//
// Nesta primeira versão usamos Nominatim / OpenStreetMap
// para busca manual de endereços.
// ============================================================


// ============================================================
// NORMALIZAR COORDENADA
// ============================================================

function normalizeCoordinate(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {
    return null
  }


  const normalized =
    String(value)
      .trim()
      .replace(',', '.')


  const number =
    Number(normalized)


  if (
    !Number.isFinite(
      number
    )
  ) {
    return null
  }


  return number
}


// ============================================================
// VALIDAR LATITUDE / LONGITUDE
// ============================================================

export function validateCoordinates({
  latitude,
  longitude,
}) {

  const lat =
    Number(latitude)

  const lng =
    Number(longitude)


  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return false
  }


  if (
    lat < -90 ||
    lat > 90
  ) {
    return false
  }


  if (
    lng < -180 ||
    lng > 180
  ) {
    return false
  }


  return true
}


// ============================================================
// BUSCAR ENDEREÇO
// ============================================================

export async function geocodeAddress(
  address
) {

  const query =
    address?.trim()


  if (!query) {
    throw new Error(
      'Informe um endereço para buscar.'
    )
  }


  const params =
    new URLSearchParams({

      q:
        query,

      format:
        'jsonv2',

      limit:
        '1',

      addressdetails:
        '1',

      countrycodes:
        'br',

      'accept-language':
        'pt-BR',

    })


  const response =
    await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        method:
          'GET',

        headers: {
          Accept:
            'application/json',
        },
      }
    )


  if (!response.ok) {

    throw new Error(
      'Não foi possível consultar o endereço.'
    )

  }


  const results =
    await response.json()


  if (
    !Array.isArray(results) ||
    results.length === 0
  ) {

    throw new Error(
      'Endereço não encontrado. Tente informar rua, número, bairro, cidade e estado.'
    )

  }


  const result =
    results[0]


  const latitude =
    normalizeCoordinate(
      result.lat
    )


  const longitude =
    normalizeCoordinate(
      result.lon
    )


  if (
    !validateCoordinates({
      latitude,
      longitude,
    })
  ) {

    throw new Error(
      'O endereço foi encontrado, mas as coordenadas são inválidas.'
    )

  }


  return {

    latitude,

    longitude,

    displayName:
      result.display_name ||
      query,

  }
}


// ============================================================
// EXTRAIR COORDENADAS DE TEXTO
//
// Exemplos aceitos:
//
// -23.499221, -46.631544
//
// -23.499221 -46.631544
//
// ============================================================

function extractPlainCoordinates(
  text
) {

  if (!text) {
    return null
  }


  const match =
    String(text).match(
      /(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)/
    )


  if (!match) {
    return null
  }


  const latitude =
    Number(
      match[1]
    )


  const longitude =
    Number(
      match[2]
    )


  if (
    !validateCoordinates({
      latitude,
      longitude,
    })
  ) {
    return null
  }


  return {
    latitude,
    longitude,
  }
}


// ============================================================
// EXTRAIR DO GOOGLE MAPS
//
// Alguns links completos possuem:
//
// @-23.499221,-46.631544,17z
//
// ou:
//
// query=-23.499221,-46.631544
//
// ou:
//
// destination=-23.499221,-46.631544
//
// ============================================================

function extractGoogleMapsCoordinates(
  text
) {

  if (!text) {
    return null
  }


  const value =
    String(text)
      .trim()


  // ----------------------------------------------------------
  // PADRÃO @LAT,LNG
  // ----------------------------------------------------------

  const atMatch =
    value.match(
      /@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/
    )


  if (atMatch) {

    const latitude =
      Number(
        atMatch[1]
      )

    const longitude =
      Number(
        atMatch[2]
      )


    if (
      validateCoordinates({
        latitude,
        longitude,
      })
    ) {

      return {
        latitude,
        longitude,
      }

    }

  }


  // ----------------------------------------------------------
  // URL PARAMS
  // ----------------------------------------------------------

  try {

    const url =
      new URL(value)


    const candidates =
      [
        url.searchParams.get(
          'query'
        ),

        url.searchParams.get(
          'q'
        ),

        url.searchParams.get(
          'destination'
        ),

        url.searchParams.get(
          'origin'
        ),
      ]


    for (
      const candidate
      of candidates
    ) {

      const coordinates =
        extractPlainCoordinates(
          candidate
        )


      if (coordinates) {
        return coordinates
      }

    }

  } catch {

    // Não é uma URL válida.
    // Continuamos tentando como texto comum.

  }


  return null
}


// ============================================================
// INTERPRETAR LOCALIZAÇÃO COLADA
// ============================================================

export function parseLocationInput(
  value
) {

  const text =
    value?.trim()


  if (!text) {

    throw new Error(
      'Cole as coordenadas ou um link do Google Maps.'
    )

  }


  const googleCoordinates =
    extractGoogleMapsCoordinates(
      text
    )


  if (googleCoordinates) {
    return googleCoordinates
  }


  const plainCoordinates =
    extractPlainCoordinates(
      text
    )


  if (plainCoordinates) {
    return plainCoordinates
  }


  throw new Error(
    'Não consegui encontrar latitude e longitude nesse conteúdo. Use coordenadas como "-23.499221, -46.631544" ou um link completo do Google Maps que contenha as coordenadas.'
  )
}


// ============================================================
// GERAR LINK DO GOOGLE MAPS
// ============================================================

export function createGoogleMapsUrl({
  latitude,
  longitude,
}) {

  if (
    !validateCoordinates({
      latitude,
      longitude,
    })
  ) {
    return null
  }


  return (
    `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
  )
}