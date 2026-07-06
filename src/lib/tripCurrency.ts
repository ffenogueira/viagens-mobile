const COUNTRY_CODE_CURRENCY: Record<string, string> = {
  BR: 'BRL',
  CO: 'COP',
  AR: 'ARS',
  CL: 'CLP',
  PE: 'PEN',
  MX: 'MXN',
  UY: 'UYU',
  PY: 'PYG',
  BO: 'BOB',
  EC: 'USD',
  VE: 'VES',
  US: 'USD',
  CA: 'CAD',
  PT: 'EUR',
  ES: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  DE: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  IE: 'EUR',
  GB: 'GBP',
  UK: 'GBP',
  CH: 'CHF',
  JP: 'JPY',
  AU: 'AUD',
  NZ: 'NZD'
}

const COUNTRY_NAME_CURRENCY: Record<string, string> = {
  brasil: 'BRL',
  brazil: 'BRL',
  colombia: 'COP',
  argentina: 'ARS',
  chile: 'CLP',
  peru: 'PEN',
  perú: 'PEN',
  mexico: 'MXN',
  uruguai: 'UYU',
  uruguay: 'UYU',
  paraguai: 'PYG',
  paraguay: 'PYG',
  bolivia: 'BOB',
  bolívia: 'BOB',
  equador: 'USD',
  ecuador: 'USD',
  venezuela: 'VES',
  'estados unidos': 'USD',
  'united states': 'USD',
  canada: 'CAD',
  canadá: 'CAD',
  portugal: 'EUR',
  espanha: 'EUR',
  spain: 'EUR',
  españa: 'EUR',
  frança: 'EUR',
  france: 'EUR',
  italia: 'EUR',
  italy: 'EUR',
  alemanha: 'EUR',
  germany: 'EUR',
  'reino unido': 'GBP',
  'united kingdom': 'GBP',
  suíça: 'CHF',
  switzerland: 'CHF',
  japão: 'JPY',
  japan: 'JPY',
  austrália: 'AUD',
  australia: 'AUD'
}

function normalizeCountryKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function resolveTripCurrency(country?: string | null, countryCode?: string | null): string {
  const code = countryCode?.trim().toUpperCase()
  if (code && COUNTRY_CODE_CURRENCY[code]) {
    return COUNTRY_CODE_CURRENCY[code]
  }

  if (country) {
    const key = normalizeCountryKey(country)
    if (COUNTRY_NAME_CURRENCY[key]) {
      return COUNTRY_NAME_CURRENCY[key]
    }
  }

  return 'BRL'
}
