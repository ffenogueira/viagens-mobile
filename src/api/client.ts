import * as SecureStore from 'expo-secure-store'
import { getActiveLocale, i18n, translateApiError } from '../i18n'
import type { AppLocale } from '../i18n/types'
import type {
  ActivitySuggestion,
  ChatMessage,
  ExpenseBalance,
  Trip,
  TripChecklistItem,
  TripDayPlan,
  TripExpense,
  TripInvitePreview,
  TripInviteRole,
  TripJournalEntry,
  TripMember,
  TripWishlistItem,
  WeatherDay
} from '../types/trip'
import { resolveTripCurrency } from '../lib/tripCurrency'
import { invitePermissionToApiRole } from '../lib/tripInvite'
import type { InvitePermissionLevel } from '../types/trip'

const API_URL = 'https://api-viagens.upyouridea.com.br/v1'
const TOKEN_KEY = 'viagens_auth_token'

type RequestOptions = RequestInit & {
  auth?: boolean
}

export type AuthUser = {
  id: string
  name: string
  email: string
  handle?: string | null
  role?: string
  locale?: string | null
}

export type AuthSession = {
  token: string
  user: AuthUser
}

function parseItemNotes(notes?: unknown): { photoUrl?: string; description?: string; time?: string } {
  if (!notes || typeof notes !== 'string') return {}
  if (notes.startsWith('{')) {
    try {
      const parsed = JSON.parse(notes) as { photoUrl?: string; description?: string; time?: string }
      return {
        ...(parsed.photoUrl ? { photoUrl: parsed.photoUrl } : {}),
        ...(parsed.description ? { description: parsed.description } : {}),
        ...(parsed.time ? { time: parsed.time } : {})
      }
    } catch {
      return {}
    }
  }
  if (notes.startsWith('file:') || notes.startsWith('http')) {
    return { photoUrl: notes }
  }
  if (notes.length > 0 && !notes.startsWith('{')) {
    return { description: notes }
  }
  return {}
}

function parseTripMetadata(raw: unknown): {
  coverImageUrl?: string
  latitude?: number
  longitude?: number
  region?: string
  description?: string
} {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const metadata = raw as Record<string, unknown>
  return {
    ...(metadata.coverImageUrl ? { coverImageUrl: String(metadata.coverImageUrl) } : {}),
    ...(typeof metadata.latitude === 'number' ? { latitude: metadata.latitude } : {}),
    ...(typeof metadata.longitude === 'number' ? { longitude: metadata.longitude } : {}),
    ...(metadata.region ? { region: String(metadata.region) } : {}),
    ...(metadata.description ? { description: String(metadata.description) } : {})
  }
}

function normalizeWishlistItem(raw: Record<string, unknown>): TripWishlistItem {
  return {
    id: String(raw.id),
    title: String(raw.title ?? i18n.t('placeFallback', { ns: 'trip' })),
    source: String(raw.source ?? 'wishlist'),
    notes: raw.notes ? String(raw.notes) : null,
    url: raw.url ? String(raw.url) : null
  }
}

function normalizeChecklistItem(raw: Record<string, unknown>): TripChecklistItem {
  return {
    id: String(raw.id),
    title: String(raw.title ?? i18n.t('taskFallback', { ns: 'trip' })),
    category: raw.category ? String(raw.category) : null,
    isCompleted: Boolean(raw.isCompleted ?? raw.is_completed ?? raw.is_done)
  }
}

function normalizeJournalEntry(raw: Record<string, unknown>): TripJournalEntry {
  const userRaw = (raw.user && typeof raw.user === 'object' ? raw.user : {}) as Record<string, unknown>
  return {
    id: String(raw.id),
    title: raw.title ? String(raw.title) : null,
    body: String(raw.body ?? ''),
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    user: userRaw.id
      ? {
          id: String(userRaw.id),
          name: String(userRaw.name ?? i18n.t('traveler', { ns: 'common' })),
          handle: userRaw.handle ? String(userRaw.handle) : null
        }
      : undefined
  }
}

