import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Box, GluestackUIProvider } from '../components/ui'
import {
  AuthUser,
  clearToken,
  createTrip,
  fetchTrips,
  login,
  register,
  restoreSession
} from './api/client'
import { FloatingTabBar } from './components/FloatingTabBar'
import { ScreenHeader } from './components/ScreenHeader'
import { AuthScreen } from './screens/AuthScreen'
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
    if (mode === 'register' && password.length < 8) {
      Alert.alert('Senha curta', 'Use pelo menos 8 caracteres na senha.')
      return
    }

    setLoading(true)
    try {
      const authSession = mode === 'login'
        ? await login(email, password)
        : await register(name, email, password)

      setUser(authSession.user)
      await loadTrips()
      setSession('authenticated')
    } catch (error) {
      Alert.alert('Acesso não concluído', error instanceof Error ? error.message : 'Confira seus dados e tente novamente.')
    } finally {
      setLoading(false)
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
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <AuthScreen
          mode={mode}
          name={name}
          email={email}
          password={password}
          loading={loading}
          onModeChange={setMode}
          onNameChange={setName}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={submitAuth}
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
    <GluestackUIProvider mode="light">
      <AppContent />
    </GluestackUIProvider>
  )
}
