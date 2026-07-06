import type { InvitePermissionLevel, TripInviteRole } from '../types/trip'

export const APK_DOWNLOAD_URL =
  'https://api-viagens.upyouridea.com.br/viagens-app/viagens-by-up-your-idea-public-preview.apk'

export const INVITE_WEB_BASE = 'https://viagens.upyouridea.com.br/app'

export function buildTripInviteLink(token: string) {
  return `${INVITE_WEB_BASE}?invite=${token}`
}

export function invitePermissionToApiRole(level: InvitePermissionLevel): TripInviteRole {
  if (level === 'viewer') return 'VIEWER'
  if (level === 'admin') return 'ORGANIZER'
  return 'MEMBER'
}

export function inviteRoleLabel(level: InvitePermissionLevel) {
  if (level === 'viewer') return 'Leitor — só visualiza a viagem'
  if (level === 'admin') return 'Admin — edita e convida outras pessoas'
  return 'Editor — edita roteiro, checklist e gastos'
}

export function memberRoleLabel(role?: string) {
  if (role === 'OWNER') return 'Dono da viagem'
  if (role === 'ORGANIZER') return 'Admin'
  if (role === 'VIEWER') return 'Leitor'
  return 'Editor'
}

export function buildInviteShareMessage(input: {
  destination: string
  token: string
  permission: InvitePermissionLevel
}) {
  const link = buildTripInviteLink(input.token)
  return [
    `Você foi convidado(a) para planejar ${input.destination} no Viagens!`,
    '',
    'Como entrar:',
    `1. Baixe o app: ${APK_DOWNLOAD_URL}`,
    '2. Crie sua conta ou faça login',
    `3. Abra o convite: ${link}`,
    '',
    `Permissão: ${inviteRoleLabel(input.permission)}`
  ].join('\n')
}

export function parseInviteTokenFromUrl(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)
    const fromQuery = parsed.searchParams.get('invite')
    if (fromQuery) return fromQuery
  } catch {
    // fall through to regex
  }

  const match = url.match(/[?&]invite=([^&]+)/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}
