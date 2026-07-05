export type Tab = 'today' | 'utilities' | 'tools' | 'memories' | 'profile'

export type OverlayScreen = 'weather' | 'expenses' | 'bill-split' | 'group-chat' | 'trip-workspace'

export type NavigationTarget = Tab | OverlayScreen | 'tools-camera'

export type TripUser = {
  id: string
  name: string
  handle?: string | null
}

export type TripMember = {
  id: string
  user: TripUser
  role?: string
}

export type ChatMessage = {
  id: string
  body: string
  createdAt: string
  user: TripUser
}

export type TripExpense = {
  id: string
  title: string
  amount: number
  currency: string
  category?: string | null
  paidAt?: string | null
  receiptUrl?: string | null
  source?: 'manual' | 'receipt' | 'audio'
  note?: string | null
}

export type ExpenseBalance = {
  userId: string
  name?: string
  amount: number
}

export type TripDayItem = {
  id: string
  title: string
  type: string
  placeName?: string | null
  address?: string | null
  photoUrl?: string | null
  description?: string | null
  startsAt?: string | null
  timeLabel?: string | null
}

export type ActivitySuggestion = {
  title: string
  description: string
  suggestedTime?: string | null
  type?: string
  photoUrl?: string | null
}

export type TripDayPlan = {
  id: string
  title: string
  date?: string | null
  items: TripDayItem[]
}

export type TripWishlistItem = {
  id: string
  title: string
  source: string
  notes?: string | null
  url?: string | null
}

export type TripChecklistItem = {
  id: string
  title: string
  category?: string | null
  isCompleted: boolean
}

export type TripJournalEntry = {
  id: string
  title?: string | null
  body: string
  createdAt: string
  user?: TripUser
}

export type TripToolsPanel = 'wishlist' | 'checklist' | 'board'

export type TripHomeShortcut = TripToolsPanel | 'group' | 'budget'

export type Trip = {
  id: string
  title?: string
  name?: string
  destination: string
  country?: string
  region?: string
  latitude?: number
  longitude?: number
  description?: string
  start_date?: string
  end_date?: string
  base_currency?: string
  cover_image_url?: string
  wishlist_items?: TripWishlistItem[]
  checklist_items?: TripChecklistItem[]
  journal_entries?: TripJournalEntry[]
  expenses?: TripExpense[]
  photos?: unknown[]
  members?: TripMember[]
  messages?: ChatMessage[]
  days?: TripDayPlan[]
}

export type WeatherDay = {
  date: string
  weekday: string
  maxC: number
  minC: number
  code: number
  label: string
  icon: string
}
