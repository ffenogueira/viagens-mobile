import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { apiRequest, AuthUser, clearToken, getToken, login, register } from './api/client'
import { colors, shadow } from './theme'

type Tab = 'today' | 'tools' | 'memories' | 'profile'

type Trip = {
  id: string
  title?: string
  name?: string
  destination: string
  country?: string
  start_date?: string
  end_date?: string
  base_currency?: string
  checklist_items?: unknown[]
  expenses?: unknown[]
  photos?: unknown[]
}

export default function App() {
  const [booting, setBooting] = useState(true)
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
      const token = await getToken()
      if (token) {
        await loadTrips()
      }
      setBooting(false)
    }
    boot()
  }, [])

  async function loadTrips() {
    try {
      const data = await apiRequest<Trip[]>('/trips')
      setTrips(data)
      setSelectedTrip(data[0] || null)
    } catch {
      setTrips([])
      setSelectedTrip(null)
    }
  }

  async function submitAuth() {
    setLoading(true)
    try {
      const session = mode === 'login'
        ? await login(email, password)
        : await register(name, email, password)
      setUser(session.user)
      await loadTrips()
    } catch (error) {
      Alert.alert('Acesso nao concluido', error instanceof Error ? error.message : 'Confira seus dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await clearToken()
    setUser(null)
    setTrips([])
    setSelectedTrip(null)
  }

  async function createTrip() {
    setLoading(true)
    try {
      const trip = await apiRequest<Trip>('/trips', {
        method: 'POST',
        body: JSON.stringify({
          destination: 'Lisboa',
          country: 'Portugal',
          startDate: new Date().toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
          baseCurrency: 'EUR'
        })
      })
      await loadTrips()
      setSelectedTrip(trip)
    } catch (error) {
      Alert.alert('Viagem nao criada', error instanceof Error ? error.message : 'Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (booting) {
    return (
      <SafeAreaView style={styles.center}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    )
  }

  if (!user && !trips.length) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
          <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
            <View style={styles.badge}>
              <Ionicons color={colors.primary} name="sparkles" size={16} />
              <Text style={styles.badgeText}>Viagens by Up Your Idea</Text>
            </View>
            <Text style={styles.heroTitle}>Antes, durante e depois da viagem.</Text>
            <Text style={styles.heroCopy}>
              Planeje com IA, use camera para preco e recibo, divida gastos e preserve as memorias do grupo em um app nativo.
            </Text>

            <View style={styles.authCard}>
              <View style={styles.segment}>
                <Pressable style={[styles.segmentButton, mode === 'login' && styles.segmentActive]} onPress={() => setMode('login')}>
                  <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>Entrar</Text>
                </Pressable>
                <Pressable style={[styles.segmentButton, mode === 'register' && styles.segmentActive]} onPress={() => setMode('register')}>
                  <Text style={[styles.segmentText, mode === 'register' && styles.segmentTextActive]}>Criar conta</Text>
                </Pressable>
              </View>

              {mode === 'register' && (
                <Field label="Nome" value={name} onChangeText={setName} autoCapitalize="words" />
              )}
              <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry />
              <Pressable style={styles.primaryButton} onPress={submitAuth} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{mode === 'login' ? 'Entrar no app' : 'Criar workspace'}</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.appHeader}>
        <View>
          <Text style={styles.eyebrow}>Viagens</Text>
          <Text style={styles.headerTitle}>{selectedTrip?.destination || 'Meu workspace'}</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={logout}>
          <Ionicons color={colors.ink} name="log-out-outline" size={22} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.screenContent}>
        {tab === 'today' && <TodayScreen selectedTrip={selectedTrip} trips={trips} onCreateTrip={createTrip} loading={loading} />}
        {tab === 'tools' && <ToolsScreen selectedTrip={selectedTrip} />}
        {tab === 'memories' && <MemoriesScreen selectedTrip={selectedTrip} />}
        {tab === 'profile' && <ProfileScreen user={user} />}
      </ScrollView>

      <View style={styles.tabbar}>
        <TabButton active={tab === 'today'} icon="map-outline" label="Viagem" onPress={() => setTab('today')} />
        <TabButton active={tab === 'tools'} icon="scan-outline" label="IA/OCR" onPress={() => setTab('tools')} />
        <TabButton active={tab === 'memories'} icon="images-outline" label="Memorias" onPress={() => setTab('memories')} />
        <TabButton active={tab === 'profile'} icon="person-outline" label="Perfil" onPress={() => setTab('profile')} />
      </View>
    </SafeAreaView>
  )
}

