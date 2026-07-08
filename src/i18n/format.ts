import { getActiveLocale } from './index'

export function formatAppDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
) {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleDateString(getActiveLocale(), options)
}

export function formatAppDateTime(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleString(getActiveLocale(), {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatAppNumber(value: number, options?: Intl.NumberFormatOptions) {
  return value.toLocaleString(getActiveLocale(), options)
}