export function normalizeTrip(raw: Record<string, unknown>): Trip {
  const checklist = raw.checklist_items ?? raw.checklistItems ?? []
  const intentions = raw.intentions ?? raw.wishlist_items ?? []
  const journalRaw = raw.journal_entries ?? raw.journalEntries ?? []
  const expensesRaw = raw.expenses ?? []
  const photos = raw.photos ?? []
  const membersRaw = raw.members ?? []
  const messagesRaw = raw.messages ?? raw.chat_messages ?? []
  const daysRaw = raw.days ?? []

  const startsAt = raw.starts_at ?? raw.startsAt
  const endsAt = raw.ends_at ?? raw.endsAt
  const tripMetadata = parseTripMetadata(raw.metadata)

  return {
    id: String(raw.id),
    title: raw.title ? String(raw.title) : undefined,
    destination: String(raw.destination ?? raw.destinationName ?? i18n.t('destinationFallback', { ns: 'trip' })),
    country: raw.country ? String(raw.country) : undefined,
    region: tripMetadata.region,
    latitude: tripMetadata.latitude,
    longitude: tripMetadata.longitude,
    description: tripMetadata.description,
    start_date: startsAt ? String(startsAt).slice(0, 10) : undefined,
    end_date: endsAt ? String(endsAt).slice(0, 10) : undefined,
    base_currency: String(raw.base_currency ?? raw.budgetCurrency ?? 'BRL'),
    cover_image_url: tripMetadata.coverImageUrl,
    wishlist_items: Array.isArray(intentions)
      ? intentions
          .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
          .map(normalizeWishlistItem)
      : [],
    checklist_items: Array.isArray(checklist)
      ? checklist
          .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
          .map(normalizeChecklistItem)
      : [],
    journal_entries: Array.isArray(journalRaw)
      ? journalRaw
          .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
          .map(normalizeJournalEntry)
      : [],
    expenses: Array.isArray(expensesRaw)
      ? expensesRaw
          .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
          .map(normalizeExpense)
      : [],
    photos: Array.isArray(photos) ? photos : [],
    members: Array.isArray(membersRaw)
      ? membersRaw
          .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
          .map(normalizeMember)
      : [],
    messages: Array.isArray(messagesRaw)
      ? messagesRaw
          .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
          .map(normalizeChatMessage)
      : [],
    days: Array.isArray(daysRaw)
      ? daysRaw
          .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
          .map(normalizeTripDay)
      : []
  }
}

function normalizeTripDay(raw: Record<string, unknown>): TripDayPlan {
  const itemsRaw = raw.items ?? []
  return {
    id: String(raw.id),
    title: String(raw.title ?? i18n.t('dayFallback', { ns: 'trip' })),
    date: raw.date ? String(raw.date).slice(0, 10) : null,
    items: Array.isArray(itemsRaw)
      ? itemsRaw
          .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
          .map((item) => {
            const meta = parseItemNotes(item.notes)
            const startsAt = item.startsAt ?? item.starts_at
            const timeLabel = meta.time ?? (startsAt ? String(startsAt).slice(11, 16) : null)
            return {
              id: String(item.id),
              title: String(item.title ?? i18n.t('placeFallback', { ns: 'trip' })),
              type: String(item.type ?? 'place'),
              placeName: item.placeName ? String(item.placeName) : null,
              address: item.address ? String(item.address) : null,
              photoUrl: meta.photoUrl ?? null,
              description: meta.description ?? null,
              startsAt: startsAt ? String(startsAt) : null,
              timeLabel: timeLabel || null
            }
          })
      : []
  }
}

function normalizeMember(raw: Record<string, unknown>): TripMember {
  const userRaw = (raw.user && typeof raw.user === 'object' ? raw.user : raw) as Record<string, unknown>
  return {
    id: String(raw.id ?? userRaw.id ?? ''),
    role: raw.role ? String(raw.role) : undefined,
    user: {
      id: String(userRaw.id ?? ''),
      name: String(userRaw.name ?? i18n.t('traveler', { ns: 'common' })),
      handle: userRaw.handle ? String(userRaw.handle) : null
    }
  }
}

function normalizeChatMessage(raw: Record<string, unknown>): ChatMessage {
  const userRaw = (raw.user && typeof raw.user === 'object' ? raw.user : {}) as Record<string, unknown>
  return {
    id: String(raw.id),
    body: String(raw.body ?? ''),
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    user: {
      id: String(userRaw.id ?? ''),
      name: String(userRaw.name ?? i18n.t('traveler', { ns: 'common' })),
      handle: userRaw.handle ? String(userRaw.handle) : null
    }
  }
}

