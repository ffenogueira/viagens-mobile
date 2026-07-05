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
    super(`Login com ${providerLabels[provider]} ainda não está configurado no app.`)
    this.name = 'SocialAuthNotConfiguredError'
  }
}

export class SocialAuthCancelledError extends Error {
  constructor(provider: SocialProvider) {
    super(`Login com ${providerLabels[provider]} cancelado.`)
    this.name = 'SocialAuthCancelledError'
  }
}

export class SocialAuthNativeModuleError extends Error {
  constructor(provider: SocialProvider) {
    super(
      `Login com ${providerLabels[provider]} precisa de rebuild do app. Rode: npm run android`
    )
    this.name = 'SocialAuthNativeModuleError'
  }
}
