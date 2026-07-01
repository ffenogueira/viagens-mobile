import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { ActivityIndicator, Platform } from 'react-native'
import { HStack, Pressable, Text, VStack } from '../../components/ui'
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
      renderIcon: (busy) =>
        busy ? <ActivityIndicator color={colors.primary} size="small" /> : <GoogleIcon size={20} />
    },
    {
      id: 'facebook',
      label: 'Facebook',
      backgroundColor: '#1877F2',
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
    <VStack className="items-center gap-3">
      <Text className="text-[12px] font-bold text-muted-foreground">Entrar rápido com</Text>
      <HStack className="items-center justify-center gap-3">
        {visible.map((provider) => {
          const isBusy = loading && loadingProvider === provider.id

          return (
            <Pressable
              key={provider.id}
              disabled={loading}
              onPress={() => onPress(provider.id)}
              accessibilityLabel={`Entrar com ${provider.label}`}
              className="h-[50px] w-[50px] items-center justify-center rounded-full active:opacity-90 data-[disabled=true]:opacity-60"
              style={{
                backgroundColor: provider.backgroundColor,
                borderWidth: provider.borderColor ? 1 : 0,
                borderColor: provider.borderColor,
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.07,
                shadowRadius: 10,
                elevation: 1
              }}
            >
              {provider.renderIcon(!!isBusy)}
            </Pressable>
          )
        })}
      </HStack>
    </VStack>
  )
}
