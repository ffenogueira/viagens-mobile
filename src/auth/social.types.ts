import { i18n } from '../i18n'

export type SocialProvider = 'google' | 'apple'

export type SocialCredential = {
  provider: SocialProvider
  idToken: string
}

const providerLabels: Record<SocialProvider, string> = {
  google: 'Google',
  apple: 'Apple'
}

export class SocialAuthNotConfiguredError extends Error {
  constructor(provider: SocialProvider) {
    super(i18n.t('socialNotConfigured', { ns: 'errors', provider: providerLabels[provider] }))
    this.name = 'SocialAuthNotConfiguredError'
  }
}

export class SocialAuthCancelledError extends Error {
  constructor(provider: SocialProvider) {
    super(i18n.t('socialCancelled', { ns: 'errors', provider: providerLabels[provider] }))
    this.name = 'SocialAuthCancelledError'
  }
}

export class SocialAuthNativeModuleError extends Error {
  constructor(provider: SocialProvider) {
    super(i18n.t('socialRebuildRequired', { ns: 'errors', provider: providerLabels[provider] }))
    this.name = 'SocialAuthNativeModuleError'
  }
}
