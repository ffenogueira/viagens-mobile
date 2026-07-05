export function formatIsoToBr(iso?: string | null) {
  if (!iso) return ''
  const normalized = iso.trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return ''
  const [year, month, day] = normalized.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return ''
  const dd = String(day).padStart(2, '0')
  const mm = String(month).padStart(2, '0')
  return `${dd}/${mm}/${year}`
}

export function isoFromDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toIsoDateStart(date?: string | null) {
  if (!date) return undefined
  const normalized = date.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return undefined
  return `${normalized}T12:00:00.000Z`
}

export function formatDateInput(iso?: string) {
  if (!iso) return ''
  return iso.slice(0, 10)
}
