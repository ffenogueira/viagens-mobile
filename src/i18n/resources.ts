import type { AppLocale } from './types'

import ptBRCommon from './locales/pt-BR/common.json'
import ptBRAuth from './locales/pt-BR/auth.json'
import ptBRTabs from './locales/pt-BR/tabs.json'
import ptBRProfile from './locales/pt-BR/profile.json'
import ptBRUtilities from './locales/pt-BR/utilities.json'
import ptBRTrip from './locales/pt-BR/trip.json'
import ptBRExpenses from './locales/pt-BR/expenses.json'
import ptBRGroup from './locales/pt-BR/group.json'
import ptBRInvite from './locales/pt-BR/invite.json'
import ptBRTools from './locales/pt-BR/tools.json'
import ptBROnboarding from './locales/pt-BR/onboarding.json'
import ptBRErrors from './locales/pt-BR/errors.json'
import ptBRMemories from './locales/pt-BR/memories.json'

import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enTabs from './locales/en/tabs.json'
import enProfile from './locales/en/profile.json'
import enUtilities from './locales/en/utilities.json'
import enTrip from './locales/en/trip.json'
import enExpenses from './locales/en/expenses.json'
import enGroup from './locales/en/group.json'
import enInvite from './locales/en/invite.json'
import enTools from './locales/en/tools.json'
import enOnboarding from './locales/en/onboarding.json'
import enErrors from './locales/en/errors.json'
import enMemories from './locales/en/memories.json'

import esCommon from './locales/es/common.json'
import esAuth from './locales/es/auth.json'
import esTabs from './locales/es/tabs.json'
import esProfile from './locales/es/profile.json'
import esUtilities from './locales/es/utilities.json'
import esTrip from './locales/es/trip.json'
import esExpenses from './locales/es/expenses.json'
import esGroup from './locales/es/group.json'
import esInvite from './locales/es/invite.json'
import esTools from './locales/es/tools.json'
import esOnboarding from './locales/es/onboarding.json'
import esErrors from './locales/es/errors.json'
import esMemories from './locales/es/memories.json'

/** Registro central — ao criar namespace novo, importe os 3 idiomas aqui. */
export const i18nResources: Record<AppLocale, Record<string, object>> = {
  'pt-BR': {
    common: ptBRCommon,
    auth: ptBRAuth,
    tabs: ptBRTabs,
    profile: ptBRProfile,
    utilities: ptBRUtilities,
    trip: ptBRTrip,
    expenses: ptBRExpenses,
    group: ptBRGroup,
    invite: ptBRInvite,
    tools: ptBRTools,
    onboarding: ptBROnboarding,
    errors: ptBRErrors,
    memories: ptBRMemories
  },
  en: {
    common: enCommon,
    auth: enAuth,
    tabs: enTabs,
    profile: enProfile,
    utilities: enUtilities,
    trip: enTrip,
    expenses: enExpenses,
    group: enGroup,
    invite: enInvite,
    tools: enTools,
    onboarding: enOnboarding,
    errors: enErrors,
    memories: enMemories
  },
  es: {
    common: esCommon,
    auth: esAuth,
    tabs: esTabs,
    profile: esProfile,
    utilities: esUtilities,
    trip: esTrip,
    expenses: esExpenses,
    group: esGroup,
    invite: esInvite,
    tools: esTools,
    onboarding: esOnboarding,
    errors: esErrors,
    memories: esMemories
  }
}
