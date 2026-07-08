import type { Ionicons } from '@expo/vector-icons'
import { getActiveLocale } from '../i18n'

export type DayPeriod = 'day' | 'night'

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value.trim())
}

export function normalizeTime(value: string): string | null {
  const trimmed = value.trim()
  if (!TIME_PATTERN.test(trimmed)) return null
  const [hours, minutes] = trimmed.split(':')
  return `${hours.padStart(2, '0')}:${minutes}`
}

export function periodFromTime(time: string | null | undefined): DayPeriod | null {
  if (!time || !isValidTime(time)) return null
  const hour = Number(time.split(':')[0])
  return hour >= 6 && hour < 18 ? 'day' : 'night'
}

export function periodIcon(
  period: DayPeriod | null,
  time?: string | null
): keyof typeof Ionicons.glyphMap {
  const resolved = period ?? periodFromTime(time ?? null)
  if (resolved === 'night') return 'moon-outline'
  if (resolved === 'day') return 'sunny-outline'
  return 'time-outline'
}

export function formatPlaceTime(startsAt?: string | null, timeFallback?: string | null): string | null {
  if (timeFallback && isValidTime(timeFallback)) return normalizeTime(timeFallback)
  if (!startsAt) return null
  const parsed = new Date(startsAt)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleTimeString(getActiveLocale(), { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function combineDateAndTime(date: string, time: string): string {
  const normalized = normalizeTime(time)
  if (!normalized) return `${date}T12:00:00`
  return `${date}T${normalized}:00`
}