function TodayScreen({ selectedTrip, trips, onCreateTrip, loading }: { selectedTrip: Trip | null; trips: Trip[]; onCreateTrip: () => void; loading: boolean }) {
  return (
    <View>
      <View style={styles.heroCard}>
        <Text style={styles.cardKicker}>Workspace vivo</Text>
        <Text style={styles.cardTitle}>{selectedTrip ? `${selectedTrip.destination}${selectedTrip.country ? `, ${selectedTrip.country}` : ''}` : 'Crie sua primeira viagem'}</Text>
        <Text style={styles.cardCopy}>
          Roteiro, grupo, gastos, fotos, check-ins e FEFAI no mesmo lugar.
        </Text>
        {!selectedTrip && (
          <Pressable style={styles.primaryButton} onPress={onCreateTrip} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Criar viagem exemplo</Text>}
          </Pressable>
        )}
      </View>

      <View style={styles.grid}>
        <MetricCard color={colors.primary} icon="list-outline" label="Checklist" value={String(selectedTrip?.checklist_items?.length || 0)} />
        <MetricCard color={colors.sky} icon="receipt-outline" label="Gastos" value={String(selectedTrip?.expenses?.length || 0)} />
        <MetricCard color={colors.mint} icon="image-outline" label="Fotos" value={String(selectedTrip?.photos?.length || 0)} />
        <MetricCard color={colors.orange} icon="people-outline" label="Viagens" value={String(trips.length)} />
      </View>
    </View>
  )
}

function ToolsScreen({ selectedTrip }: { selectedTrip: Trip | null }) {
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState('')

  async function askFefai() {
    if (!selectedTrip) {
      Alert.alert('Crie uma viagem primeiro', 'A FEFAI funciona melhor com destino, datas, orcamento e contexto do grupo.')
      return
    }
    setBusy(true)
    try {
      const data = await apiRequest<{ result?: { answer?: string; response?: string } }>(`/trips/${selectedTrip.id}/ai/assistant`, {
        method: 'POST',
        body: JSON.stringify({ prompt: 'Monte os proximos passos mais importantes desta viagem.' })
      })
      setAnswer(data.result?.answer || data.result?.response || 'FEFAI esta processando o contexto da viagem.')
    } catch (error) {
      Alert.alert('FEFAI indisponivel', error instanceof Error ? error.message : 'Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  async function scanPrice() {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permissao de camera', 'Autorize a camera para ler preco e recibo.')
      return
    }
    const image = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: false })
    if (!image.canceled) {
      Alert.alert('Imagem capturada', 'Proximo passo: enviar para o pipeline OCR da API e converter a moeda.')
    }
  }

  async function shareLocation() {
    const permission = await Location.requestForegroundPermissionsAsync()
    if (permission.status !== 'granted') {
      Alert.alert('Permissao de localizacao', 'Autorize a localizacao para check-in e seguranca do grupo.')
      return
    }
    const location = await Location.getCurrentPositionAsync({})
    Alert.alert('Check-in pronto', `Lat: ${location.coords.latitude.toFixed(4)} | Lng: ${location.coords.longitude.toFixed(4)}`)
  }

  return (
    <View style={styles.stack}>
      <NativeToolCard
        color={colors.primary}
        icon="sparkles-outline"
        title="FEFAI contextual"
        text="Sugere roteiro, explica escolhas, resume pendencias e evita resposta solta."
        action="Perguntar"
        busy={busy}
        onPress={askFefai}
      />
      {answer ? <Text style={styles.answer}>{answer}</Text> : null}
      <NativeToolCard
        color={colors.sky}
        icon="scan-outline"
        title="Camera de preco e recibo"
        text="Captura cardapio, etiqueta ou recibo para OCR, conversao e divisao de gasto."
        action="Abrir camera"
        onPress={scanPrice}
      />
      <NativeToolCard
        color={colors.mint}
        icon="location-outline"
        title="Check-in com consentimento"
        text="Compartilha localizacao temporaria com o grupo para seguranca durante a viagem."
        action="Fazer check-in"
        onPress={shareLocation}
      />
    </View>
  )
}