export function normalizeExpense(raw: Record<string, unknown>): TripExpense {
  const metadata =
    raw.metadata && typeof raw.metadata === 'object'
      ? (raw.metadata as Record<string, unknown>)
      : {}

  return {
    id: String(raw.id),
    title: String(raw.title ?? i18n.t('expenseFallback', { ns: 'trip' })),
    amount: Number(raw.amount ?? 0),
    currency: String(raw.currency ?? 'BRL'),
    category: raw.category ? String(raw.category) : null,
    paidAt: raw.paidAt || raw.paid_at ? String(raw.paidAt ?? raw.paid_at) : null,
    receiptUrl: raw.receiptUrl || raw.receipt_url ? String(raw.receiptUrl ?? raw.receipt_url) : null,
    source: (metadata.source as TripExpense['source']) ?? undefined,
    note: metadata.note ? String(metadata.note) : null
  }
}

function parseApiError(payload: unknown): string {
  if (!payload) return i18n.t('generic', { ns: 'errors' })

  if (typeof payload === 'string') return payload

  if (Array.isArray(payload)) {
    return payload
      .map((item) => {
        if (typeof item === 'object' && item && 'message' in item) {
          return String(item.message)
        }
        return i18n.t('invalidField', { ns: 'errors' })
      })
      .join('\n')
  }

  if (typeof payload === 'object') {
    const data = payload as Record<string, unknown>

    if (typeof data.error === 'string') {
      if (data.error === 'USER_ALREADY_EXISTS') {
        return translateApiError('USER_ALREADY_EXISTS')
      }
      const translated = translateApiError(data.error)
      if (translated !== data.error || data.error.includes('_')) {
        return translated
      }
    }

    if (typeof data.message === 'string') return data.message
  }

  return i18n.t('generic', { ns: 'errors' })
}

function unwrapUser(payload: unknown): AuthUser {
  if (payload && typeof payload === 'object' && 'user' in payload) {
    return (payload as { user: AuthUser }).user
  }
  return payload as AuthUser
}

function unwrapTrips(payload: unknown): Trip[] {
  let list: unknown[] = []

  if (Array.isArray(payload)) {
    list = payload
  } else if (payload && typeof payload === 'object') {
    const data = payload as Record<string, unknown>
    if (Array.isArray(data.trips)) list = data.trips
    else if (Array.isArray(data.data)) list = data.data
  }

  return list
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map(normalizeTrip)
}

function unwrapTrip(payload: unknown): Trip {
  if (payload && typeof payload === 'object') {
    const data = payload as Record<string, unknown>
    if (data.trip && typeof data.trip === 'object') {
      return normalizeTrip(data.trip as Record<string, unknown>)
    }
    if (data.data && typeof data.data === 'object') {
      return normalizeTrip(data.data as Record<string, unknown>)
    }
    return normalizeTrip(data)
  }

  throw new Error(i18n.t('invalidTripResponse', { ns: 'errors' }))
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  if (options.body !== undefined && options.body !== null && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.auth !== false) {
    const token = await getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  headers.set('Accept-Language', getActiveLocale())

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  })

  const contentType = response.headers.get('content-type') || ''
  const hasBody = response.status !== 204 && response.status !== 205
  const payload = hasBody
    ? contentType.includes('application/json')
      ? await response.json()
      : await response.text()
    : null

  if (!response.ok) {
    throw new Error(parseApiError(payload))
  }

  return payload as T
}

export async function fetchProfile(): Promise<AuthUser> {
  const payload = await apiRequest<unknown>('/auth/me')
  const user = unwrapUser(payload)
  if (!user?.id || !user?.email) {
    throw new Error(i18n.t('invalidProfileResponse', { ns: 'errors' }))
  }
  return user
}

export async function updateUserLocale(locale: AppLocale): Promise<AuthUser> {
  const payload = await apiRequest<{ user?: AuthUser }>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify({ locale })
  })
  if (payload.user) return payload.user
  return fetchProfile()
}

export async function fetchTrips(): Promise<Trip[]> {
  const payload = await apiRequest<unknown>('/trips')
  return unwrapTrips(payload)
}

export type ToiletPlace = {
  id: string
  name: string
  address?: string | null
  lat: number
  lng: number
  distance_m: number
  fee_label: string
  is_free?: boolean | null
}

