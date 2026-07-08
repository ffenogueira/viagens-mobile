import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet
} from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  ButtonSpinner,
  ButtonText,
  HStack,
  Pressable,
  Text,
  VStack
} from '../../components/ui'
import type { AuthUser } from '../api/client'
import { fetchTrip } from '../api/client'
import { UserAvatar } from '../components/UserAvatar'
import { getTripCoverFallback } from '../lib/demoAssets'
import { loadTripMedia } from '../storage/tripMedia'
import { colors, shadow, shadowStrong } from '../theme'
import type { NavigationTarget, Trip, TripHomeShortcut } from '../types/trip'

type TodayScreenProps = {
  user: AuthUser | null
  trips: Trip[]
  loading: boolean
  focusTripId?: string | null
  onFocusTripHandled?: () => void
  onOpenCreateTrip: () => void
  onNavigate: (target: NavigationTarget) => void
  onSelectTrip?: (trip: Trip) => void
  onOpenTrip?: (trip: Trip, shortcut?: TripHomeShortcut) => void
}

type ActionCard = {
  title: string
  icon: keyof typeof Ionicons.glyphMap
  target: NavigationTarget
  accent: string
}

const absoluteFill = StyleSheet.absoluteFill

const travelShortcuts: ActionCard[] = [
  {
    title: 'Banheiros',
    icon: 'water-outline',
    target: 'utilities',
    accent: colors.primary
  },
  {
    title: 'Guardar mala',
    icon: 'briefcase-outline',
    target: 'utilities',
    accent: colors.sky
  },
  {
    title: 'Conversor',
    icon: 'cash-outline',
    target: 'utilities',
    accent: colors.mint
  },
  {
    title: 'Previsão',
    icon: 'partly-sunny-outline',
    target: 'weather',
    accent: colors.orange
  },
  {
    title: 'FEFAI',
    icon: 'sparkles',
    target: 'tools',
    accent: colors.primary
  },
  {
    title: 'Street View',
    icon: 'navigate-outline',
    target: 'utilities',
    accent: colors.orange
  },
  {
    title: 'Ler preço',
    icon: 'scan',
    target: 'tools-camera',
    accent: colors.sky
  },
  {
    title: 'Gastos',
    icon: 'wallet-outline',
    target: 'expenses',
    accent: colors.mint
  },
  {
    title: 'Dividir conta',
    icon: 'people-outline',
    target: 'bill-split',
    accent: colors.primary
  },
  {
    title: 'Chat grupo',
    icon: 'chatbubbles-outline',
    target: 'group-chat',
    accent: colors.sky
  }
]

function getDaysUntil(start?: string) {
  if (!start) return null
  const startMs = new Date(start).getTime()
  if (Number.isNaN(startMs)) return null
  return Math.max(0, Math.ceil((startMs - Date.now()) / 86400000))
}

type TripSegment = 'upcoming' | 'planning' | 'past'

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function classifyTripSegment(trip: Trip): TripSegment {
  const today = startOfToday()
  const start = trip.start_date ? new Date(`${trip.start_date}T12:00:00`) : null
  const end = trip.end_date ? new Date(`${trip.end_date}T12:00:00`) : null

  if (!start) return 'planning'
  if (end && end < today) return 'past'
  if (start < today && !end) return 'past'
  return 'upcoming'
}

function sortTripsForSegment(trips: Trip[], segment: TripSegment) {
  return [...trips].sort((a, b) => {
    if (segment === 'past') {
      const aEnd = a.end_date ? new Date(`${a.end_date}T12:00:00`).getTime() : 0
      const bEnd = b.end_date ? new Date(`${b.end_date}T12:00:00`).getTime() : 0
      return bEnd - aEnd
    }

    const aStart = a.start_date ? new Date(`${a.start_date}T12:00:00`).getTime() : Number.MAX_SAFE_INTEGER
    const bStart = b.start_date ? new Date(`${b.start_date}T12:00:00`).getTime() : Number.MAX_SAFE_INTEGER
    return aStart - bStart
  })
}

function filterTripsBySegment(trips: Trip[], segment: TripSegment) {
  return sortTripsForSegment(
    trips.filter((trip) => classifyTripSegment(trip) === segment),
    segment
  )
}

