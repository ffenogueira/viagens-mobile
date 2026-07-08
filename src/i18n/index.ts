import * as Localization from 'expo-localization'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as SecureStore from 'expo-secure-store'
import { i18nResources } from './resources'
import {
  APP_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type AppLocale,
  type I18nNamespace
} from './types'

let activeLocale: AppLocale = DEFAULT_LOCALE

function normalizeLocale(input?: string | null): AppLocale {
  if (!input) return DEFAULT_LOCALE
  const value = input.trim()
  if (APP_LOCALES.includes(value as AppLocale)) return value as AppLocale
  const lower = value.toLowerCase()
  if (lower.startsWith('pt')) return 'pt-BR'
  if (lower.startsWith('es')) return 'es'
  if (lower.startsWith('en')) return 'en'
  return DEFAULT_LOCALE
}

export function getDeviceLocale(): AppLocale {
  const tag = Localization.getLocales()[0]?.languageTag
  return normalizeLocale(tag)
}

export function getActiveLocale(): AppLocale {
  return activeLocale
}

export async function loadStoredLocale(): Promise<AppLocale | null> {
  const stored = await SecureStore.getItemAsync(LOCALE_STORAGE_KEY)
  if (!stored) return null
  return normalizeLocale(stored)
}

export async function persistLocale(locale: AppLocale) {
  await SecureStore.setItemAsync(LOCALE_STORAGE_KEY, locale)
}

export async function initI18n(preferred?: AppLocale | null) {
  const stored = preferred ?? (await loadStoredLocale()) ?? getDeviceLocale()
  activeLocale = normalizeLocale(stored)

  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources: i18nResources,
      lng: activeLocale,
      fallbackLng: DEFAULT_LOCALE,
      defaultNS: 'common',
      ns: Object.keys(i18nResources['pt-BR']),
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4'
    })
  } else {
    await i18n.changeLanguage(activeLocale)
  }

  return activeLocale
}

export async function changeAppLocale(locale: AppLocale) {
  const next = normalizeLocale(locale)
  activeLocale = next
  await persistLocale(next)
  await i18n.changeLanguage(next)
  return next
}

export function translateApiError(code: string | undefined, fallback?: string): string {
  if (code && i18n.exists(code, { ns: 'errors' })) {
    return i18n.t(code, { ns: 'errors' })
  }
  return fallback || i18n.t('generic', { ns: 'errors' })
}

export type { AppLocale, I18nNamespace }
export { i18n }