export type LuggageCity = {
  name: string
  country: string
  distance_m?: number | null
  links: { radical_storage: string; bounce: string }
}

export type LuggageStorageData = {
  cities: LuggageCity[]
  nearest_city: LuggageCity | null
  disclaimer?: string
  radical_coupon?: string
}

export async function fetchNearbyToilets(lat: number, lng: number, radius = 2500): Promise<ToiletPlace[]> {
  const payload = await apiRequest<{ data?: { toilets?: ToiletPlace[] } }>(
    `/utilities/toilets?lat=${lat}&lng=${lng}&radius=${radius}&free_only=0`
  )
  return payload.data?.toilets || []
}

export async function fetchLuggageStorage(lat?: number, lng?: number): Promise<LuggageStorageData> {
  const params = new URLSearchParams()
  if (lat != null && lng != null) {
    params.set('lat', String(lat))
    params.set('lng', String(lng))
  }
  const payload = await apiRequest<{
    data?: {
      cities?: LuggageCity[]
      nearest_city?: LuggageCity | null
      disclaimer?: string
      providers?: Array<{ key: string; couponCode?: string }>
    }
  }>(`/utilities/luggage-storage?${params.toString()}`)
  const radical = payload.data?.providers?.find((p) => p.key === 'radical_storage')
  return {
    cities: payload.data?.cities || [],
    nearest_city: payload.data?.nearest_city || null,
    disclaimer: payload.data?.disclaimer,
    radical_coupon: radical?.couponCode ?? 'UPYOURIDEA'
  }
}

export async function createTripInvite(tripId: string, permission: InvitePermissionLevel = 'editor'): Promise<string> {
  const role = invitePermissionToApiRole(permission)
  const payload = await apiRequest<{ invite?: { token?: string }; token?: string; data?: { invite?: { token?: string } } }>(
    `/trips/${tripId}/invites`,
    {
      method: 'POST',
      body: JSON.stringify({ role })
    }
  )
  return (
    payload.invite?.token ||
    payload.token ||
    payload.data?.invite?.token ||
    ''
  )
}

export async function fetchInvitePreview(token: string): Promise<TripInvitePreview> {
  const payload = await apiRequest<{ preview?: Record<string, unknown> }>(`/trip-invites/${token}/preview`)
  const raw = payload.preview ?? {}
  return {
    destination: String(raw.destination ?? i18n.t('tripFallback', { ns: 'trip' })),
    country: raw.country ? String(raw.country) : null,
    role: (raw.role as TripInviteRole) ?? 'MEMBER',
    hostName: raw.hostName ? String(raw.hostName) : null,
    expiresAt: raw.expiresAt ? String(raw.expiresAt) : null
  }
}

export async function acceptTripInvite(token: string): Promise<{ tripId: string; role: TripInviteRole }> {
  const payload = await apiRequest<{ tripId?: string; role?: TripInviteRole }>(`/trip-invites/${token}/accept`, {
    method: 'POST'
  })
  if (!payload.tripId) {
    throw new Error(i18n.t('INVITE_NOT_FOUND', { ns: 'errors' }))
  }
  return { tripId: payload.tripId, role: payload.role ?? 'MEMBER' }
}

export async function updateTripMemberRole(tripId: string, memberId: string, role: TripInviteRole) {
  await apiRequest(`/trips/${tripId}/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  })
}

export async function addChecklistItem(tripId: string, title: string) {
  await apiRequest(`/trips/${tripId}/checklist`, {
    method: 'POST',
    body: JSON.stringify({ title })
  })
}

export async function addWishlistItem(tripId: string, title: string, notes?: string) {
  await apiRequest(`/trips/${tripId}/intentions`, {
    method: 'POST',
    body: JSON.stringify({
      source: 'wishlist',
      title,
      ...(notes ? { notes } : {})
    })
  })
}

export async function updateChecklistItem(tripId: string, itemId: string, isCompleted: boolean) {
  await apiRequest(`/trips/${tripId}/checklist/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ isCompleted })
  })
}

export async function addJournalEntry(tripId: string, body: string, title?: string) {
  await apiRequest(`/trips/${tripId}/journal`, {
    method: 'POST',
    body: JSON.stringify({
      body,
      ...(title ? { title } : {})
    })
  })
}

