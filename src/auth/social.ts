import { Platform } from 'react-native'
import type { DiscoveryDocument } from 'expo-auth-session'
import { i18n } from '../i18n'
import { getAppleServiceId, getGoogleWebClientId, isAppleSignInConfigured, isGoogleSignInConfigured } from '../config/auth'
import {
  SocialAuthCancelledError,
  SocialAuthNativeModuleError,
  SocialAuthNotConfiguredError,
  type SocialCredential,
  type SocialProvider
} from './social.types'

export type { SocialCredential, SocialProvider } from './social.types'
export {
  SocialAuthCancelledError,
  SocialAuthNativeModuleError,
  SocialAuthNotConfiguredError
} from './social.types'

export async function obtainSocialCredential(provider: SocialProvider): Promise<SocialCredential> {
  switch (provider) {
    case 'google':
      return obtainGoogleCredential()
    case 'apple':
      return obtainAppleCredential()
  }
}

async function obtainGoogleCredential(): Promise<SocialCredential> {
  if (!isGoogleSignInConfigured()) {
    throw new SocialAuthNotConfiguredError('google')
  }

  let AuthSession: typeof import('expo-auth-session')
  let WebBrowser: typeof import('expo-web-browser')

  try {
    AuthSession = await import('expo-auth-session')
    WebBrowser = await import('expo-web-browser')
  } catch {
    throw new SocialAuthNativeModuleError('google')
  }

  try {
    WebBrowser.maybeCompleteAuthSession()
  } catch {
    throw new SocialAuthNativeModuleError('google')
  }

  const clientId = getGoogleWebClientId()!
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'viagens-preview' })

  const request = new AuthSession.AuthRequest({
    clientId,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    usePKCE: false
  })

  const discovery: DiscoveryDocument = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke'
  }

  const result = await request.promptAsync(discovery)

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new SocialAuthCancelledError('google')
  }

  if (result.type !== 'success') {
    throw new Error(i18n.t('socialLoginIncomplete', { ns: 'errors', provider: 'Google' }))
  }

  const idToken = result.params.id_token
  if (!idToken) {
    throw new Error(i18n.t('socialTokenMissing', { ns: 'errors', provider: 'Google' }))
  }

  return { provider: 'google', idToken }
}

async function obtainAppleCredential(): Promise<SocialCredential> {
  if (Platform.OS === 'ios') {
    return obtainAppleCredentialNative()
  }
  return obtainAppleCredentialOAuth()
}

async function obtainAppleCredentialNative(): Promise<SocialCredential> {
  let AppleAuthentication: typeof import('expo-apple-authentication')
  try {
    AppleAuthentication = await import('expo-apple-authentication')
  } catch {
    throw new SocialAuthNativeModuleError('apple')
  }

  const available = await AppleAuthentication.isAvailableAsync()
  if (!available) {
    throw new SocialAuthNotConfiguredError('apple')
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL
      ]
    })

    if (!credential.identityToken) {
      throw new Error(i18n.t('socialTokenMissing', { ns: 'errors', provider: 'Apple' }))
    }

    return { provider: 'apple', idToken: credential.identityToken }
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
      throw new SocialAuthCancelledError('apple')
    }
    throw error instanceof Error
      ? error
      : new Error(i18n.t('socialLoginIncomplete', { ns: 'errors', provider: 'Apple' }))
  }
}

async function obtainAppleCredentialOAuth(): Promise<SocialCredential> {
  if (!isAppleSignInConfigured()) {
    throw new SocialAuthNotConfiguredError('apple')
  }

  let AuthSession: typeof import('expo-auth-session')
  let WebBrowser: typeof import('expo-web-browser')

  try {
    AuthSession = await import('expo-auth-session')
    WebBrowser = await import('expo-web-browser')
  } catch {
    throw new SocialAuthNativeModuleError('apple')
  }

  try {
    WebBrowser.maybeCompleteAuthSession()
  } catch {
    throw new SocialAuthNativeModuleError('apple')
  }

  const clientId = getAppleServiceId()!
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'viagens-preview' })

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: ['name', 'email'],
    responseType: AuthSession.ResponseType.IdToken,
    usePKCE: true,
    extraParams: { response_mode: 'form_post' }
  })

  const discovery: DiscoveryDocument = {
    authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
    tokenEndpoint: 'https://appleid.apple.com/auth/token'
  }

  const result = await request.promptAsync(discovery)

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new SocialAuthCancelledError('apple')
  }

  if (result.type !== 'success') {
    throw new Error(i18n.t('socialLoginIncomplete', { ns: 'errors', provider: 'Apple' }))
  }

  const idToken = result.params.id_token
  if (!idToken) {
    throw new Error(i18n.t('socialTokenMissing', { ns: 'errors', provider: 'Apple' }))
  }

  return { provider: 'apple', idToken }
}
