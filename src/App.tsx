import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, StatusBar } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { Box, GluestackUIProvider } from '../components/ui'
import {
  AuthUser,
  clearToken,
  createTrip,
  fetchTrips,
  login,
  loginWithSocial,
  register,
  restoreSession
} from './api/client'
import {
  obtainSocialCredential,
  SocialAuthNotConfiguredError,
  type SocialProvider
} from './auth/social'
import { FloatingTabBar } from './components/FloatingTabBar'
import { ScreenHeader } from './components/ScreenHeader'
import { GuestScreen } from './screens/GuestScreen'
import { MemoriesScreen } from './screens/MemoriesScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { TodayScreen } from './screens/TodayScreen'
import { ToolsScreen } from './screens/ToolsScreen'
import { colors } from './theme'
import type { Tab, Trip } from './types/trip'

type AppSession = 'loading' | 'guest' | 'authenticated'

function AppContent() {
  const [session, setSession] = useState<AppSession>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(false)
  const [socialProvider, setSocialProvider] = useState<SocialProvider | null>(null)
  const [tab, setTab] = useState<Tab>('today')
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)

  useEffect(() => {
    async function boot() {
      const restored = await restoreSession()
      if (!restored) {
        setSession('guest')
        return
      }

      setUser(restored.user)
      await loadTrips()
      setSession('authenticated')
    }

    boot()
  }, [])

  async function loadTrips() {
    try {
      const data = await fetchTrips()
      setTrips(data)
      setSelectedTrip(data[0] || null)
    } catch {
      setTrips([])
      setSelectedTrip(null)
    }
  }

  async function submitAuth() {
    const trimmedEmail = email.trim()
    const trimmedName = name.trim()

    if (!trimmedEmail || !password) {
      Alert.alert('Campos obrigatórios', 'Informe e-mail e senha para continuar.')
      return
    }

    if (mode === 'register' && !trimmedName) {
      Alert.alert('Nome obrigatório', 'Informe seu nome para criar a conta.')
      return
    }

    if (password.length < 8) {
      Alert.alert('Senha curta', 'Use pelo menos 8 caracteres na senha.')
      return
    }

    setLoading(true)
    try {
      const authSession = mode === 'login'
        ? await login(trimmedEmail, password)
        : await register(trimmedName, trimmedEmail, password)

      if (!authSession.user?.id || !authSession.user?.email) {
        throw new Error('Resposta de autenticação inválida.')
      }

      setUser(authSession.user)
      try {
        await loadTrips()
      } catch {
        setTrips([])
        setSelectedTrip(null)
      }
      setSession('authenticated')
    } catch (error) {
      Alert.alert('Acesso não concluído', error instanceof Error ? error.message : 'Confira seus dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function submitSocialAuth(provider: SocialProvider) {
    setSocialLoading(true)
    setSocialProvider(provider)
    try {
      const credential = await obtainSocialCredential(provider)
      const authSession = await loginWithSocial(credential.provider, credential.idToken)

      if (!authSession.user?.id || !authSession.user?.email) {
        throw new Error('Resposta de autenticação social inválida.')
      }

      setUser(authSession.user)
      try {
        await loadTrips()
      } catch {
        setTrips([])
        setSelectedTrip(null)
      }
      setSession('authenticated')
    } catch (error) {
      if (error instanceof SocialAuthNotConfiguredError) {
        Alert.alert(
          'Login social em breve',
          'Google, Facebook e Apple já estão no layout. Assim que a API e o OAuth forem ativados, o acesso funcionará aqui.'
        )
        return
      }

      Alert.alert(
        'Acesso social não concluído',
        error instanceof Error ? error.message : 'Tente novamente em instantes.'
      )
    } finally {
      setSocialLoading(false)
      setSocialProvider(null)
    }
  }

  async function logout() {
    await clearToken()
    setUser(null)
    setTrips([])
    setSelectedTrip(null)
    setSession('guest')
  }

  async function handleCreateTrip() {
    setLoading(true)
    try {
      const trip = await createTrip()
      await loadTrips()
      setSelectedTrip(trip)
    } catch (error) {
      Alert.alert('Viagem não criada', error instanceof Error ? error.message : 'Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (session === 'loading') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    )
  }

  if (session === 'guest') {
    return (
      <SafeAreaView className="flex-1" edges={[]}>
        <GuestScreen
          mode={mode}
          name={name}
          email={email}
          password={password}
          loading={loading}
          socialLoading={socialLoading}
          socialProvider={socialProvider}
          onModeChange={setMode}
          onNameChange={setName}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={submitAuth}
          onSocialLogin={submitSocialAuth}
        />
      </SafeAreaView>
    )
  }

  const destination = selectedTrip
    ? `${selectedTrip.destination}${selectedTrip.country ? `, ${selectedTrip.country}` : ''}`
    : undefined

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScreenHeader
        user={user}
        destination={destination}
        onLogout={tab === 'profile' ? undefined : () => setTab('profile')}
        showNotification={tab !== 'profile'}
      />

      <Box className="flex-1 pb-[88px]">
        {tab === 'today' && (
          <TodayScreen
            selectedTrip={selectedTrip}
            trips={trips}
            loading={loading}
            onCreateTrip={handleCreateTrip}
            onNavigate={setTab}
          />
        )}
        {tab === 'tools' && <ToolsScreen selectedTrip={selectedTrip} />}
        {tab === 'memories' && <MemoriesScreen selectedTrip={selectedTrip} />}
        {tab === 'profile' && (
          <ProfileScreen user={user} tripCount={trips.length} onLogout={logout} />
        )}
      </Box>

      <FloatingTabBar active={tab} onChange={setTab} />
    </SafeAreaView>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GluestackUIProvider mode="light">
        <AppContent />
      </GluestackUIProvider>
    </SafeAreaProvider>
  )
}
