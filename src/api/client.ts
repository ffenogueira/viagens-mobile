import * as SecureStore from 'expo-secure-store'
import type { Trip } from '../types/trip'

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
}

export type AuthSession = {
  token: string
  user: AuthUser
}

export function normalizeTrip(raw: Record<string, unknown>): Trip {
  const checklist = raw.checklist_items ?? raw.checklistItems ?? []
  const expenses = raw.expenses ?? []
  const photos = raw.photos ?? []

  const startsAt = raw.starts_at ?? raw.startsAt
  const endsAt = raw.ends_at ?? raw.endsAt

  return {
    id: String(raw.id),
    title: raw.title ? String(raw.title) : undefined,
    destination: String(raw.destination ?? raw.destinationName ?? 'Destino'),
    country: raw.country ? String(raw.country) : undefined,
    start_date: startsAt ? String(startsAt).slice(0, 10) : undefined,
    end_date: endsAt ? String(endsAt).slice(0, 10) : undefined,
    base_currency: String(raw.base_currency ?? raw.budgetCurrency ?? 'BRL'),
    checklist_items: Array.isArray(checklist) ? checklist : [],
    expenses: Array.isArray(expenses) ? expenses : [],
    photos: Array.isArray(photos) ? photos : []
  }
}

function parseApiError(payload: unknown): string {
  if (!payload) return 'Não foi possível concluir a ação agora.'

  if (typeof payload === 'string') return payload

  if (Array.isArray(payload)) {
    return payload
      .map((item) => {
        if (typeof item === 'object' && item && 'message' in item) {
          return String(item.message)
        }
        return 'Campo inválido'
      })
      .join('\n')
  }

  if (typeof payload === 'object') {
    const data = payload as Record<string, unknown>

    if (typeof data.error === 'string') {
      if (data.error === 'USER_ALREADY_EXISTS') {
        return 'Este e-mail já está cadastrado. Tente entrar com sua senha.'
      }
      if (data.error === 'INVALID_CREDENTIALS') {
        return 'E-mail ou senha incorretos.'
      }
      if (data.error === 'UNAUTHENTICATED') {
        return 'Sessão expirada. Entre novamente.'
      }
      return data.error
    }

    if (typeof data.message === 'string') return data.message
  }

  return 'Não foi possível concluir a ação agora.'
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

  throw new Error('Resposta de viagem inválida.')
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

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.auth !== false) {
    const token = await getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    throw new Error(parseApiError(payload))
  }

  return payload as T
}

export async function fetchProfile(): Promise<AuthUser> {
  const payload = await apiRequest<unknown>('/auth/me')
  const user = unwrapUser(payload)
  if (!user?.id || !user?.email) {
    throw new Error('Perfil inválido.')
  }
  return user
}

export async function fetchTrips(): Promise<Trip[]> {
  const payload = await apiRequest<unknown>('/trips')
  return unwrapTrips(payload)
}

export async function createTrip(input?: {
  title?: string
  destinationName?: string
  country?: string
}): Promise<Trip> {
  const destinationName = input?.destinationName ?? 'Lisboa'
  const payload = await apiRequest<unknown>('/trips', {
    method: 'POST',
    body: JSON.stringify({
      title: input?.title ?? `Viagem para ${destinationName}`,
      destinationName,
      country: input?.country ?? 'Portugal',
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 5 * 86400000).toISOString(),
      budgetCurrency: 'EUR'
    })
  })

  return unwrapTrip(payload)
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
    throw new Error('Resposta de login inválida.')
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
    throw new Error('Conta criada, mas a sessão não foi iniciada. Tente entrar.')
  }

  await saveToken(token)
  return { token, user }
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
