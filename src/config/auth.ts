import Constants from 'expo-constants'
import { Platform } from 'react-native'

type ExtraConfig = {
  googleWebClientId?: string
  googleIosClientId?: string
  googleAndroidClientId?: string
  appleServiceId?: string
}

function readExtra(): ExtraConfig {
  const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig
  return extra
}

export function getGoogleWebClientId(): string | undefined {
  const extra = readExtra()
  return extra.googleWebClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
}

export function getAppleServiceId(): string | undefined {
  const extra = readExtra()
  return (
    extra.appleServiceId ||
    process.env.EXPO_PUBLIC_APPLE_SERVICE_ID ||
    process.env.EXPO_PUBLIC_APPLE_CLIENT_ID
  )
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(getGoogleWebClientId())
}

export function isAppleSignInConfigured(): boolean {
  if (Platform.OS === 'ios') return true
  return Boolean(getAppleServiceId())
}
