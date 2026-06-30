import * as SecureStore from 'expo-secure-store'

const API_URL = 'https://api-viagens.upyouridea.com.br/v1'
const TOKEN_KEY = 'viagens_auth_token'

type RequestOptions = RequestInit & {
  auth?: boolean
}

export type AuthUser = {
  id: string
  name: string
  email: string
}

export type AuthSession = {
  token: string
  user: AuthUser
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
    const message = typeof payload === 'object' && payload && 'message' in payload
      ? String(payload.message)
      : 'Nao foi possivel concluir a acao agora.'
    throw new Error(message)
  }

  return payload as T
}

export async function login(email: string, password: string) {
  const session = await apiRequest<AuthSession>('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password })
  })
  await saveToken(session.token)
  return session
}

export async function register(name: string, email: string, password: string) {
  const session = await apiRequest<AuthSession>('/auth/register', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({
      name,
      email,
      password,
      password_confirmation: password
    })
  })
  await saveToken(session.token)
  return session
}
