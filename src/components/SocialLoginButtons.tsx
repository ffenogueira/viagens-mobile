import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { ActivityIndicator } from 'react-native'
import { Box, Pressable, Text, VStack } from '../../components/ui'
import { GoogleIcon } from './icons/GoogleIcon'
import { colors } from '../theme'
import type { SocialProvider } from '../auth/social.types'

type SocialLoginButtonsProps = {
  loading?: boolean
  loadingProvider?: SocialProvider | null
  onPress: (provider: SocialProvider) => void
}

type ProviderConfig = {
  id: SocialProvider
  title: string
  icon: (busy: boolean) => React.ReactNode
}

export function SocialLoginButtons({
  loading,
  loadingProvider,
  onPress
}: SocialLoginButtonsProps) {
  const providers: ProviderConfig[] = [
    {
      id: 'google',
      title: 'Continuar com Google',
      icon: (busy) =>
        busy ? <ActivityIndicator color={colors.primary} size="small" /> : <GoogleIcon size={20} />
    },
    {
      id: 'apple',
      title: 'Continuar com Apple',
      icon: (busy) =>
        busy ? (
          <ActivityIndicator color="#111827" size="small" />
        ) : (
          <Ionicons color="#111827" name="logo-apple" size={22} />
        )
    }
  ]

  return (
    <VStack className="gap-3">
      {providers.map((provider) => {
        const isBusy = loading && loadingProvider === provider.id

        return (
          <Pressable
            key={provider.id}
            disabled={loading}
            onPress={() => onPress(provider.id)}
            accessibilityLabel={provider.title}
            className="h-[52px] w-full flex-row items-center rounded-full border border-[#D1D5DB] bg-white px-5 active:opacity-90 data-[disabled=true]:opacity-60"
          >
            <Box className="w-7 items-center">{provider.icon(!!isBusy)}</Box>
            <Text className="flex-1 text-center text-[15px] font-semibold text-[#111827]">
              {provider.title}
            </Text>
            <Box className="w-7" />
          </Pressable>
        )
      })}
    </VStack>
  )
}