export function TodayScreen({
  user,
  trips,
  loading,
  focusTripId,
  onFocusTripHandled,
  onOpenCreateTrip,
  onNavigate,
  onSelectTrip,
  onOpenTrip
}: TodayScreenProps) {
  const [segment, setSegment] = useState<TripSegment>('upcoming')
  const [coverOverride, setCoverOverride] = useState<string | null>(null)
  const [tripDetails, setTripDetails] = useState<Trip | null>(null)

  const filteredTrips = useMemo(() => filterTripsBySegment(trips, segment), [trips, segment])
  const displayTrip = filteredTrips[0] ?? null
  const cardTrip = tripDetails ?? displayTrip

  useEffect(() => {
    if (!focusTripId) return
    const trip = trips.find((item) => item.id === focusTripId)
    if (!trip) return
    setSegment(classifyTripSegment(trip))
    onFocusTripHandled?.()
  }, [focusTripId, trips, onFocusTripHandled])

  useEffect(() => {
    if (!displayTrip?.id) {
      setTripDetails(null)
      return
    }

    let cancelled = false
    void fetchTrip(displayTrip.id).then((full) => {
      if (!cancelled) setTripDetails(full)
    })

    return () => {
      cancelled = true
    }
  }, [displayTrip?.id])

  useEffect(() => {
    if (!displayTrip?.id) return
    const updated = trips.find((item) => item.id === displayTrip.id)
    if (!updated) return
    setTripDetails((current) => (current?.id === updated.id ? { ...current, ...updated } : current))
  }, [trips, displayTrip?.id])

  useEffect(() => {
    if (displayTrip) {
      onSelectTrip?.(displayTrip)
    }
  }, [displayTrip?.id, onSelectTrip])

  useEffect(() => {
    if (!displayTrip?.id) {
      setCoverOverride(null)
      return
    }
    void loadTripMedia(displayTrip.id).then((media) => {
      setCoverOverride(media.coverImageUri ?? null)
    })
  }, [displayTrip?.id, displayTrip?.cover_image_url])

  function handleSegmentChange(next: TripSegment) {
    setSegment(next)
  }

  const daysUntil = getDaysUntil(displayTrip?.start_date)

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
    >
      <PassportCard
        user={user}
        tripsCount={trips.length}
        onSearch={() => onNavigate('tools')}
        onCreateTrip={onOpenCreateTrip}
      />

      <SegmentedTrips active={segment} onChange={handleSegmentChange} />

      {!displayTrip ? (
        <EmptySegmentState segment={segment} loading={loading} onCreateTrip={onOpenCreateTrip} />
      ) : (
        <VStack>
          <TripHomeCard
            trip={cardTrip}
            coverUri={
              coverOverride ??
              displayTrip.cover_image_url ??
              getTripCoverFallback(displayTrip.destination)
            }
            daysUntil={daysUntil}
            onPress={() => onOpenTrip?.(displayTrip)}
            onShortcut={(shortcut) => {
              onSelectTrip?.(displayTrip)
              onOpenTrip?.(displayTrip, shortcut)
            }}
          />

          <TravelShortcutsGrid onNavigate={onNavigate} />
        </VStack>
      )}
    </ScrollView>
  )
}