export type PlaceSuggestion = {
  id: number
  name: string
  country: string
  countryCode: string
  region: string
  latitude: number
  longitude: number
  label: string
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const payload = await apiRequest<{ places?: PlaceSuggestion[] }>(
    `/places/autocomplete?q=${encodeURIComponent(query)}&limit=8`
  )
  return payload.places ?? []
}

export async function createTrip(input?: {
  title?: string
  destinationName?: string
  country?: string
  countryCode?: string
  description?: string
  startsAt?: string
  endsAt?: string
  latitude?: number
  longitude?: number
  region?: string
}): Promise<Trip> {
  const destinationName = input?.destinationName ?? 'Lisboa'
  if (!input?.startsAt || !input?.endsAt) {
    throw new Error(i18n.t('tripDatesRequired', { ns: 'errors' }))
  }

  const budgetCurrency = resolveTripCurrency(input?.country, input?.countryCode)

  const payload = await apiRequest<unknown>('/trips', {
    method: 'POST',
    body: JSON.stringify({
      title: input?.title ?? i18n.t('tripTitleFor', { ns: 'trip', destination: destinationName }),
      destinationName,
      country: input?.country ?? 'Portugal',
      description: input?.description,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      budgetCurrency,
      latitude: input?.latitude,
      longitude: input?.longitude,
      region: input?.region
    })
  })

  return unwrapTrip(payload)
}

