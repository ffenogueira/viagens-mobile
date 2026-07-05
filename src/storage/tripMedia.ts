import * as SecureStore from 'expo-secure-store'
import type { TripDayItem } from '../types/trip'

export type TripMediaCache = {
  coverImageUri?: string
  placePhotos: Record<string, string>
  localPlaces: Record<string, TripDayItem[]>
}

const prefix = 'trip_media_v1_'

function key(tripId: string) {
  return `${prefix}${tripId}`
}

export async function loadTripMedia(tripId: string): Promise<TripMediaCache> {
  try {
    const raw = await SecureStore.getItemAsync(key(tripId))
    if (!raw) return { placePhotos: {}, localPlaces: {} }
    const parsed = JSON.parse(raw) as TripMediaCache
    return {
      coverImageUri: parsed.coverImageUri,
      placePhotos: parsed.placePhotos ?? {},
      localPlaces: parsed.localPlaces ?? {}
    }
  } catch {
    return { placePhotos: {}, localPlaces: {} }
  }
}

export async function saveTripMedia(tripId: string, cache: TripMediaCache): Promise<void> {
  await SecureStore.setItemAsync(key(tripId), JSON.stringify(cache))
}

export async function setTripCoverLocal(tripId: string, uri: string): Promise<TripMediaCache> {
  const current = await loadTripMedia(tripId)
  const next = { ...current, coverImageUri: uri }
  await saveTripMedia(tripId, next)
  return next
}

export async function setPlacePhotoLocal(tripId: string, placeId: string, uri: string): Promise<TripMediaCache> {
  const current = await loadTripMedia(tripId)
  const next = {
    ...current,
    placePhotos: { ...current.placePhotos, [placeId]: uri }
  }
  await saveTripMedia(tripId, next)
  return next
}

export async function saveLocalPlaces(
  tripId: string,
  localPlaces: Record<string, TripDayItem[]>
): Promise<TripMediaCache> {
  const current = await loadTripMedia(tripId)
  const next = { ...current, localPlaces }
  await saveTripMedia(tripId, next)
  return next
}