function PassportCard({
  user,
  tripsCount,
  onSearch,
  onCreateTrip
}: {
  user: AuthUser | null
  tripsCount: number
  onSearch: () => void
  onCreateTrip: () => void
}) {
  const firstName = user?.name?.split(' ')[0] || 'viajante'

  return (
    <Box className="mb-5 overflow-hidden rounded-[34px] border border-[#EDE9FE] bg-white" style={shadowStrong}>
      <LinearGradient
        colors={['#FFFFFF', '#F8F4FF', '#ECFEFF']}
        locations={[0, 0.58, 1]}
        style={{ padding: 18 }}
      >
        <HStack className="mb-4 items-center justify-between">
          <HStack className="items-center gap-3">
            <Box className="relative">
              <UserAvatar
                name={user?.name}
                className="h-[72px] w-[72px] border-[3px] border-white bg-viagens-lilac shadow-soft-2"
                fallbackClassName="text-xl font-black text-primary"
              />
              <HStack className="absolute -bottom-1 left-1 items-center gap-1 rounded-full bg-[#ECFEFF] px-2 py-1">
                <Ionicons color={colors.mint} name="star" size={10} />
                <Text className="text-[10px] font-black text-[#047857]">Lv.1</Text>
              </HStack>
            </Box>

            <VStack>
              <Text className="text-[28px] font-black leading-[32px] text-foreground">
                {firstName}
              </Text>
              <Text className="mt-1 text-[13px] font-bold text-muted-foreground" numberOfLines={1}>
                @{user?.email?.split('@')[0] || 'viajante'}
              </Text>
            </VStack>
          </HStack>

          <HStack className="items-center gap-2">
            <Pressable
              onPress={onCreateTrip}
              className="h-11 w-11 items-center justify-center rounded-full bg-primary"
            >
              <Ionicons color={colors.white} name="airplane" size={20} />
            </Pressable>
            <Pressable
              onPress={onSearch}
              className="h-11 w-11 items-center justify-center rounded-full bg-white"
              style={shadow}
            >
              <Ionicons color={colors.ink} name="search" size={20} />
            </Pressable>
          </HStack>
        </HStack>

        <HStack className="items-center justify-between border-t border-[#EDE9FE] pt-4">
          <PassportStat label="Viagens" value={String(tripsCount)} icon="airplane-outline" />
          <Box className="h-9 w-px bg-[#EDE9FE]" />
          <PassportStat label="Recompensas" value="0" icon="ribbon-outline" />
          <Box className="h-9 w-px bg-[#EDE9FE]" />
          <PassportStat label="Carimbos" value="0" icon="flag-outline" />
        </HStack>
      </LinearGradient>
    </Box>
  )
}

function PassportStat({
  label,
  value,
  icon
}: {
  label: string
  value: string
  icon: keyof typeof Ionicons.glyphMap
}) {
  return (
    <VStack className="flex-1 items-center gap-1">
      <HStack className="items-center gap-1.5">
        <Ionicons color={colors.primary} name={icon} size={15} />
        <Text className="text-[17px] font-black text-foreground">{value}</Text>
      </HStack>
      <Text className="text-[10px] font-black uppercase tracking-[1.2px] text-muted-foreground">
        {label}
      </Text>
    </VStack>
  )
}

function SegmentedTrips({
  active,
  onChange
}: {
  active: TripSegment
  onChange: (value: TripSegment) => void
}) {
  const { t } = useTranslation('trip')
  const segments: Array<{ id: typeof active; labelKey: 'segmentUpcoming' | 'segmentPlanning' | 'segmentPast' }> = [
    { id: 'upcoming', labelKey: 'segmentUpcoming' },
    { id: 'planning', labelKey: 'segmentPlanning' },
    { id: 'past', labelKey: 'segmentPast' }
  ]

  return (
    <HStack className="mb-6 rounded-full border border-[#E5E7EB] bg-white p-1.5" style={shadow}>
      {segments.map((segment) => {
        const selected = active === segment.id
        return (
          <Pressable
            key={segment.id}
            onPress={() => onChange(segment.id)}
            className={`flex-1 items-center justify-center rounded-full py-3 ${
              selected ? 'bg-primary' : 'bg-transparent'
            }`}
          >
            <Text className={`text-[14px] font-black ${selected ? 'text-white' : 'text-muted-foreground'}`}>
              {t(segment.labelKey)}
            </Text>
          </Pressable>
        )
      })}
    </HStack>
  )
}

