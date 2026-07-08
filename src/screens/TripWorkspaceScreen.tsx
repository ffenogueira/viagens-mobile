import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import {
  Box,
  HStack,
  Pressable,
  Text,
  VStack
} from '../../components/ui'
import { formatAppDate } from '../i18n/format'
import { i18n } from '../i18n'
import {
  addTripItineraryItem,
  fetchTrip,
  deleteTrip,
  requestActivitySuggestions,
  searchPlaces,
  updateTrip,
  updateTripCover,
  updateTripItineraryItemPhoto,
  type PlaceSuggestion
} from '../api/client'
import { BrazilianDateField } from '../components/BrazilianDateField'
import { DestinationAutocomplete } from '../components/DestinationAutocomplete'
import { TripBoardSheet, TripChecklistSheet, TripWishlistSheet } from '../components/TripToolsSheets'
import { TripMapModal } from '../components/TripMapModal'
import { TripMapCanvas } from '../components/TripMapCanvas'
import { TripMapView } from '../components/TripMapView'
import { TripDeleteConfirmModal } from '../components/TripDeleteConfirmModal'
import { TripOptionsMenu } from '../components/TripOptionsMenu'
import { TripInviteSheet } from '../components/TripInviteSheet'
import { formatDateInput, toIsoDateStart } from '../lib/dates'
import type { LeafletMapMarker } from '../lib/buildLeafletMapHtml'
import { filterMarkersForDay, resolveTripMapMarkers } from '../lib/tripMapMarkers'
import { getTripCoverFallback } from '../lib/demoAssets'
import {
  askImageSource,
  pickImageFromCamera,
  pickImageFromLibrary
} from '../lib/imagePicker'
import { formatPlaceTime, normalizeTime, periodFromTime, periodIcon } from '../lib/placeSchedule'
import { resolveTripCurrency } from '../lib/tripCurrency'
import { loadTripMedia, saveLocalPlaces, setPlacePhotoLocal, setTripCoverLocal, type TripMediaCache } from '../storage/tripMedia'
import { colors, shadow, shadowStrong } from '../theme'
import type { ActivitySuggestion, NavigationTarget, Trip, TripDayItem, TripToolsPanel } from '../types/trip'

const ROLE_STYLES = [
  { id: 'Gastronomia', labelKey: 'roleGastronomy' },
  { id: 'Cultura', labelKey: 'roleCulture' },
  { id: 'Natureza', labelKey: 'roleNature' },
  { id: 'Compras', labelKey: 'roleShopping' },
  { id: 'Vida noturna', labelKey: 'roleNightlife' },
  { id: 'Família', labelKey: 'roleFamily' },
  { id: 'Aventura', labelKey: 'roleAdventure' },
  { id: 'Relax', labelKey: 'roleRelax' }
] as const

const GENERIC_MAP_IMAGE =
  'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80'

type CalendarDay = {
  id: string
  weekday: string
  day: string
  dayNumber: number
  label: string
}

const absoluteFill = StyleSheet.absoluteFill

function buildTripCalendar(trip: Trip): CalendarDay[] {
  const start = trip.start_date ? new Date(`${trip.start_date}T12:00:00`) : new Date()
  const end = trip.end_date ? new Date(`${trip.end_date}T12:00:00`) : new Date(start)
  const last = end.getTime() >= start.getTime() ? end : start

  const days: CalendarDay[] = []
  const cursor = new Date(start)
  let index = 0

  while (cursor.getTime() <= last.getTime() && index < 60) {
    days.push({
      id: cursor.toISOString().slice(0, 10),
      weekday: formatAppDate(cursor, { weekday: 'short' }).replace('.', '').toUpperCase(),
      day: formatAppDate(cursor, { day: 'numeric' }),
      dayNumber: index + 1,
      label: formatAppDate(cursor, { weekday: 'long', day: 'numeric', month: 'short' })
    })
    cursor.setDate(cursor.getDate() + 1)
    index += 1
  }

  if (!days.length) {
    const today = new Date()
    days.push({
      id: today.toISOString().slice(0, 10),
      weekday: formatAppDate(today, { weekday: 'short' }).replace('.', '').toUpperCase(),
      day: formatAppDate(today, { day: 'numeric' }),
      dayNumber: 1,
      label: formatAppDate(today, { weekday: 'long', day: 'numeric', month: 'short' })
    })
  }

  return days
}

function formatDateRange(start?: string, end?: string) {
  if (!start) return i18n.t('flexibleDates', { ns: 'common' })
  const startDate = new Date(`${start}T12:00:00`)
  const endDate = end ? new Date(`${end}T12:00:00`) : null
  const fmt = (date: Date) => formatAppDate(date, { day: 'numeric', month: 'short' })
  if (!endDate) return fmt(startDate)
  return `${fmt(startDate)} - ${fmt(endDate)}`
}

function itemsForDay(trip: Trip | null, dayId: string | null): TripDayItem[] {
  if (!trip?.days?.length || !dayId) return []
  const dayPlan = trip.days.find((entry) => entry.date?.slice(0, 10) === dayId)
  return dayPlan?.items ?? []
}

