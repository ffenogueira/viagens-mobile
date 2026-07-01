import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { ActivityIndicator, Platform } from 'react-native'
import { Box, HStack, Pressable, Text, VStack } from '../../components/ui'
import { GoogleIcon } from './icons/GoogleIcon'
import { colors } from '../theme'
import type { SocialProvider } from '../auth/social'

type SocialLoginButtonsProps = {
  loading?: boolean
  loadingProvider?: SocialProvider | null
  onPress: (provider: SocialProvider) => void
}

type ProviderConfig = {
  id: SocialProvider
  label: string
  backgroundColor: string
  borderColor?: string
  textColor: string
  iosOnly?: boolean
  renderIcon: (busy: boolean) => React.ReactNode
}

export function SocialLoginButtons({
  loading,
  loadingProvider,
  onPress
}: SocialLoginButtonsProps) {
  const providers: ProviderConfig[] = [
    {
      id: 'google',
      label: 'Google',
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
      textColor: '#111827',
      renderIcon: (busy) =>
        busy ? <ActivityIndicator color={colors.primary} size="small" /> : <GoogleIcon size={20} />
    },
    {
      id: 'facebook',
      label: 'Facebook',
      backgroundColor: '#1877F2',
      textColor: '#FFFFFF',
      renderIcon: (busy) =>
        busy ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Ionicons color="#FFFFFF" name="logo-facebook" size={22} />
        )
    },
    {
      id: 'apple',
      label: 'Apple',
      backgroundColor: '#111827',
      textColor: '#FFFFFF',
      iosOnly: true,
      renderIcon: (busy) =>
        busy ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Ionicons color="#FFFFFF" name="logo-apple" size={22} />
        )
    }
  ]

  const visible = providers.filter((item) => !item.iosOnly || Platform.OS === 'ios')

  return (
    <VStack className="gap-3">
      {visible.map((provider) => {
        const isBusy = loading && loadingProvider === provider.id

        return (
          <Pressable
            key={provider.id}
            disabled={loading}
            onPress={() => onPress(provider.id)}
            className="h-[52px] flex-row items-center justify-center gap-3 rounded-full active:opacity-90 data-[disabled=true]:opacity-60"
            style={{
              backgroundColor: provider.backgroundColor,
              borderWidth: provider.borderColor ? 1 : 0,
              borderColor: provider.borderColor
            }}
          >
            {provider.renderIcon(!!isBusy)}
            <Text className="text-[15px] font-semibold" style={{ color: provider.textColor }}>
              {provider.label}
            </Text>
          </Pressable>
        )
      })}
    </VStack>
  )
}
