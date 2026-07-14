import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Modal, StatusBar } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { Box, GluestackUIProvider, HStack, Pressable, Text, VStack } from '../components/ui'
import {
  AuthUser,
  clearToken,
  createTrip,
  fetchTrips,
  login,
  loginWithSocial,
  register,
  restoreSession,
  updateUserLocale
} from './api/client'
import {
  obtainSocialCredential,
  SocialAuthCancelledError,
  SocialAuthNativeModuleError,
  SocialAuthNotConfiguredError,
  type SocialProvider
} from './auth/social'
import { CreateTripSheet, type CreateTripInput } from './components/CreateTripSheet'
import { InviteAcceptModal } from './components/InviteAcceptModal'
import { FloatingTabBar } from './components/FloatingTabBar'
import { QuickCreateMenu } from './components/QuickCreateMenu'
import { ScreenHeader } from './components/ScreenHeader'
import { GuestScreen } from './screens/GuestScreen'
import { MemoriesScreen } from './screens/MemoriesScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { BillSplitScreen } from './screens/BillSplitScreen'
import { ExpensesScreen } from './screens/ExpensesScreen'
import { GroupChatScreen } from './screens/GroupChatScreen'
import { WeatherScreen } from './screens/WeatherScreen'
import { TodayScreen } from './screens/TodayScreen'
import { ToolsScreen } from './screens/ToolsScreen'
import { TripWorkspaceScreen } from './screens/TripWorkspaceScreen'
import { UtilitiesScreen } from './screens/UtilitiesScreen'
import { colors } from './theme'
import { parseInviteTokenFromUrl } from './lib/tripInvite'
import { changeAppLocale, getActiveLocale, initI18n, i18n } from './i18n'
import { LOCALE_OPTIONS, type AppLocale } from './i18n/types'
import type { NavigationTarget, OverlayScreen, Tab, Trip, TripHomeShortcut, TripToolsPanel } from './types/trip'

const PENDING_INVITE_KEY = 'viagens_pending_invite'