export async function updateTrip(
  tripId: string,
  input: {
    destinationName?: string
    country?: string
    countryCode?: string
    startsAt?: string
    endsAt?: string
    coverImageUrl?: string
    latitude?: number
    longitude?: number
    region?: string
    budgetCurrency?: string
  }
): Promise<Trip> {
  const payload = await apiRequest<{ trip?: Record<string, unknown> }>(`/trips/${tripId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...input,
      ...(input.country
        ? { budgetCurrency: input.budgetCurrency ?? resolveTripCurrency(input.country, input.countryCode) }
        : {})
    })
  })
  if (payload.trip && typeof payload.trip === 'object') {
    return normalizeTrip(payload.trip)
  }
  return fetchTrip(tripId)
}

export async function deleteTrip(tripId: string): Promise<void> {
  await apiRequest(`/trips/${tripId}`, { method: 'DELETE' })
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const payload = await apiRequest<{ user?: AuthUser; token?: string; data?: { user: AuthUser; token: string } }>(
    '/auth/login',
    {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email: email.trim().toLowerCase(), password })
    }
  )

  const token = payload.token ?? payload.data?.token
  const user = payload.user ?? payload.data?.user

  if (!token || !user) {
    throw new Error(i18n.t('invalidLoginResponse', { ns: 'errors' }))
  }

  await saveToken(token)
  return { token, user }
}

export async function loginWithSocial(
  provider: 'google' | 'apple',
  idToken: string
): Promise<AuthSession> {
  const payload = await apiRequest<{ user?: AuthUser; token?: string; data?: { user: AuthUser; token: string } }>(
    `/auth/${provider}`,
    {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ idToken })
    }
  )

  const token = payload.token ?? payload.data?.token
  const user = payload.user ?? payload.data?.user

  if (!token || !user) {
    throw new Error(i18n.t('invalidSocialLoginResponse', { ns: 'errors' }))
  }

  await saveToken(token)
  return { token, user }
}

export async function register(name: string, email: string, password: string): Promise<AuthSession> {
  const payload = await apiRequest<{ user?: AuthUser; token?: string; data?: { user: AuthUser; token: string } }>(
    '/auth/register',
    {
      method: 'POST',
      auth: false,
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password
      })
    }
  )

  const token = payload.token ?? payload.data?.token
  const user = payload.user ?? payload.data?.user

  if (!token || !user) {
    throw new Error(i18n.t('registrationSessionFailed', { ns: 'errors' }))
  }

  await saveToken(token)
  return { token, user }
}

export async function fetchTrip(tripId: string): Promise<Trip> {
  const payload = await apiRequest<unknown>(`/trips/${tripId}`)
  return unwrapTrip(payload)
}

export async function addTripItineraryItem(
  tripId: string,
  input: {
    date: string
    title: string
    placeName?: string
    address?: string
    dayTitle?: string
    photoUrl?: string
    time?: string
    description?: string
  }
): Promise<Trip> {
  await apiRequest(`/trips/${tripId}/itinerary/items`, {
    method: 'POST',
    body: JSON.stringify({
      date: input.date,
      title: input.title,
      placeName: input.placeName ?? input.title,
      address: input.address,
      type: 'place',
      dayTitle: input.dayTitle,
      photoUrl: input.photoUrl,
      time: input.time,
      description: input.description
    })
  })
  return fetchTrip(tripId)
}

type AiJobRecord = {
  id: string
  status: string
  output?: unknown
  error?: string | null
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function unwrapActivitySuggestions(output: unknown): ActivitySuggestion[] {
  if (!output || typeof output !== 'object') return []
  const root = output as Record<string, unknown>
  const result = root.result && typeof root.result === 'object' ? (root.result as Record<string, unknown>) : root
  const suggestions = result.suggestions
  if (!Array.isArray(suggestions)) return []

  return suggestions
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      title: String(item.title ?? i18n.t('activityFallback', { ns: 'trip' })),
      description: String(item.description ?? ''),
      suggestedTime: item.suggestedTime ? String(item.suggestedTime) : null,
      type: item.type ? String(item.type) : 'place',
      photoUrl: item.photoUrl ? String(item.photoUrl) : null
    }))
    .slice(0, 3)
}

export async function pollAiJob<T>(jobId: string, parse: (output: unknown) => T, attempts = 18): Promise<T> {
  for (let index = 0; index < attempts; index += 1) {
    await sleep(index === 0 ? 800 : 1200)
    const payload = await apiRequest<{ job?: AiJobRecord }>(`/ai/jobs/${jobId}`)
    const job = payload.job
    if (!job) throw new Error(i18n.t('AI_JOB_NOT_FOUND', { ns: 'errors' }))
    if (job.status === 'COMPLETED') return parse(job.output)
    if (job.status === 'FAILED') {
      throw new Error(job.error || i18n.t('fefaiFailed', { ns: 'errors' }))
    }
  }
  throw new Error(i18n.t('fefaiTimeout', { ns: 'errors' }))
}

export async function requestActivitySuggestions(
  tripId: string,
  input: { date: string; style: string; period: 'day' | 'night' }
): Promise<{ suggestions: ActivitySuggestion[]; source?: 'ai' | 'fallback' }> {
  const payload = await apiRequest<{ suggestions?: ActivitySuggestion[]; source?: 'ai' | 'fallback'; job?: AiJobRecord }>(
    `/trips/${tripId}/ai/activity-suggestions`,
    {
      method: 'POST',
      body: JSON.stringify(input)
    }
  )

  if (Array.isArray(payload.suggestions) && payload.suggestions.length) {
    return { suggestions: payload.suggestions.slice(0, 3), source: payload.source }
  }

  const jobId = payload.job?.id
  if (!jobId) throw new Error(i18n.t('suggestionStartFailed', { ns: 'errors' }))
  const suggestions = await pollAiJob(jobId, unwrapActivitySuggestions)
  return { suggestions, source: 'ai' }
}

export async function updateTripCover(tripId: string, coverImageUrl: string): Promise<Trip> {
  const payload = await apiRequest<{ trip?: Record<string, unknown> }>(`/trips/${tripId}`, {
    method: 'PATCH',
    body: JSON.stringify({ coverImageUrl })
  })
  if (payload.trip && typeof payload.trip === 'object') {
    return normalizeTrip(payload.trip)
  }
  return fetchTrip(tripId)
}

export async function updateTripItineraryItemPhoto(
  tripId: string,
  itemId: string,
  photoUrl: string
): Promise<Trip> {
  await apiRequest(`/trips/${tripId}/itinerary/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ photoUrl })
  })
  return fetchTrip(tripId)
}