function EmptySegmentState({
  segment,
  loading,
  onCreateTrip
}: {
  segment: TripSegment
  loading: boolean
  onCreateTrip: () => void
}) {
  const { t } = useTranslation('trip')
  const copy: Record<TripSegment, { titleKey: string; detailKey: string; icon: keyof typeof Ionicons.glyphMap }> = {
    upcoming: {
      titleKey: 'emptyUpcoming',
      detailKey: 'emptyUpcomingDetail',
      icon: 'airplane-outline'
    },
    planning: {
      titleKey: 'emptyPlanning',
      detailKey: 'emptyPlanningDetail',
      icon: 'calendar-outline'
    },
    past: {
      titleKey: 'emptyPast',
      detailKey: 'emptyPastDetail',
      icon: 'time-outline'
    }
  }

  const content = copy[segment]

  return (
    <VStack className="items-center rounded-[34px] border border-[#EDE9FE] bg-white px-5 py-7" style={shadow}>
      <Box className="mb-4 h-[96px] w-[96px] items-center justify-center rounded-[30px] bg-viagens-lilac">
        <Ionicons color={colors.primary} name={content.icon} size={42} />
      </Box>

      <Text className="text-center text-[24px] font-black leading-[30px] text-foreground">{t(content.titleKey)}</Text>
      <Text className="mt-2 text-center text-[14px] font-semibold leading-6 text-muted-foreground">
        {t(content.detailKey)}
      </Text>

      {segment !== 'past' ? (
        <Button
          size="lg"
          className="mt-6 h-14 w-full rounded-full bg-primary data-[active=true]:bg-primary/90"
          onPress={onCreateTrip}
          disabled={loading}
        >
          {loading ? (
            <ButtonSpinner color="#FFFFFF" />
          ) : (
            <ButtonText className="text-[16px] font-black text-white">{t('createTrip')}</ButtonText>
          )}
        </Button>
      ) : null}
    </VStack>
  )
}

function EmptyTripState({
  loading,
  onCreateTrip
}: {
  loading: boolean
  onCreateTrip: () => void
}) {
  const { t } = useTranslation('trip')
  return (
    <VStack className="items-center rounded-[34px] border border-[#EDE9FE] bg-white px-5 py-7" style={shadow}>
      <Box className="mb-4 h-[112px] w-[112px] items-center justify-center rounded-[34px] bg-viagens-lilac">
        <Ionicons color={colors.primary} name="map" size={48} />
      </Box>

      <Text className="text-center text-[27px] font-black leading-[32px] text-foreground">
        {t('emptyFirstTitle')}
      </Text>
      <Text className="mt-2 text-center text-[14px] font-semibold leading-6 text-muted-foreground">
        {t('emptyFirstDetail')}
      </Text>

      <Button
        size="lg"
        className="mt-6 h-14 w-full rounded-full bg-primary data-[active=true]:bg-primary/90"
        onPress={onCreateTrip}
        disabled={loading}
      >
        {loading ? (
          <ButtonSpinner color="#FFFFFF" />
        ) : (
          <ButtonText className="text-[16px] font-black text-white">
            {t('createTrip')}
          </ButtonText>
        )}
      </Button>
    </VStack>
  )
}

function TravelShortcutsGrid({ onNavigate }: { onNavigate: (target: NavigationTarget) => void }) {
  const rows: ActionCard[][] = []
  for (let index = 0; index < travelShortcuts.length; index += 3) {
    rows.push(travelShortcuts.slice(index, index + 3))
  }

  return (
    <VStack className="mt-7">
      <Text className="mb-3 text-[20px] font-black text-foreground">Atalhos úteis na viagem</Text>
      <VStack className="gap-3">
        {rows.map((row, rowIndex) => (
          <HStack key={`row-${rowIndex}`} className="gap-3">
            {row.map((action) => (
              <Pressable
                key={action.title}
                onPress={() => onNavigate(action.target)}
                className="flex-1 items-center justify-center rounded-[22px] border border-[#EEF2FF] bg-white py-4"
                style={[shadow, { aspectRatio: 1 }]}
              >
                <Box
                  className="h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${action.accent}18` }}
                >
                  <Ionicons color={action.accent} name={action.icon} size={22} />
                </Box>
                <Text
                  className="mt-2 px-1 text-center text-[11px] font-black leading-4 text-foreground"
                  numberOfLines={2}
                >
                  {action.title}
                </Text>
              </Pressable>
            ))}
            {row.length < 3
              ? Array.from({ length: 3 - row.length }).map((_, fillerIndex) => (
                  <Box key={`filler-${rowIndex}-${fillerIndex}`} className="flex-1" />
                ))
              : null}
          </HStack>
        ))}
      </VStack>
    </VStack>
  )
}

