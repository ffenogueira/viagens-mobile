import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StatusBar } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { useTranslation } from 'react-i18next'
import { Box, Text, VStack } from '../../components/ui'
import { BrandMark } from '../components/BrandMark'
import { colors } from '../theme'
import { AuthScreen } from './AuthScreen'
import { OnboardingScreen } from './OnboardingScreen'
import type { AuthScreenProps } from './types'

const ONBOARDING_KEY = 'viagens_onboarding_seen'

type GuestScreenProps = AuthScreenProps

export function GuestScreen(props: GuestScreenProps) {
  const { t } = useTranslation('onboarding')
  const [phase, setPhase] = useState<'loading' | 'splash' | 'onboarding' | 'auth'>('loading')

  useEffect(() => {
    async function load() {
      const seen = await SecureStore.getItemAsync(ONBOARDING_KEY)
      setPhase('splash')
      setTimeout(() => {
        setPhase(seen === '1' ? 'auth' : 'onboarding')
      }, 950)
    }
    load()
  }, [])

  async function finishOnboarding() {
    await SecureStore.setItemAsync(ONBOARDING_KEY, '1')
    setPhase('auth')
  }

  if (phase === 'loading') {
    return (
      <Box className="flex-1 items-center justify-center bg-[#FAF7FF]">
        <ActivityIndicator color={colors.primary} size="large" />
      </Box>
    )
  }

  if (phase === 'splash') {
    return (
      <Box className="flex-1 bg-[#FAF7FF]">
        <StatusBar barStyle="dark-content" backgroundColor="#FAF7FF" />
        <LinearGradient
          colors={['#FFFFFF', '#FAF7FF', '#ECFEFF']}
          locations={[0, 0.62, 1]}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <VStack className="items-center gap-5">
            <BrandMark variant="dark" size="md" />
            <Text className="max-w-[260px] text-center text-[14px] font-bold leading-6 text-muted-foreground">
              {t('splashTagline')}
            </Text>
          </VStack>
        </LinearGradient>
      </Box>
    )
  }

  return (
    <>
      <StatusBar barStyle={phase === 'onboarding' ? 'light-content' : 'dark-content'} />
      {phase === 'onboarding' ? (
        <OnboardingScreen onComplete={finishOnboarding} />
      ) : (
        <AuthScreen {...props} />
      )}
    </>
  )
}