export async function sendChatMessage(tripId: string, body: string): Promise<ChatMessage> {
  const payload = await apiRequest<{ message?: Record<string, unknown> }>(`/trips/${tripId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ body })
  })
  if (payload.message && typeof payload.message === 'object') {
    return normalizeChatMessage(payload.message)
  }
  throw new Error(i18n.t('messageSendFailed', { ns: 'errors' }))
}

export async function createExpense(
  tripId: string,
  input: {
    title: string
    amount: number
    currency?: string
    category?: string
    source?: TripExpense['source']
    note?: string
    receiptUri?: string
  }
): Promise<TripExpense> {
  const payload = await apiRequest<{ expense?: Record<string, unknown> }>(`/trips/${tripId}/expenses`, {
    method: 'POST',
    body: JSON.stringify({
      title: input.title,
      amount: input.amount,
      currency: input.currency ?? 'BRL',
      category: input.category ?? input.source ?? 'manual',
      paidAt: new Date().toISOString()
    })
  })

  const expense = payload.expense
  if (!expense || typeof expense !== 'object') {
    throw new Error(i18n.t('expenseCreateFailed', { ns: 'errors' }))
  }

  const normalized = normalizeExpense(expense)
  return {
    ...normalized,
    source: input.source,
    note: input.note ?? (input.receiptUri ? i18n.t('receiptAttached', { ns: 'trip' }) : null),
    receiptUrl: input.receiptUri ?? normalized.receiptUrl
  }
}

export async function fetchExpenseBalances(tripId: string): Promise<ExpenseBalance[]> {
  const payload = await apiRequest<{ balances?: Array<{ userId: string; amount: number | string }> }>(
    `/trips/${tripId}/expenses/balances`
  )
  return (payload.balances ?? []).map((item) => ({
    userId: item.userId,
    amount: Number(item.amount)
  }))
}

const weatherLabels: Record<number, { labelKey: string; icon: string }> = {
  0: { labelKey: 'weatherClear', icon: 'sunny' },
  1: { labelKey: 'weatherMostlyClear', icon: 'partly-sunny' },
  2: { labelKey: 'weatherPartlyCloudy', icon: 'partly-sunny-outline' },
  3: { labelKey: 'weatherCloudy', icon: 'cloud' },
  45: { labelKey: 'weatherFog', icon: 'cloudy' },
  48: { labelKey: 'weatherFog', icon: 'cloudy' },
  51: { labelKey: 'weatherDrizzle', icon: 'rainy' },
  53: { labelKey: 'weatherDrizzle', icon: 'rainy' },
  55: { labelKey: 'weatherHeavyDrizzle', icon: 'rainy' },
  61: { labelKey: 'weatherRain', icon: 'rainy' },
  63: { labelKey: 'weatherRain', icon: 'rainy' },
  65: { labelKey: 'weatherHeavyRain', icon: 'rainy' },
  80: { labelKey: 'weatherShowers', icon: 'thunderstorm' },
  95: { labelKey: 'weatherStorm', icon: 'thunderstorm' }
}

function weatherMeta(code: number) {
  const meta = weatherLabels[code] ?? { labelKey: 'weatherVariable', icon: 'cloud-outline' }
  return { label: i18n.t(meta.labelKey, { ns: 'trip' }), icon: meta.icon }
}

export async function fetchWeatherForecast(destination: string, country?: string): Promise<{
  place: string
  days: WeatherDay[]
}> {
  const query = encodeURIComponent([destination, country].filter(Boolean).join(', '))
  const geoResponse = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1&language=${getActiveLocale().split('-')[0]}`
  )
  const geoData = await geoResponse.json()
  const place = geoData.results?.[0]
  if (!place) {
    throw new Error(i18n.t('weatherDestinationNotFound', { ns: 'trip' }))
  }

  const forecastResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
  )
  const forecast = await forecastResponse.json()
  const days: WeatherDay[] = (forecast.daily?.time ?? []).slice(0, 7).map((date: string, index: number) => {
    const code = Number(forecast.daily.weathercode?.[index] ?? 0)
    const meta = weatherMeta(code)
    const weekday = new Date(`${date}T12:00:00`).toLocaleDateString(getActiveLocale(), { weekday: 'short' })
    return {
      date,
      weekday: weekday.replace('.', ''),
      maxC: Math.round(Number(forecast.daily.temperature_2m_max?.[index] ?? 0)),
      minC: Math.round(Number(forecast.daily.temperature_2m_min?.[index] ?? 0)),
      code,
      label: meta.label,
      icon: meta.icon
    }
  })

  return {
    place: [place.name, place.country].filter(Boolean).join(', '),
    days
  }
}

export async function restoreSession(): Promise<AuthSession | null> {
  const token = await getToken()
  if (!token) return null

  try {
    const user = await fetchProfile()
    return { token, user }
  } catch {
    await clearToken()
    return null
  }
}
