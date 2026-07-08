/** Locales suportados pelo app. Ao adicionar idioma, inclua pasta em locales/ e registre aqui. */
export const APP_LOCALES = ['pt-BR', 'en', 'es'] as const
export type AppLocale = (typeof APP_LOCALES)[number]

/**
 * Namespaces de tradução — um arquivo JSON por área.
 * Nova funcionalidade: crie `locales/{locale}/{namespace}.json` e registre em `resources.ts`.
 */
export const I18N_NAMESPACES = [
  'common',
  'tabs',
  'auth',
  'profile',
  'utilities',
  'trip',
  'expenses',
  'group',
  'invite',
  'tools',
  'onboarding',
  'errors',
  'memories'
] as const

export type I18nNamespace = (typeof I18N_NAMESPACES)[number]

export const DEFAULT_LOCALE: AppLocale = 'pt-BR'

export const LOCALE_STORAGE_KEY = 'viagens_locale'

export type LocaleOption = {
  id: AppLocale
  label: string
  nativeLabel: string
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { id: 'pt-BR', label: 'Português (Brasil)', nativeLabel: 'Português' },
  { id: 'en', label: 'English', nativeLabel: 'English' },
  { id: 'es', label: 'Español', nativeLabel: 'Español' }
]