function TripHomeCard({
  trip,
  coverUri,
  daysUntil,
  onPress,
  onShortcut
}: {
  trip: Trip
  coverUri: string
  daysUntil: number | null
  onPress: () => void
  onShortcut?: (shortcut: TripHomeShortcut) => void
}) {
  const fallbackCover = getTripCoverFallback(trip.destination)
  const [resolvedCover, setResolvedCover] = useState(coverUri || fallbackCover)
  const wishlistCount = trip.wishlist_items?.length ?? 0
  const checklistTotal = trip.checklist_items?.length ?? 0
  const checklistDone = trip.checklist_items?.filter((item) => item.isCompleted).length ?? 0
  const membersCount = Math.max(trip.members?.length ?? 1, 1)
  const expenseTotal = (trip.expenses ?? []).reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const budgetLabel =
    expenseTotal > 0 ? `${Math.round(expenseTotal)} ${trip.base_currency || 'BRL'}` : trip.base_currency || 'BRL'

  useEffect(() => {
    setResolvedCover(coverUri || fallbackCover)
  }, [coverUri, fallbackCover])

  return (
    <Box className="overflow-hidden rounded-[34px] bg-white" style={shadowStrong}>
      <Pressable onPress={onPress}>
        <ImageBackground
          source={{ uri: resolvedCover }}
          resizeMode="cover"
          style={{ height: 184 }}
          onError={() => {
            if (resolvedCover !== fallbackCover) {
              setResolvedCover(fallbackCover)
            }
          }}
        >
          <LinearGradient
            colors={['rgba(15,23,42,0.06)', 'rgba(15,23,42,0.72)']}
            style={absoluteFill}
          />

          {daysUntil !== null ? (
            <Box className="absolute right-4 top-4 items-center rounded-[20px] bg-white/92 px-3 py-2">
              <Text className="text-[26px] font-black leading-7 text-primary">{daysUntil}</Text>
              <Text className="text-[10px] font-black uppercase tracking-[1px] text-primary">dias</Text>
            </Box>
          ) : null}

          <VStack className="flex-1 justify-end p-5">
            <Text className="text-[12px] font-black uppercase tracking-[1.6px] text-white/75">
              Sua viagem
            </Text>
            <Text className="mt-1 text-[34px] font-black leading-[38px] text-white" numberOfLines={1}>
              {trip.destination}
            </Text>
          </VStack>
        </ImageBackground>
      </Pressable>

      <HStack className="items-center justify-between px-4 py-4">
        <Metric
          icon="star"
          label="Wishlist"
          value={String(wishlistCount)}
          color={colors.orange}
          onPress={onShortcut ? () => onShortcut('wishlist') : undefined}
        />
        <Box className="h-10 w-px bg-[#E5E7EB]" />
        <Metric
          icon="checkmark-circle"
          label="Checklist"
          value={checklistTotal ? `${checklistDone}/${checklistTotal}` : '0'}
          color={colors.mint}
          onPress={onShortcut ? () => onShortcut('checklist') : undefined}
        />
        <Box className="h-10 w-px bg-[#E5E7EB]" />
        <Metric
          icon="people"
          label="Grupo"
          value={String(membersCount)}
          color={colors.primary}
          onPress={onShortcut ? () => onShortcut('group') : undefined}
        />
        <Box className="h-10 w-px bg-[#E5E7EB]" />
        <Metric
          icon="wallet"
          label="Orçamento"
          value={budgetLabel}
          color={colors.sky}
          onPress={onShortcut ? () => onShortcut('budget') : undefined}
        />
      </HStack>

      <Pressable onPress={onPress}>
        <HStack className="items-center justify-center gap-1 border-t border-[#E5E7EB] px-5 py-3">
          <Text className="text-[12px] font-black text-primary">Abrir viagem</Text>
          <Ionicons color={colors.primary} name="chevron-forward" size={18} />
        </HStack>
      </Pressable>
    </Box>
  )
}

function Metric({
  icon,
  label,
  value,
  color,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: string
  color: string
  onPress?: () => void
}) {
  const content = (
    <VStack className="flex-1 items-center gap-1">
      <HStack className="items-center gap-1.5">
        <Ionicons color={color} name={icon} size={18} />
        <Text className="text-[16px] font-black text-foreground">{value}</Text>
      </HStack>
      <Text className="text-[10px] font-black text-muted-foreground">{label}</Text>
    </VStack>
  )

  if (!onPress) return content

  return (
    <Pressable onPress={onPress} className="flex-1">
      {content}
    </Pressable>
  )
}
