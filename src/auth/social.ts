import { Platform } from 'react-native'

export type SocialProvider = 'google' | 'apple' | 'facebook'

export type SocialCredential = {
  provider: SocialProvider
  idToken: string
}

const providerLabels: Record<SocialProvider, string> = {
  google: 'Google',
  apple: 'Apple',
  facebook: 'Facebook'
}

export class SocialAuthNotConfiguredError extends Error {
  constructor(provider: SocialProvider) {
    super(`Login com ${providerLabels[provider]} ainda não está configurado no app.`)
    this.name = 'SocialAuthNotConfiguredError'
  }
}

export async function obtainSocialCredential(provider: SocialProvider): Promise<SocialCredential> {
  switch (provider) {
    case 'google':
      return obtainGoogleCredential()
    case 'apple':
      return obtainAppleCredential()
    case 'facebook':
      return obtainFacebookCredential()
  }
}

async function obtainGoogleCredential(): Promise<SocialCredential> {
  throw new SocialAuthNotConfiguredError('google')
}

async function obtainAppleCredential(): Promise<SocialCredential> {
  if (Platform.OS !== 'ios') {
    throw new Error('Login com Apple disponível apenas no iOS.')
  }

  throw new SocialAuthNotConfiguredError('apple')
}

async function obtainFacebookCredential(): Promise<SocialCredential> {
  throw new SocialAuthNotConfiguredError('facebook')
}
