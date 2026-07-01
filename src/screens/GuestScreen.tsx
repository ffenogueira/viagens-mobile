import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StatusBar } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { Box } from '../../components/ui'
import { AuthScreen } from './AuthScreen'
import { OnboardingScreen } from './OnboardingScreen'
import type { AuthScreenProps } from './types'

const ONBOARDING_KEY = 'viagens_onboarding_seen'

type GuestScreenProps = AuthScreenProps

export function GuestScreen(props: GuestScreenProps) {
  const [phase, setPhase] = useState<'loading' | 'onboarding' | 'auth'>('loading')

  useEffect(() => {
    async function load() {
      const seen = await SecureStore.getItemAsync(ONBOARDING_KEY)
      setPhase(seen === '1' ? 'auth' : 'onboarding')
    }
    load()
  }, [])

  async function finishOnboarding() {
    await SecureStore.setItemAsync(ONBOARDING_KEY, '1')
    setPhase('auth')
  }

  if (phase === 'loading') {
    return (
      <Box className="flex-1 items-center justify-center bg-[#0B1120]">
        <ActivityIndicator color="#FFFFFF" size="large" />
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
