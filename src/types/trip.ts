export type Tab = 'today' | 'tools' | 'memories' | 'profile'

export type Trip = {
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