function isTab(target: NavigationTarget): target is Tab {
  return (
    target === 'today' ||
    target === 'utilities' ||
    target === 'tools' ||
    target === 'memories' ||
    target === 'profile'
  )
}

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
  const [overlay, setOverlay] = useState<OverlayScreen | null>(null)
  const [overlayReturn, setOverlayReturn] = useState<OverlayScreen | null>(null)
  const [toolsInitialMode, setToolsInitialMode] = useState<'fefai' | 'camera' | 'checkin'>('fefai')
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const [createTripOpen, setCreateTripOpen] = useState(false)
  const [focusTripId, setFocusTripId] = useState<string | null>(null)
  const [workspaceToolsPanel, setWorkspaceToolsPanel] = useState<TripToolsPanel | null>(null)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [i18nReady, setI18nReady] = useState(false)
  const [postSignupOpen, setPostSignupOpen] = useState(false)

  async function applyUserLocale(locale?: string | null) {
    if (!locale) return
    await changeAppLocale(locale as AppLocale)
  }

  async function persistInviteToken(token: string) {
    await SecureStore.setItemAsync(PENDING_INVITE_KEY, token)
    setInviteToken(token)
  }

  async function clearInviteToken() {
    await SecureStore.deleteItemAsync(PENDING_INVITE_KEY)
    setInviteToken(null)
  }

  function openInviteModal(token: string) {
    setInviteToken(token)
    setInviteModalOpen(true)
  }

  async function rememberInviteFromUrl(url: string | null) {
    const token = parseInviteTokenFromUrl(url)
    if (!token) return
    await persistInviteToken(token)
  }

  async function resumePendingInvite() {
    const stored = inviteToken ?? (await SecureStore.getItemAsync(PENDING_INVITE_KEY))
    if (stored) {
      openInviteModal(stored)
    }
  }

  async function handleInviteAccepted(tripId: string) {
    await clearInviteToken()
    setInviteModalOpen(false)
    const fresh = await fetchTrips()
    setTrips(fresh)
    const trip = fresh.find((item) => item.id === tripId) ?? null
    if (trip) {
      setSelectedTrip(trip)
      openTripWorkspace(trip)
      return
    }
    setFocusTripId(tripId)
    setTab('today')
  }

  useEffect(() => {
    async function boot() {
      await initI18n()
      setI18nReady(true)

      const initialUrl = await Linking.getInitialURL()
      await rememberInviteFromUrl(initialUrl)

      const restored = await restoreSession()
      if (!restored) {
        setSession('guest')
        return
      }

      await applyUserLocale(restored.user.locale)
      setUser(restored.user)
      await loadTrips()
      setSession('authenticated')
      await resumePendingInvite()
    }

    boot()
  }, [])

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void (async () => {
        await rememberInviteFromUrl(url)
        if (session === 'authenticated') {
          await resumePendingInvite()
        }
      })()
    })

    return () => subscription.remove()
  }, [session, inviteToken])

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
      Alert.alert(i18n.t('requiredFieldsTitle', { ns: 'auth' }), i18n.t('requiredFieldsBody', { ns: 'auth' }))
      return
    }

    if (mode === 'register' && !trimmedName) {
      Alert.alert(i18n.t('nameRequiredTitle', { ns: 'auth' }), i18n.t('nameRequiredBody', { ns: 'auth' }))
      return
    }

    if (password.length < 8) {
      Alert.alert(i18n.t('shortPassword', { ns: 'auth' }), i18n.t('shortPasswordBody', { ns: 'auth' }))
      return
    }

    setLoading(true)
    try {
      const isRegistering = mode === 'register'
      const authSession = mode === 'login'
        ? await login(trimmedEmail, password)
        : await register(trimmedName, trimmedEmail, password)

      if (!authSession.user?.id || !authSession.user?.email) {
        throw new Error('Resposta de autenticação inválida.')
      }

      setUser(authSession.user)
      await applyUserLocale(authSession.user.locale)
      try {
        await loadTrips()
      } catch {
        setTrips([])
        setSelectedTrip(null)
      }
      setSession('authenticated')
      if (isRegistering) {
        setPostSignupOpen(true)
      }
      await resumePendingInvite()
    } catch (error) {
      Alert.alert(
        i18n.t('authFailed', { ns: 'auth' }),
        error instanceof Error ? error.message : i18n.t('authFailedBody', { ns: 'auth' })
      )
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
      await applyUserLocale(authSession.user.locale)
      try {
        await loadTrips()
      } catch {
        setTrips([])
        setSelectedTrip(null)
      }
      setSession('authenticated')
      await resumePendingInvite()
    } catch (error) {
      if (error instanceof SocialAuthCancelledError) {
        return
      }

      if (error instanceof SocialAuthNotConfiguredError || error instanceof SocialAuthNativeModuleError) {
        Alert.alert(
          error instanceof SocialAuthNativeModuleError
            ? i18n.t('socialUpdateApp', { ns: 'auth' })
            : i18n.t('socialConfiguring', { ns: 'auth' }),
          error.message
        )
        return
      }

      Alert.alert(
        i18n.t('socialFailed', { ns: 'auth' }),
        error instanceof Error ? error.message : i18n.t('socialFailedBody', { ns: 'auth' })
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

  async function handleCreateTrip(input: CreateTripInput) {
    setLoading(true)
    try {
      const trip = await createTrip(input)
      await loadTrips()
      setSelectedTrip(trip)
      setFocusTripId(trip.id)
      setTab('today')
    } catch (error) {
      Alert.alert(
        i18n.t('tripNotCreated', { ns: 'trip' }),
        error instanceof Error ? error.message : i18n.t('generic', { ns: 'errors' })
      )
    } finally {
      setLoading(false)
    }
  }

  function navigate(target: NavigationTarget) {
    if (
      target === 'weather' ||
      target === 'expenses' ||
      target === 'bill-split' ||
      target === 'group-chat'
    ) {
      setOverlayReturn(null)
      setOverlay(target)
      return
    }

    setOverlay(null)
    setOverlayReturn(null)

    if (target === 'tools-camera') {
      setToolsInitialMode('camera')
      setTab('tools')
      return
    }

    setToolsInitialMode('fefai')
    if (isTab(target)) {
      setTab(target)
    }
  }

  function navigateFromTripWorkspace(target: NavigationTarget) {
    setOverlayReturn('trip-workspace')

    if (
      target === 'weather' ||
      target === 'expenses' ||
      target === 'bill-split' ||
      target === 'group-chat'
    ) {
      setOverlay(target)
      return
    }

    setOverlay(null)

    if (target === 'tools-camera') {
      setToolsInitialMode('camera')
      setTab('tools')
      return
    }

    setToolsInitialMode('fefai')
    if (isTab(target)) {
      setTab(target)
    }
  }

  function openTripWorkspace(trip: Trip, shortcut?: TripHomeShortcut) {
    setSelectedTrip(trip)
    setOverlayReturn(null)

    if (shortcut === 'group') {
      setWorkspaceToolsPanel(null)
      setOverlayReturn('trip-workspace')
      setOverlay('group-chat')
      return
    }

    if (shortcut === 'budget') {
      setWorkspaceToolsPanel(null)
      setOverlayReturn('trip-workspace')
      setOverlay('expenses')
      return
    }

    if (shortcut === 'wishlist' || shortcut === 'checklist' || shortcut === 'board') {
      setWorkspaceToolsPanel(shortcut)
    } else {
      setWorkspaceToolsPanel(null)
    }

    setOverlay('trip-workspace')
  }

  function handleTripUpdated(trip: Trip) {
    setSelectedTrip(trip)
    setTrips((current) => current.map((entry) => (entry.id === trip.id ? { ...entry, ...trip } : entry)))
  }

  function handleTripDeleted(tripId: string) {
    setTrips((current) => current.filter((entry) => entry.id !== tripId))
    setSelectedTrip((current) => (current?.id === tripId ? null : current))
    closeOverlay()
  }

  function closeOverlay() {
    setOverlay(null)
    setOverlayReturn(null)
    setWorkspaceToolsPanel(null)
  }

  function backFromOverlay() {
    if (overlayReturn) {
      setOverlay(overlayReturn)
      setOverlayReturn(null)
      return
    }
    closeOverlay()
  }

  if (session === 'loading' || !i18nReady) {
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
          invitePending={Boolean(inviteToken)}
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

  const immersiveOverlay = overlay === 'trip-workspace'

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={immersiveOverlay ? ['left', 'right'] : ['top', 'left', 'right']}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {!immersiveOverlay ? (
        <ScreenHeader
          user={user}
          destination={tab === 'today' ? undefined : destination}
          onLogout={tab === 'profile' ? undefined : () => setTab('profile')}
          onNotificationPress={() => setNotificationSheetOpen(true)}
          showNotification={tab !== 'profile'}
        />
      ) : null}

      <Box className="flex-1 pb-[104px]">
        {overlay === 'trip-workspace' ? (
          <TripWorkspaceScreen
            trip={selectedTrip}
            initialToolsPanel={workspaceToolsPanel}
            onBack={closeOverlay}
            onNavigate={navigateFromTripWorkspace}
            onTripUpdated={handleTripUpdated}
            onTripDeleted={handleTripDeleted}
          />
        ) : overlay === 'weather' ? (
          <WeatherScreen selectedTrip={selectedTrip} onBack={backFromOverlay} />
        ) : overlay === 'expenses' ? (
          <ExpensesScreen
            selectedTrip={selectedTrip}
            onBack={backFromOverlay}
            onOpenBillSplit={() => {
              setOverlayReturn('expenses')
              setOverlay('bill-split')
            }}
          />
        ) : overlay === 'bill-split' ? (
          <BillSplitScreen selectedTrip={selectedTrip} onBack={backFromOverlay} />
        ) : overlay === 'group-chat' ? (
          <GroupChatScreen selectedTrip={selectedTrip} user={user} onBack={backFromOverlay} />
        ) : (
          <>
            {tab === 'today' && (
              <TodayScreen
                user={user}
                trips={trips}
                loading={loading}
                focusTripId={focusTripId}
                onFocusTripHandled={() => setFocusTripId(null)}
                onOpenCreateTrip={() => setCreateTripOpen(true)}
                onNavigate={navigate}
                onSelectTrip={setSelectedTrip}
                onOpenTrip={openTripWorkspace}
              />
            )}
            {tab === 'utilities' && <UtilitiesScreen />}
            {tab === 'tools' && (
              <ToolsScreen selectedTrip={selectedTrip} initialMode={toolsInitialMode} />
            )}
            {tab === 'memories' && <MemoriesScreen selectedTrip={selectedTrip} />}
            {tab === 'profile' && (
              <ProfileScreen user={user} tripCount={trips.length} onLogout={logout} />
            )}
          </>
        )}
      </Box>

      <FloatingTabBar
        active={tab}
        onChange={setTab}
        onCreatePress={() => setQuickCreateOpen(true)}
      />
      <QuickCreateMenu
        visible={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onCreateTrip={() => setCreateTripOpen(true)}
        onNavigate={navigate}
        onSetTab={setTab}
      />
      <CreateTripSheet
        visible={createTripOpen}
        loading={loading}
        firstName={user?.name?.split(' ')[0] || 'viajante'}
        onClose={() => setCreateTripOpen(false)}
        onSubmit={(input) => {
          setCreateTripOpen(false)
          void handleCreateTrip(input)
        }}
      />
      <NotificationSheet
        visible={notificationSheetOpen}
        onClose={() => setNotificationSheetOpen(false)}
      />
      <PostSignupSetupModal
        visible={postSignupOpen}
        user={user}
        onClose={() => setPostSignupOpen(false)}
        onCreateTrip={() => {
          setPostSignupOpen(false)
          setCreateTripOpen(true)
        }}
        onLocaleChanged={(locale) => {
          setUser((current) => (current ? { ...current, locale } : current))
        }}
      />
      {session === 'authenticated' ? (
        <InviteAcceptModal
          visible={inviteModalOpen}
          token={inviteToken}
          onClose={async () => {
            setInviteModalOpen(false)
            await clearInviteToken()
          }}
          onAccepted={(tripId) => {
            void handleInviteAccepted(tripId)
          }}
        />
      ) : null}
    </SafeAreaView>
  )
}

function PostSignupSetupModal({
  visible,
  user,
  onClose,
  onCreateTrip,
  onLocaleChanged
}: {
  visible: boolean
  user: AuthUser | null
  onClose: () => void
  onCreateTrip: () => void
  onLocaleChanged: (locale: AppLocale) => void
}) {
  const [locale, setLocale] = useState<AppLocale>(getActiveLocale())
  const steps = [
    {
      icon: 'language-outline' as const,
      title: 'Escolha o idioma',
      desc: 'O app, datas e mensagens ficam no idioma que você usa para viajar.'
    },
    {
      icon: 'location-outline' as const,
      title: 'Conte seu próximo destino',
      desc: 'A FEFAI usa destino, datas e estilo para sugerir roteiro de verdade.'
    },
    {
      icon: 'people-outline' as const,
      title: 'Convide quem vai junto',
      desc: 'Grupo, gastos, chat, checklist e fotos ficam no mesmo espaço.'
    },
    {
      icon: 'navigate-outline' as const,
      title: 'Ative quando estiver viajando',
      desc: 'Check-ins e mapa vivido só funcionam com consentimento e podem ser pausados.'
    }
  ]

  async function selectLocale(next: AppLocale) {
    setLocale(next)
    await changeAppLocale(next)
    onLocaleChanged(next)
    try {
      if (user) await updateUserLocale(next)
    } catch {
      // Preferência local já foi salva; a API sincroniza quando disponível.
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Box className="flex-1 justify-end bg-black/35">
        <Box className="rounded-t-[38px] bg-white px-5 pb-8 pt-3">
          <Box className="mb-5 h-1.5 w-16 self-center rounded-full bg-[#D1D5DB]" />

          <HStack className="items-start justify-between gap-3">
            <VStack className="flex-1">
              <Text className="text-[12px] font-black uppercase tracking-[1.4px] text-primary">
                Primeiro setup
              </Text>
              <Text className="mt-1 text-[28px] font-black leading-[33px] text-foreground">
                Vamos deixar sua viagem com a sua cara
              </Text>
              <Text className="mt-2 text-[14px] font-semibold leading-6 text-muted-foreground">
                Leva menos de um minuto. Depois você já pode criar viagem, chamar amigos e usar a FEFAI.
              </Text>
            </VStack>
            <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full bg-[#F8FAFC]">
              <Ionicons color={colors.ink} name="close" size={20} />
            </Pressable>
          </HStack>

          <HStack className="mt-5 gap-2">
            {LOCALE_OPTIONS.map((option) => {
              const active = option.id === locale
              return (
                <Pressable
                  key={option.id}
                  onPress={() => void selectLocale(option.id)}
                  className={`flex-1 items-center rounded-full border px-2 py-3 ${
                    active ? 'border-primary bg-viagens-lilac' : 'border-[#E5E7EB] bg-white'
                  }`}
                >
                  <Text className={`text-[12px] font-black ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                    {option.nativeLabel}
                  </Text>
                </Pressable>
              )
            })}
          </HStack>

          <VStack className="mt-5 gap-3 rounded-[28px] bg-[#F8FAFC] p-4">
            {steps.map((step, index) => (
              <HStack key={step.title} className="items-start gap-3">
                <Box className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
                  <Ionicons color={index === 0 ? colors.primary : colors.mint} name={step.icon} size={22} />
                </Box>
                <VStack className="flex-1">
                  <Text className="text-[15px] font-black text-foreground">{step.title}</Text>
                  <Text className="mt-0.5 text-[12px] font-semibold leading-5 text-muted-foreground">
                    {step.desc}
                  </Text>
                </VStack>
              </HStack>
            ))}
          </VStack>

          <Pressable onPress={onCreateTrip} className="mt-6 h-14 items-center justify-center rounded-full bg-primary">
            <HStack className="items-center gap-2">
              <Ionicons color={colors.white} name="airplane" size={18} />
              <Text className="text-[16px] font-black text-white">Criar minha primeira viagem</Text>
            </HStack>
          </Pressable>
          <Pressable onPress={onClose} className="mt-4 items-center">
            <Text className="text-[14px] font-black text-muted-foreground">Agora não</Text>
          </Pressable>
        </Box>
      </Box>
    </Modal>
  )
}

function NotificationSheet({
  visible,
  onClose
}: {
  visible: boolean
  onClose: () => void
}) {
  const items = [
    {
      icon: 'airplane-outline' as const,
      title: 'Convites de viagem',
      desc: 'Saiba na hora quando alguém te chamar para planejar junto.'
    },
    {
      icon: 'checkmark-done-outline' as const,
      title: 'Tarefas e reservas',
      desc: 'Passaporte, seguro, hospedagem e pendências sem se perder.'
    },
    {
      icon: 'location-outline' as const,
      title: 'Check-ins do grupo',
      desc: 'Atualizações importantes durante a viagem, com consentimento.'
    }
  ]

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Box className="flex-1 justify-end bg-black/35">
        <Box className="rounded-t-[38px] bg-white px-6 pb-9 pt-3">
          <Box className="mb-6 h-1.5 w-16 self-center rounded-full bg-[#D1D5DB]" />
          <Box className="mb-5 h-[86px] w-[86px] items-center justify-center self-center rounded-[30px] bg-viagens-lilac">
            <Ionicons color={colors.primary} name="notifications" size={42} />
          </Box>
          <Text className="text-center text-[28px] font-black text-foreground">
            Fique por dentro da viagem
          </Text>
          <Text className="mt-2 text-center text-[14px] font-semibold leading-6 text-muted-foreground">
            Notificações para o que importa: convite, tarefa, roteiro, check-in e mudança de plano.
          </Text>

          <VStack className="mt-6 rounded-[28px] bg-[#F8FAFC] p-4">
            {items.map((item) => (
              <HStack key={item.title} className="items-center gap-3 py-3">
                <Box className="h-11 w-11 items-center justify-center rounded-2xl bg-viagens-lilac">
                  <Ionicons color={colors.primary} name={item.icon} size={21} />
                </Box>
                <VStack className="flex-1">
                  <Text className="text-[15px] font-black text-foreground">{item.title}</Text>
                  <Text className="mt-0.5 text-[12px] font-semibold leading-5 text-muted-foreground">
                    {item.desc}
                  </Text>
                </VStack>
              </HStack>
            ))}
          </VStack>

          <Pressable
            onPress={onClose}
            className="mt-6 h-14 items-center justify-center rounded-full bg-primary"
          >
            <Text className="text-[16px] font-black text-white">Entendi</Text>
          </Pressable>
          <Pressable onPress={onClose} className="mt-4 items-center">
            <Text className="text-[14px] font-bold text-muted-foreground">Depois eu vejo</Text>
          </Pressable>
        </Box>
      </Box>
    </Modal>
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
