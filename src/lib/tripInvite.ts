import type { InvitePermissionLevel, TripInviteRole } from '../types/trip'
import { i18n } from '../i18n'

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
  if (level === 'viewer') return i18n.t('viewerDesc', { ns: 'invite' })
  if (level === 'admin') return i18n.t('adminDesc', { ns: 'invite' })
  return i18n.t('editorDesc', { ns: 'invite' })
}

export function memberRoleLabel(role?: string) {
  if (role === 'OWNER') return i18n.t('ownerTitle', { ns: 'invite' })
  if (role === 'ORGANIZER') return i18n.t('adminTitle', { ns: 'invite' })
  if (role === 'VIEWER') return i18n.t('viewerTitle', { ns: 'invite' })
  return i18n.t('editorTitle', { ns: 'invite' })
}

export function buildInviteShareMessage(input: {
  destination: string
  token: string
  permission: InvitePermissionLevel
}) {
  const link = buildTripInviteLink(input.token)
  return [
    i18n.t('shareInvitation', { ns: 'invite', destination: input.destination }),
    '',
    i18n.t('shareHowToJoin', { ns: 'invite' }),
    i18n.t('shareDownloadApp', { ns: 'invite', url: APK_DOWNLOAD_URL }),
    i18n.t('shareCreateAccount', { ns: 'invite' }),
    i18n.t('shareOpenInvite', { ns: 'invite', url: link }),
    '',
    i18n.t('sharePermission', { ns: 'invite', role: inviteRoleLabel(input.permission) })
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