export function TripWorkspaceScreen({
  trip,
  onBack,
  onNavigate,
  onTripUpdated,
  onTripDeleted,
  initialToolsPanel = null
}: {
  trip: Trip | null
  onBack: () => void
  onNavigate: (target: NavigationTarget) => void
  onTripUpdated?: (trip: Trip) => void
  onTripDeleted?: (tripId: string) => void
  initialToolsPanel?: TripToolsPanel | null
}) {
  const { t } = useTranslation('trip')
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(Boolean(trip))
  const [savingPlace, setSavingPlace] = useState(false)
  const [savingCover, setSavingCover] = useState(false)
  const [tripData, setTripData] = useState<Trip | null>(trip)
  const [mediaCache, setMediaCache] = useState<TripMediaCache>({ placePhotos: {}, localPlaces: {} })
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [localPlaces, setLocalPlaces] = useState<Record<string, TripDayItem[]>>({})
  const [addPlaceOpen, setAddPlaceOpen] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [placeDraft, setPlaceDraft] = useState('')
  const [placeDescriptionDraft, setPlaceDescriptionDraft] = useState('')
  const [placeTimeDraft, setPlaceTimeDraft] = useState('')
  const [placePhotoDraft, setPlacePhotoDraft] = useState<string | null>(null)
  const [suggestStyle, setSuggestStyle] = useState<string>(ROLE_STYLES[1].id)
  const [suggestPeriod, setSuggestPeriod] = useState<'day' | 'night'>('day')
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<ActivitySuggestion[]>([])
  const [suggestionSource, setSuggestionSource] = useState<'ai' | 'fallback' | null>(null)
  const [editTripOpen, setEditTripOpen] = useState(false)
  const [tripMenuOpen, setTripMenuOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingTrip, setDeletingTrip] = useState(false)
  const [editDestination, setEditDestination] = useState('')
  const [editCountry, setEditCountry] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editPlace, setEditPlace] = useState<PlaceSuggestion | null>(null)
  const [savingTripDetails, setSavingTripDetails] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [tripMapMarkers, setTripMapMarkers] = useState<LeafletMapMarker[]>([])
  const [tripMapLoading, setTripMapLoading] = useState(false)
  const [mapModalOpen, setMapModalOpen] = useState(false)
  const [placePreviewMarkers, setPlacePreviewMarkers] = useState<LeafletMapMarker[]>([])
  const [toolsPanel, setToolsPanel] = useState<TripToolsPanel | null>(initialToolsPanel)
  const [inviteOpen, setInviteOpen] = useState(false)

  useEffect(() => {
    setToolsPanel(initialToolsPanel)
  }, [initialToolsPanel, trip?.id])

  async function refreshTripData() {
    const activeTrip = tripData ?? trip
    if (!activeTrip?.id) return
    const fresh = await fetchTrip(activeTrip.id)
    setTripData(fresh)
    onTripUpdated?.(fresh)
  }

  function openAddPlaceFromWishlist(title: string) {
    setPlaceDraft(title)
    setPlaceDescriptionDraft('')
    setPlaceTimeDraft('')
    setPlacePhotoDraft(null)
    setAddPlaceOpen(true)
  }

  useEffect(() => {
    if (!trip?.id) return

    void (async () => {
      setLoading(true)
      setLoadError('')
      try {
        const [fresh, media] = await Promise.all([fetchTrip(trip.id), loadTripMedia(trip.id)])
        let tripDataNext = fresh
        if (fresh.country) {
          const expectedCurrency = resolveTripCurrency(fresh.country)
          if (fresh.base_currency !== expectedCurrency) {
            tripDataNext = await updateTrip(fresh.id, {
              country: fresh.country,
              budgetCurrency: expectedCurrency
            })
            onTripUpdated?.(tripDataNext)
          }
        }
        setTripData(tripDataNext)
        setMediaCache(media)
        setLocalPlaces(media.localPlaces ?? {})
        setCoverImageUri(media.coverImageUri ?? fresh.cover_image_url ?? null)
      } catch (error) {
        const media = await loadTripMedia(trip.id)
        setTripData(trip)
        setMediaCache(media)
        setLocalPlaces(media.localPlaces ?? {})
        setCoverImageUri(media.coverImageUri ?? trip.cover_image_url ?? null)
        setLoadError(error instanceof Error ? error.message : t('loadFailed'))
      } finally {
        setLoading(false)
      }
    })()
  }, [trip?.id])

  const currentTrip = tripData ?? trip
  const calendarDays = useMemo(
    () => (currentTrip ? buildTripCalendar(currentTrip) : []),
    [currentTrip?.id, currentTrip?.start_date, currentTrip?.end_date]
  )

  const activeDayId = selectedDayId ?? calendarDays[0]?.id ?? null
  const activeDay = calendarDays.find((day) => day.id === activeDayId) ?? calendarDays[0]
  const dayPlaces = useMemo(() => {
    const remote = itemsForDay(currentTrip, activeDayId).map((item) => ({
      ...item,
      photoUrl: item.photoUrl ?? mediaCache.placePhotos[item.id] ?? null
    }))
    const local = (localPlaces[activeDayId ?? ''] ?? []).map((item) => ({
      ...item,
      photoUrl: item.photoUrl ?? mediaCache.placePhotos[item.id] ?? null
    }))
    return [...remote, ...local]
  }, [currentTrip, activeDayId, localPlaces, mediaCache.placePhotos])

  const dayMapMarkers = useMemo(
    () => filterMarkersForDay(tripMapMarkers, dayPlaces),
    [tripMapMarkers, dayPlaces]
  )

  useEffect(() => {
    if (!currentTrip) {
      setTripMapMarkers([])
      return
    }

    let cancelled = false
    setTripMapLoading(true)

    void (async () => {
      try {
        const markers = await resolveTripMapMarkers(currentTrip, localPlaces)
        if (!cancelled) setTripMapMarkers(markers)
      } finally {
        if (!cancelled) setTripMapLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [currentTrip, localPlaces])

  useEffect(() => {
    if (!addPlaceOpen || !placeDraft.trim() || !currentTrip) {
      setPlacePreviewMarkers([])
      return
    }

    let cancelled = false
    const timer = setTimeout(() => {
      void (async () => {
        const query = [placeDraft.trim(), currentTrip.destination, currentTrip.country].filter(Boolean).join(', ')
        try {
          const places = await searchPlaces(query.slice(0, 80))
          const hit = places[0]
          const latitude = hit?.latitude ?? currentTrip.latitude
          const longitude = hit?.longitude ?? currentTrip.longitude
          if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            if (!cancelled) setPlacePreviewMarkers([])
            return
          }
          if (!cancelled) {
            setPlacePreviewMarkers([
              {
                id: 'preview',
                title: placeDraft.trim(),
                latitude,
                longitude,
                order: 1
              }
            ])
          }
        } catch {
          if (!cancelled) setPlacePreviewMarkers([])
        }
      })()
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [addPlaceOpen, placeDraft, currentTrip])

  const coverFallback = getTripCoverFallback(currentTrip?.destination)
  const coverCandidate = coverImageUri ?? currentTrip?.cover_image_url ?? coverFallback
  const [coverImage, setCoverImage] = useState(coverCandidate)

  useEffect(() => {
    setCoverImage(coverImageUri ?? currentTrip?.cover_image_url ?? coverFallback)
  }, [coverImageUri, currentTrip?.cover_image_url, coverFallback])

  function resetPlaceForm() {
    setPlaceDraft('')
    setPlaceDescriptionDraft('')
    setPlaceTimeDraft('')
    setPlacePhotoDraft(null)
  }

  function closeAddPlaceModal() {
    setAddPlaceOpen(false)
    setPlacePreviewMarkers([])
    resetPlaceForm()
  }

  function openSuggestModal() {
    setSuggestions([])
    setSuggestPeriod('day')
    setSuggestStyle(ROLE_STYLES[1].id)
    setSuggestOpen(true)
  }

  function applySuggestion(suggestion: ActivitySuggestion) {
    setPlaceDraft(suggestion.title)
    setPlaceDescriptionDraft(suggestion.description)
    setPlaceTimeDraft(suggestion.suggestedTime ? normalizeTime(suggestion.suggestedTime) ?? '' : '')
    setPlacePhotoDraft(suggestion.photoUrl ?? null)
    setSuggestOpen(false)
    setAddPlaceOpen(true)
  }

  function openEditTripModal() {
    if (!currentTrip) return
    setEditDestination(currentTrip.destination)
    setEditCountry(currentTrip.country ?? '')
    setEditStartDate(formatDateInput(currentTrip.start_date))
    setEditEndDate(formatDateInput(currentTrip.end_date))
    setEditPlace(null)
    setEditTripOpen(true)
  }

  function openTripMenu() {
    setTripMenuOpen(true)
  }

  function openDeleteConfirm() {
    setDeleteConfirmOpen(true)
  }

  async function confirmDeleteTrip() {
    if (!currentTrip) return
    setDeletingTrip(true)
    try {
      await deleteTrip(currentTrip.id)
      setDeleteConfirmOpen(false)
      setTripMenuOpen(false)
      onTripDeleted?.(currentTrip.id)
      onBack()
    } catch (error) {
      Alert.alert(
        i18n.t('couldNotDelete', { ns: 'common' }),
        error instanceof Error ? error.message : i18n.t('tryAgain', { ns: 'common' })
      )
    } finally {
      setDeletingTrip(false)
    }
  }

  async function saveTripDetails() {
    if (!currentTrip) return
    const destinationName = (editPlace?.name ?? editDestination.trim()) || currentTrip.destination
    const startsAt = toIsoDateStart(editStartDate.trim())
    const endsAt = toIsoDateStart(editEndDate.trim())

    if (editStartDate && !startsAt) {
      Alert.alert(i18n.t('invalidDate', { ns: 'common' }), i18n.t('invalidStartDate', { ns: 'common' }))
      return
    }
    if (editEndDate && !endsAt) {
      Alert.alert(i18n.t('invalidDate', { ns: 'common' }), i18n.t('invalidEndDate', { ns: 'common' }))
      return
    }

    setSavingTripDetails(true)
    try {
      const fresh = await updateTrip(currentTrip.id, {
        destinationName,
        country: (editPlace?.country ?? editCountry.trim()) || undefined,
        countryCode: editPlace?.countryCode,
        startsAt,
        endsAt,
        latitude: editPlace?.latitude,
        longitude: editPlace?.longitude,
        region: editPlace?.region || undefined
      })
      publishTrip(fresh)
      setEditTripOpen(false)
    } catch (error) {
      Alert.alert(
        i18n.t('couldNotSave', { ns: 'common' }),
        error instanceof Error ? error.message : i18n.t('tryAgain', { ns: 'common' })
      )
    } finally {
      setSavingTripDetails(false)
    }
  }

  async function fetchSuggestions() {
    if (!currentTrip || !activeDayId) return
    setSuggestLoading(true)
    setSuggestions([])
    setSuggestionSource(null)
    try {
      const result = await requestActivitySuggestions(currentTrip.id, {
        date: activeDayId,
        style: suggestStyle,
        period: suggestPeriod
      })
      setSuggestions(result.suggestions)
      setSuggestionSource(result.source ?? null)
      if (!result.suggestions.length) {
        Alert.alert('FEFAI', i18n.t('noSuggestions', { ns: 'tools' }))
      }
    } catch (error) {
      Alert.alert(
        'FEFAI',
        error instanceof Error ? error.message : i18n.t('suggestFailed', { ns: 'tools' })
      )
    } finally {
      setSuggestLoading(false)
    }
  }

  function publishTrip(next: Trip) {
    setTripData(next)
    onTripUpdated?.(next)
  }

  async function applyCover(uri: string) {
    if (!currentTrip) return
    setSavingCover(true)
    setCoverImageUri(uri)
    const next = { ...currentTrip, cover_image_url: uri }
    publishTrip(next)
    try {
      const media = await setTripCoverLocal(currentTrip.id, uri)
      setMediaCache(media)
      try {
        const updated = await updateTripCover(currentTrip.id, uri)
        publishTrip({ ...updated, cover_image_url: uri })
      } catch {
        // capa fica salva localmente
      }
    } finally {
      setSavingCover(false)
    }
  }

  function changeCover() {
    askImageSource(
      () => {
        void (async () => {
          const uri = await pickImageFromLibrary()
          if (uri) await applyCover(uri)
        })()
      },
      () => {
        void (async () => {
          const uri = await pickImageFromCamera()
          if (uri) await applyCover(uri)
        })()
      }
    )
  }

  function pickPlacePhotoDraft() {
    askImageSource(
      () => {
        void (async () => {
          const uri = await pickImageFromLibrary()
          if (uri) setPlacePhotoDraft(uri)
        })()
      },
      () => {
        void (async () => {
          const uri = await pickImageFromCamera()
          if (uri) setPlacePhotoDraft(uri)
        })()
      }
    )
  }

  async function changePlacePhoto(place: TripDayItem) {
    if (!currentTrip) return

    askImageSource(
      () => {
        void (async () => {
          const uri = await pickImageFromLibrary()
          if (uri) await savePlacePhoto(place, uri)
        })()
      },
      () => {
        void (async () => {
          const uri = await pickImageFromCamera()
          if (uri) await savePlacePhoto(place, uri)
        })()
      }
    )
  }

  async function savePlacePhoto(place: TripDayItem, uri: string) {
    if (!currentTrip) return
    const media = await setPlacePhotoLocal(currentTrip.id, place.id, uri)
    setMediaCache(media)

    if (!place.id.startsWith('local-')) {
      try {
        const fresh = await updateTripItineraryItemPhoto(currentTrip.id, place.id, uri)
        publishTrip(fresh)
        return
      } catch {
        // mantém cache local
      }
    }

    setLocalPlaces((current) => {
      const next: Record<string, TripDayItem[]> = {}
      for (const [dayId, items] of Object.entries(current)) {
        next[dayId] = items.map((item) =>
          item.id === place.id ? { ...item, photoUrl: uri } : item
        )
      }
      void saveLocalPlaces(currentTrip.id, next)
      return next
    })
  }

  async function submitPlace() {
    if (!activeDayId || !placeDraft.trim() || !currentTrip) return

    const normalizedTime = placeTimeDraft.trim() ? normalizeTime(placeTimeDraft.trim()) : null
    if (placeTimeDraft.trim() && !normalizedTime) {
      Alert.alert(i18n.t('invalidTime', { ns: 'common' }), i18n.t('invalidTimeBody', { ns: 'common' }))
      return
    }

    setSavingPlace(true)
    const title = placeDraft.trim()
    const description = placeDescriptionDraft.trim() || undefined
    const photoUrl = placePhotoDraft ?? undefined
    const time = normalizedTime ?? undefined

    try {
      const fresh = await addTripItineraryItem(currentTrip.id, {
        date: activeDayId,
        title,
        placeName: title,
        dayTitle: t('dayLabel', { number: activeDay?.dayNumber ?? 1 }),
        photoUrl,
        time,
        description
      })
      publishTrip(fresh)
      if (photoUrl) {
        const created = itemsForDay(fresh, activeDayId).find((item) => item.title === title)
        if (created) {
          const media = await setPlacePhotoLocal(currentTrip.id, created.id, photoUrl)
          setMediaCache(media)
        }
      }
      closeAddPlaceModal()
    } catch (error) {
      const localId = `local-${Date.now()}`
      const localItem: TripDayItem = {
        id: localId,
        title,
        type: 'place',
        placeName: title,
        photoUrl: photoUrl ?? null,
        description: description ?? null,
        timeLabel: time ?? null,
        startsAt: time ? `${activeDayId}T${time}:00` : null
      }
      const nextLocalPlaces = {
        ...localPlaces,
        [activeDayId]: [...(localPlaces[activeDayId] ?? []), localItem]
      }
      if (photoUrl) {
        await setPlacePhotoLocal(currentTrip.id, localId, photoUrl)
      }
      const media = await saveLocalPlaces(currentTrip.id, nextLocalPlaces)
      setMediaCache(media)
      setLocalPlaces(nextLocalPlaces)
      closeAddPlaceModal()
      Alert.alert(i18n.t('placeAdded', { ns: 'tools' }), i18n.t('placeAddedBody', { ns: 'tools' }))
    } finally {
      setSavingPlace(false)
    }
  }

  const wishlistCount = currentTrip?.wishlist_items?.length ?? 0
  const checklistTotal = currentTrip?.checklist_items?.length ?? 0
  const checklistDone = currentTrip?.checklist_items?.filter((item) => item.isCompleted).length ?? 0
  const boardCount = currentTrip?.journal_entries?.length ?? 0
  const membersCount = Math.max(currentTrip?.members?.length ?? 1, 1)
  const expenseTotal = (currentTrip?.expenses ?? []).reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const currency = currentTrip?.base_currency ?? 'BRL'

  function shareTrip() {
    setInviteOpen(true)
  }

  function openTripMap() {
    if (!tripMapMarkers.length && !dayMapMarkers.length) return
    setMapModalOpen(true)
  }

  if (!trip || !currentTrip) {
    return (
      <Box className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-base font-semibold text-muted-foreground">{t('notFound')}</Text>
        <Pressable onPress={onBack} className="mt-4 rounded-full bg-primary px-5 py-3">
          <Text className="font-black text-white">{t('common:back')}</Text>
        </Pressable>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} size="large" />
      </Box>
    )
  }

  return (
    <Box className="flex-1 bg-background">
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={{ height: 220 + insets.top }}>
          <ImageBackground
            source={{ uri: coverImage }}
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
            onError={() => {
              if (coverImage !== coverFallback) {
                setCoverImage(coverFallback)
              }
            }}
          >
            <LinearGradient colors={['rgba(15,23,42,0.15)', 'rgba(15,23,42,0.82)']} style={absoluteFill} />

            <HStack
              className="items-center justify-between px-5"
              style={{ paddingTop: insets.top + 8 }}
            >
              <Pressable
                onPress={onBack}
                className="h-11 w-11 items-center justify-center rounded-full bg-white/90"
              >
                <Ionicons color={colors.ink} name="arrow-back" size={22} />
              </Pressable>

              <HStack className="gap-2">
                <HeaderIcon icon="share-outline" onPress={() => void shareTrip()} />
                <HeaderIcon icon="ellipsis-horizontal" onPress={openTripMenu} />
              </HStack>
            </HStack>

            <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 32 }}>
              <Text className="text-[12px] font-black uppercase tracking-[1.6px] text-white/75">{t('common:yourTrip')}</Text>
              <Pressable onPress={openEditTripModal}>
                <Text className="mt-1 text-[34px] font-black leading-[38px] text-white" numberOfLines={1}>
                  {currentTrip.destination}
                </Text>
                <Text className="mt-1 text-[13px] font-bold text-white/85">
                  {t('tapToEdit', { range: formatDateRange(currentTrip.start_date, currentTrip.end_date) })}
                </Text>
              </Pressable>
            </View>
          </ImageBackground>
        </View>

        <Box className="-mt-4 rounded-t-[32px] bg-background px-5 pt-8">
          {loadError ? (
            <Box className="mb-4 rounded-2xl bg-viagens-lilac px-4 py-3">
              <Text className="text-[13px] font-semibold text-primary">{loadError}</Text>
            </Box>
          ) : null}

          <Text className="mb-3 text-[11px] font-black uppercase tracking-[1.6px] text-muted-foreground">
            {t('tripShortcuts')}
          </Text>
          <TripToolsBar
            wishlistCount={wishlistCount}
            checklistLabel={checklistTotal ? `${checklistDone}/${checklistTotal}` : '0'}
            membersCount={membersCount}
            expenseLabel={expenseTotal > 0 ? `${Math.round(expenseTotal)} ${currency}` : currency}
            boardLabel={boardCount ? String(boardCount) : t('notes')}
            onWishlist={() => setToolsPanel('wishlist')}
            onChecklist={() => setToolsPanel('checklist')}
            onTravelers={() => onNavigate('group-chat')}
            onBudget={() => onNavigate('expenses')}
            onBoard={() => setToolsPanel('board')}
          />

          <Text className="mb-3 mt-8 text-[11px] font-black uppercase tracking-[1.6px] text-muted-foreground">
            {t('tripDays')}
          </Text>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 8, paddingBottom: 4 }}
            className="mb-8"
          >
            <HStack className="gap-3">
              {calendarDays.map((day) => {
                const active = day.id === activeDayId
                return (
                  <Pressable key={day.id} onPress={() => setSelectedDayId(day.id)}>
                    <Box
                      className={`h-[86px] w-[70px] items-center justify-center rounded-[26px] ${
                        active ? 'bg-primary' : 'border border-[#E5E7EB] bg-white'
                      }`}
                    >
                      <Text className={`text-[12px] font-black ${active ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {day.weekday}
                      </Text>
                      <Text className={`mt-1 text-[28px] font-black ${active ? 'text-white' : 'text-foreground'}`}>
                        {day.day}
                      </Text>
                    </Box>
                  </Pressable>
                )
              })}
            </HStack>
          </ScrollView>

          <HStack className="mb-5 mt-2 items-start justify-between">
            <VStack className="flex-1 pr-3">
              <Text className="text-[28px] font-black text-foreground">{t('dayLabel', { number: activeDay?.dayNumber ?? 1 })}</Text>
              <Text className="mt-1 text-[14px] font-semibold capitalize text-muted-foreground">
                {activeDay?.label}
              </Text>
            </VStack>
            <Pressable
              onPress={openSuggestModal}
              className="h-12 w-12 items-center justify-center rounded-2xl bg-viagens-lilac"
            >
              <Ionicons color={colors.primary} name="sparkles" size={22} />
            </Pressable>
          </HStack>

          {dayPlaces.length === 0 ? (
            <VStack className="items-center rounded-[28px] border border-[#EEF2FF] bg-white px-6 py-10" style={shadow}>
              <Box className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-viagens-lilac">
                <Ionicons color={colors.primary} name="location-outline" size={36} />
              </Box>
              <Text className="text-center text-[20px] font-black text-foreground">{t('noPlaces')}</Text>
              <Text className="mt-2 text-center text-[14px] font-semibold leading-6 text-muted-foreground">
                {t('noPlacesHint')}
              </Text>
            </VStack>
          ) : (
            <VStack className="gap-3">
              {dayPlaces.map((place, index) => {
                const timeLabel = formatPlaceTime(place.startsAt, place.timeLabel)
                const period = periodFromTime(timeLabel)
                const iconName = periodIcon(period, timeLabel)
                return (
                  <Pressable
                    key={place.id}
                    onPress={() => void changePlacePhoto(place)}
                    className="overflow-hidden rounded-[24px] border border-[#EEF2FF] bg-white"
                    style={shadow}
                  >
                    {place.photoUrl ? (
                      <Image source={{ uri: place.photoUrl }} style={{ width: '100%', height: 132 }} resizeMode="cover" />
                    ) : null}
                    <HStack className="items-start gap-3 p-4">
                      {place.photoUrl ? null : (
                        <Box className="h-10 w-10 items-center justify-center rounded-2xl bg-viagens-lilac">
                          <Text className="text-[14px] font-black text-primary">{index + 1}</Text>
                        </Box>
                      )}
                      <VStack className="flex-1">
                        <HStack className="items-center gap-2">
                          {timeLabel ? (
                            <HStack className="items-center gap-1 rounded-full bg-[#F8FAFC] px-2 py-1">
                              <Ionicons color={colors.primary} name={iconName} size={14} />
                              <Text className="text-[12px] font-black text-primary">{timeLabel}</Text>
                            </HStack>
                          ) : null}
                          <Text className="flex-1 text-[16px] font-black text-foreground">
                            {place.placeName || place.title}
                          </Text>
                        </HStack>
                        {place.description ? (
                          <Text className="mt-1 text-[13px] font-semibold leading-5 text-muted-foreground" numberOfLines={3}>
                            {place.description}
                          </Text>
                        ) : null}
                        <Text className="mt-1 text-[12px] font-semibold text-primary">
                          {place.photoUrl ? t('tapChangePhoto') : t('tapAddPhoto')}
                        </Text>
                      </VStack>
                      <Ionicons color={colors.mutedLight} name="camera-outline" size={20} />
                    </HStack>
                  </Pressable>
                )
              })}
            </VStack>
          )}

          <Pressable
            onPress={() => setAddPlaceOpen(true)}
            className="mt-4 rounded-[28px] border border-[#EEF2FF] bg-white p-4"
            style={shadowStrong}
          >
            <HStack className="items-center gap-4">
              <Box className="h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                <Ionicons color={colors.white} name="add" size={28} />
              </Box>
              <VStack className="flex-1">
                <Text className="text-[18px] font-black text-foreground">{t('addPlaceTitle')}</Text>
                <Text className="mt-0.5 text-[13px] font-semibold text-muted-foreground">{t('addPlaceSubtitle')}</Text>
              </VStack>
              <Ionicons color={colors.mutedLight} name="chevron-forward" size={22} />
            </HStack>
          </Pressable>

          <Pressable
            onPress={openTripMap}
            disabled={!dayMapMarkers.length && !tripMapMarkers.length}
            className="mt-4 overflow-hidden rounded-[28px] border border-[#EEF2FF] bg-white"
            style={shadow}
          >
            <View style={{ height: 140, position: 'relative' }}>
              {dayMapMarkers.length > 0 ? (
                <TripMapView markers={dayMapMarkers} height={140} />
              ) : tripMapLoading && dayPlaces.length > 0 ? (
                <TripMapView markers={[]} height={140} loading />
              ) : (
                <ImageBackground
                  source={{ uri: GENERIC_MAP_IMAGE }}
                  resizeMode="cover"
                  style={{ height: 140, width: '100%' }}
                >
                  <LinearGradient colors={['transparent', 'rgba(15,23,42,0.55)']} style={absoluteFill} />
                </ImageBackground>
              )}
              <Box className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5">
                <Text className="text-[12px] font-black text-foreground">
                  {dayPlaces.length} {dayPlaces.length === 1 ? t('placeSingular') : t('placePlural')}
                </Text>
              </Box>
              {(dayMapMarkers.length > 0 || tripMapMarkers.length > 0) && (
                <Box className="absolute bottom-4 right-4 rounded-full bg-primary px-3 py-1.5">
                  <HStack className="items-center gap-1">
                    <Ionicons color={colors.white} name="expand-outline" size={14} />
                    <Text className="text-[12px] font-black text-white">{t('openMap')}</Text>
                  </HStack>
                </Box>
              )}
            </View>
          </Pressable>
        </Box>
      </ScrollView>

      <Modal visible={addPlaceOpen} animationType="slide" transparent onRequestClose={closeAddPlaceModal}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
          >
            <View style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: '#FFF', paddingHorizontal: 20, paddingBottom: 32, paddingTop: 16 }}>
              <View style={{ alignSelf: 'center', width: 64, height: 6, borderRadius: 999, backgroundColor: '#D1D5DB', marginBottom: 20 }} />
              <Text className="text-[24px] font-black text-foreground">{t('addPlaceTitle')}</Text>
              <Text className="mt-1 text-[13px] font-semibold text-muted-foreground">
                {t('addPlaceHint')}
              </Text>

              <Pressable
                onPress={openSuggestModal}
                className="mt-4 flex-row items-center gap-2 rounded-2xl border border-[#E9D5FF] bg-viagens-lilac px-4 py-3"
              >
                <Ionicons color={colors.primary} name="sparkles" size={18} />
                <Text className="text-[13px] font-black text-primary">{t('askFefaiSuggest')}</Text>
              </Pressable>

              <TextInput
                value={placeDraft}
                onChangeText={setPlaceDraft}
                placeholder={t('placePlaceholder')}
                placeholderTextColor={colors.muted}
                style={{
                  marginTop: 16,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.ink
                }}
              />

              <HStack className="mt-3 items-center gap-3">
                <Box className="flex-1">
                  <Text className="mb-1 text-[11px] font-black uppercase text-muted-foreground">{t('timeLabel')}</Text>
                  <TextInput
                    value={placeTimeDraft}
                    onChangeText={setPlaceTimeDraft}
                    placeholder="14:30"
                    placeholderTextColor={colors.muted}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                    style={{
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 16,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 16,
                      fontWeight: '600',
                      color: colors.ink
                    }}
                  />
                </Box>
                <Box className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[#F8FAFC]">
                  <Ionicons
                    color={colors.primary}
                    name={periodIcon(periodFromTime(normalizeTime(placeTimeDraft.trim())), placeTimeDraft)}
                    size={24}
                  />
                </Box>
              </HStack>

              <Text className="mb-1 mt-3 text-[11px] font-black uppercase text-muted-foreground">{t('descriptionLabel')}</Text>
              <TextInput
                value={placeDescriptionDraft}
                onChangeText={setPlaceDescriptionDraft}
                placeholder={t('placeDescriptionPlaceholder')}
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
                style={{
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  minHeight: 88,
                  fontSize: 15,
                  fontWeight: '600',
                  color: colors.ink
                }}
              />

              {placePreviewMarkers.length ? (
                <Box className="mt-4 overflow-hidden rounded-2xl border border-[#EEF2FF]">
                  <TripMapCanvas markers={placePreviewMarkers} height={132} />
                </Box>
              ) : null}

              <Pressable
                onPress={pickPlacePhotoDraft}
                className="mt-4 overflow-hidden rounded-2xl border border-[#E5E7EB]"
              >
                {placePhotoDraft ? (
                  <Image source={{ uri: placePhotoDraft }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
                ) : (
                  <View style={{ height: 120, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
                    <Ionicons color={colors.primary} name="camera-outline" size={28} />
                    <Text className="mt-2 text-[13px] font-black text-primary">{t('addPlacePhoto')}</Text>
                  </View>
                )}
              </Pressable>
              <Pressable
                onPress={() => void submitPlace()}
                disabled={savingPlace}
                className="mt-5 h-14 items-center justify-center rounded-full bg-primary"
              >
                {savingPlace ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text className="text-[16px] font-black text-white">{t('saveOnDay', { number: activeDay?.dayNumber ?? 1 })}</Text>
                )}
              </Pressable>
              <Pressable onPress={closeAddPlaceModal} className="mt-4 items-center">
                <Text className="text-[14px] font-bold text-muted-foreground">{t('common:cancel')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={suggestOpen} animationType="slide" transparent onRequestClose={() => setSuggestOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <View style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: '#FFF', paddingHorizontal: 20, paddingBottom: 32, paddingTop: 16, maxHeight: '88%' }}>
              <View style={{ alignSelf: 'center', width: 64, height: 6, borderRadius: 999, backgroundColor: '#D1D5DB', marginBottom: 20 }} />
              <Text className="text-[24px] font-black text-foreground">{t('fefaiSuggestTitle')}</Text>
              <Text className="mt-1 mb-6 text-[13px] font-semibold text-muted-foreground">
                {currentTrip.destination}
                {currentTrip.country ? `, ${currentTrip.country}` : ''} · {activeDay?.label}
              </Text>
              <Pressable onPress={openEditTripModal} className="mb-4 self-start">
                <Text className="text-[12px] font-black text-primary">{t('editDestinationOrDates')}</Text>
              </Pressable>

              <Text className="mb-2 text-[11px] font-black uppercase text-muted-foreground">{t('roleStyleLabel')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {ROLE_STYLES.map((style) => {
                  const active = suggestStyle === style.id
                  return (
                    <Pressable
                      key={style.id}
                      onPress={() => setSuggestStyle(style.id)}
                      className={`rounded-full px-3 py-2 ${active ? 'bg-primary' : 'border border-[#E5E7EB] bg-white'}`}
                    >
                      <Text className={`text-[12px] font-black ${active ? 'text-white' : 'text-foreground'}`}>{t(style.labelKey)}</Text>
                    </Pressable>
                  )
                })}
              </View>

              <Text className="mb-2 mt-5 text-[11px] font-black uppercase text-muted-foreground">{t('periodLabel')}</Text>
              <HStack className="gap-3">
                {([
                  { id: 'day' as const, label: t('periodDay'), icon: 'sunny-outline' as const },
                  { id: 'night' as const, label: t('periodNight'), icon: 'moon-outline' as const }
                ]).map((option) => {
                  const active = suggestPeriod === option.id
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => setSuggestPeriod(option.id)}
                      className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-3 ${
                        active ? 'bg-primary' : 'border border-[#E5E7EB] bg-white'
                      }`}
                    >
                      <Ionicons color={active ? colors.white : colors.primary} name={option.icon} size={18} />
                      <Text className={`text-[13px] font-black ${active ? 'text-white' : 'text-foreground'}`}>
                        {option.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </HStack>

              <Pressable
                onPress={() => void fetchSuggestions()}
                disabled={suggestLoading}
                className="mt-5 h-14 items-center justify-center rounded-full bg-primary"
              >
                {suggestLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text className="text-[16px] font-black text-white">{t('fetchThreeSuggestions')}</Text>
                )}
              </Pressable>

              {suggestions.length ? (
                <VStack className="mt-5 gap-3">
                  {suggestionSource ? (
                    <Text className="text-[11px] font-black uppercase text-muted-foreground">
                      {suggestionSource === 'ai' ? t('suggestionsAi') : t('suggestionsOffline')}
                    </Text>
                  ) : null}
                  {suggestions.map((item, index) => (
                    <Pressable
                      key={`suggestion-${index}-${item.title}`}
                      onPress={() => applySuggestion(item)}
                      className="overflow-hidden rounded-2xl border border-[#EEF2FF] bg-[#FAFAFF]"
                    >
                      {item.photoUrl ? (
                        <Image source={{ uri: item.photoUrl }} style={{ width: '100%', height: 120 }} resizeMode="cover" />
                      ) : null}
                      <Box className="p-4">
                        <HStack className="items-center gap-2">
                          {item.suggestedTime ? (
                            <HStack className="items-center gap-1 rounded-full bg-white px-2 py-1">
                              <Ionicons
                                color={colors.primary}
                                name={periodIcon(periodFromTime(item.suggestedTime), item.suggestedTime)}
                                size={14}
                              />
                              <Text className="text-[12px] font-black text-primary">{item.suggestedTime}</Text>
                            </HStack>
                          ) : null}
                          <Text className="flex-1 text-[15px] font-black text-foreground">{item.title}</Text>
                        </HStack>
                        <Text className="mt-2 text-[13px] font-semibold leading-5 text-muted-foreground">{item.description}</Text>
                        <Text className="mt-2 text-[12px] font-black text-primary">
                          {item.photoUrl ? t('useSuggestionWithPhoto') : t('useSuggestion')}
                        </Text>
                      </Box>
                    </Pressable>
                  ))}
                </VStack>
              ) : null}

              <Pressable onPress={() => setSuggestOpen(false)} className="mt-4 items-center">
                <Text className="text-[14px] font-bold text-muted-foreground">{t('common:close')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={editTripOpen} animationType="slide" transparent onRequestClose={() => setEditTripOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <View style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: '#FFF', paddingHorizontal: 20, paddingBottom: 32, paddingTop: 16 }}>
              <View style={{ alignSelf: 'center', width: 64, height: 6, borderRadius: 999, backgroundColor: '#D1D5DB', marginBottom: 20 }} />
              <Text className="text-[24px] font-black text-foreground">{t('common:editTrip')}</Text>
              <Text className="mt-1 mb-5 text-[13px] font-semibold text-muted-foreground">
                {t('editTripFefaiHint')}
              </Text>

              <DestinationAutocomplete
                label={t('cityOrDestination')}
                value={editDestination}
                onChangeText={(text) => {
                  setEditDestination(text)
                  setEditPlace(null)
                }}
                onSelectPlace={(place) => {
                  setEditPlace(place)
                  setEditDestination(place.name)
                  setEditCountry(place.country)
                }}
              />

              <Box className="mt-4">
                <BrazilianDateField
                  label={t('startLabel')}
                  value={editStartDate}
                  onChange={setEditStartDate}
                />
              </Box>

              <Box className="mt-4">
                <BrazilianDateField
                  label={t('endLabel')}
                  value={editEndDate}
                  onChange={setEditEndDate}
                  minimumDate={
                    editStartDate && /^\d{4}-\d{2}-\d{2}$/.test(editStartDate)
                      ? new Date(`${editStartDate}T12:00:00`)
                      : undefined
                  }
                />
              </Box>

              <Pressable
                onPress={() => void saveTripDetails()}
                disabled={savingTripDetails}
                className="mt-6 h-14 items-center justify-center rounded-full bg-primary"
              >
                {savingTripDetails ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text className="text-[16px] font-black text-white">{t('saveTrip')}</Text>
                )}
              </Pressable>
              <Pressable onPress={() => setEditTripOpen(false)} className="mt-4 items-center">
                <Text className="text-[14px] font-bold text-muted-foreground">{t('common:cancel')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <TripOptionsMenu
        visible={tripMenuOpen}
        onClose={() => setTripMenuOpen(false)}
        onEditTrip={openEditTripModal}
        onChangeCover={changeCover}
        onDeleteTrip={openDeleteConfirm}
      />

      <TripDeleteConfirmModal
        visible={deleteConfirmOpen}
        destination={currentTrip.destination}
        loading={deletingTrip}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => void confirmDeleteTrip()}
      />

      <TripMapModal
        visible={mapModalOpen}
        markers={tripMapMarkers}
        destination={currentTrip.destination}
        onClose={() => setMapModalOpen(false)}
      />

      <TripWishlistSheet
        visible={toolsPanel === 'wishlist'}
        trip={currentTrip}
        items={currentTrip.wishlist_items ?? []}
        onClose={() => setToolsPanel(null)}
        onRefresh={refreshTripData}
        onAddToDay={openAddPlaceFromWishlist}
      />
      <TripChecklistSheet
        visible={toolsPanel === 'checklist'}
        trip={currentTrip}
        items={currentTrip.checklist_items ?? []}
        onClose={() => setToolsPanel(null)}
        onRefresh={refreshTripData}
      />
      <TripBoardSheet
        visible={toolsPanel === 'board'}
        trip={currentTrip}
        entries={currentTrip.journal_entries ?? []}
        onClose={() => setToolsPanel(null)}
        onRefresh={refreshTripData}
      />
      <TripInviteSheet visible={inviteOpen} trip={currentTrip} onClose={() => setInviteOpen(false)} />
    </Box>
  )
}

function HeaderIcon({
  icon,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} className="h-11 w-11 items-center justify-center rounded-full bg-white/90">
      <Ionicons color={colors.ink} name={icon} size={20} />
    </Pressable>
  )
}

function TripToolsBar({
  wishlistCount,
  checklistLabel,
  membersCount,
  expenseLabel,
  boardLabel,
  onWishlist,
  onChecklist,
  onTravelers,
  onBudget,
  onBoard
}: {
  wishlistCount: number
  checklistLabel: string
  membersCount: number
  expenseLabel: string
  boardLabel: string
  onWishlist: () => void
  onChecklist: () => void
  onTravelers: () => void
  onBudget: () => void
  onBoard: () => void
}) {
  const { t } = useTranslation('trip')
  const tools = [
    { icon: 'star-outline' as const, label: t('wishlist'), value: String(wishlistCount), color: colors.orange, onPress: onWishlist },
    {
      icon: 'checkmark-circle-outline' as const,
      label: t('checklist'),
      value: checklistLabel,
      color: colors.mint,
      onPress: onChecklist
    },
    {
      icon: 'people-outline' as const,
      label: t('group'),
      value: String(membersCount),
      color: colors.primary,
      onPress: onTravelers
    },
    {
      icon: 'wallet-outline' as const,
      label: t('expenses'),
      value: expenseLabel,
      color: colors.sky,
      onPress: onBudget
    },
    {
      icon: 'document-text-outline' as const,
      label: t('journal'),
      value: boardLabel,
      color: colors.primary,
      onPress: onBoard
    }
  ]

  return (
    <Box className="rounded-[28px] border border-[#EEF2FF] bg-white px-2 py-3" style={shadow}>
      <HStack className="items-center">
        {tools.map((tool, index) => (
          <React.Fragment key={tool.label}>
            <Pressable onPress={tool.onPress} className="flex-1 items-center px-1 py-1">
              <Ionicons color={tool.color} name={tool.icon} size={20} />
              <Text className="mt-1.5 text-[10px] font-black text-muted-foreground">{tool.label}</Text>
              <Text className="mt-0.5 text-[12px] font-black text-foreground" numberOfLines={1}>
                {tool.value}
              </Text>
            </Pressable>
            {index < tools.length - 1 ? <Box className="h-10 w-px bg-[#E5E7EB]" /> : null}
          </React.Fragment>
        ))}
      </HStack>
    </Box>
  )
}