function MemoriesScreen({ selectedTrip }: { selectedTrip: Trip | null }) {
  const items = useMemo(() => [
    ['Album original', 'Fotos sem perder qualidade no envio.'],
    ['Encontrar fotos comigo', 'Busca visual com consentimento para achar em quais fotos a pessoa aparece.'],
    ['Passaporte digital', 'Broches, mapa vivido e historico por estado/pais.']
  ], [])

  return (
    <View style={styles.stack}>
      <View style={styles.heroCard}>
        <Text style={styles.cardKicker}>Depois da viagem</Text>
        <Text style={styles.cardTitle}>{selectedTrip ? 'Transforme a viagem em ativo' : 'Memorias preparadas para sua proxima viagem'}</Text>
        <Text style={styles.cardCopy}>Album, diario, retrospectiva, roteiro vivido e guia compartilhavel.</Text>
      </View>
      {items.map(([title, text]) => (
        <View key={title} style={styles.listCard}>
          <Ionicons color={colors.primary} name="checkmark-circle-outline" size={22} />
          <View style={styles.listText}>
            <Text style={styles.listTitle}>{title}</Text>
            <Text style={styles.listCopy}>{text}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

function ProfileScreen({ user }: { user: AuthUser | null }) {
  return (
    <View style={styles.heroCard}>
      <Text style={styles.cardKicker}>Conta</Text>
      <Text style={styles.cardTitle}>{user?.name || 'Viajante'}</Text>
      <Text style={styles.cardCopy}>{user?.email || 'Perfil conectado ao workspace de viagens.'}</Text>
    </View>
  )
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput {...props} placeholderTextColor="#94A3B8" style={styles.field} />
    </View>
  )
}

function MetricCard({ color, icon, label, value }: { color: string; icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Ionicons color={color} name={icon} size={22} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  )
}

function NativeToolCard({ color, icon, title, text, action, busy, onPress }: { color: string; icon: keyof typeof Ionicons.glyphMap; title: string; text: string; action: string; busy?: boolean; onPress: () => void }) {
  return (
    <View style={styles.toolCard}>
      <View style={[styles.toolIcon, { backgroundColor: color }]}>
        <Ionicons color="#fff" name={icon} size={24} />
      </View>
      <Text style={styles.toolTitle}>{title}</Text>
      <Text style={styles.toolCopy}>{text}</Text>
      <Pressable style={[styles.toolButton, { borderColor: color }]} onPress={onPress}>
        {busy ? <ActivityIndicator color={color} /> : <Text style={[styles.toolButtonText, { color }]}>{action}</Text>}
      </Pressable>
    </View>
  )
}

function TabButton({ active, icon, label, onPress }: { active: boolean; icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.tabButton} onPress={onPress}>
      <Ionicons color={active ? colors.primary : '#94A3B8'} name={icon} size={22} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  keyboard: {
    flex: 1
  },
  authContent: {
    padding: 20,
    paddingTop: 32
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  badgeText: {
    color: colors.primary,
    fontWeight: '800'
  },
  heroTitle: {
    marginTop: 22,
    color: colors.ink,
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '900'
  },
  heroCopy: {
    marginTop: 14,
    color: colors.muted,
    fontSize: 17,
    lineHeight: 27,
    fontWeight: '600'
  },
  authCard: {
    marginTop: 28,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    ...shadow
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 18
  },
  segmentButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  segmentActive: {
    backgroundColor: '#fff'
  },
  segmentText: {
    color: colors.muted,
    fontWeight: '800'
  },
  segmentTextActive: {
    color: colors.ink
  },
  fieldGroup: {
    marginBottom: 14
  },
  fieldLabel: {
    marginBottom: 7,
    color: '#334155',
    fontWeight: '800'
  },
  field: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.primary,
    marginTop: 6
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.background
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  headerTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900'
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line
  },
  screenContent: {
    padding: 18,
    paddingBottom: 104
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow
  },
  cardKicker: {
    color: colors.primary,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontSize: 12
  },
  cardTitle: {
    marginTop: 8,
    color: colors.ink,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900'
  },
  cardCopy: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16
  },
  metricCard: {
    width: '47.8%',
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16
  },
  metricValue: {
    marginTop: 10,
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900'
  },
  metricLabel: {
    color: colors.muted,
    fontWeight: '800'
  },
  stack: {
    gap: 14
  },
  toolCard: {
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  toolTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900'
  },
  toolCopy: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600'
  },
  toolButton: {
    marginTop: 14,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5
  },
  toolButtonText: {
    fontWeight: '900'
  },
  answer: {
    borderRadius: 18,
    backgroundColor: colors.lilac,
    color: colors.primaryDark,
    padding: 14,
    fontWeight: '700',
    lineHeight: 21
  },
  listCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16
  },
  listText: {
    flex: 1
  },
  listTitle: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 16
  },
  listCopy: {
    marginTop: 3,
    color: colors.muted,
    fontWeight: '600',
    lineHeight: 21
  },
  tabbar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 10,
    ...shadow
  },
  tabButton: {
    alignItems: 'center',
    gap: 4,
    minWidth: 68
  },
  tabLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800'
  },
  tabLabelActive: {
    color: colors.primary
  }
})
