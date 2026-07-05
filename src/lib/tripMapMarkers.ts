import { searchPlaces } from '../api/client'
import type { Trip, TripDayItem } from '../types/trip'
import type { LeafletMapMarker } from './buildLeafletMapHtml'

const geocodeCache = new Map<string, { latitude: number; longitude: number } | null>()

export function collectTripPlaces(
  trip: Trip | null,
  localPlaces: Record<string, TripDayItem[]>
): Array<TripDayItem & { dayDate?: string; dayTitle?: string }> {
  if (!trip) return []

  const seen = new Set<string>()
  const items: Array<TripDayItem & { dayDate?: string; dayTitle?: string }> = []

  for (const day of trip.days ?? []) {
    const dayDate = day.date?.slice(0, 10)
    for (const item of day.items) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      items.push({ ...item, dayDate, dayTitle: day.title })
    }
  }

  for (const [dayDate, dayItems] of Object.entries(localPlaces)) {
    for (const item of dayItems) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      items.push({ ...item, dayDate })
    }
  }

  return items
}

async function geocodePlace(query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return null
  if (geocodeCache.has(normalized)) return geocodeCache.get(normalized) ?? null

  try {
    const places = await searchPlaces(query.slice(0, 80))
    const hit = places[0]
    const coords = hit
      ? { latitude: hit.latitude, longitude: hit.longitude }
      : null
    geocodeCache.set(normalized, coords)
    return coords
  } catch {
    geocodeCache.set(normalized, null)
    return null
  }
}

function offsetAroundDestination(latitude: number, longitude: number, index: number) {
  const angle = ((index + 1) * 137.5 * Math.PI) / 180
  const radius = 0.006 + index * 0.0018
  return {
    latitude: latitude + Math.cos(angle) * radius,
    longitude: longitude + Math.sin(angle) * radius
  }
}

export async function resolveTripMapMarkers(
  trip: Trip | null,
  localPlaces: Record<string, TripDayItem[]>
): Promise<LeafletMapMarker[]> {
  if (!trip) return []

  const places = collectTripPlaces(trip, localPlaces)
  if (!places.length) return []

  const destination = trip.destination
  const country = trip.country
  const markers: LeafletMapMarker[] = []

  for (let index = 0; index < places.length; index += 1) {
    const place = places[index]!
    const query = [place.title, place.placeName, destination, country].filter(Boolean).join(', ')
    const coords = await geocodePlace(query)

    if (coords) {
      markers.push({
        id: place.id,
        title: place.title,
        latitude: coords.latitude,
        longitude: coords.longitude,
        order: index + 1,
        dayLabel: place.dayTitle ?? place.dayDate
      })
      continue
    }

    if (typeof trip.latitude === 'number' && typeof trip.longitude === 'number') {
      const offset = offsetAroundDestination(trip.latitude, trip.longitude, index)
      markers.push({
        id: place.id,
        title: place.title,
        latitude: offset.latitude,
        longitude: offset.longitude,
        order: index + 1,
        dayLabel: place.dayTitle ?? place.dayDate
      })
    }
  }

  return markers
}

export function filterMarkersForDay(markers: LeafletMapMarker[], dayPlaces: TripDayItem[]) {
  const ids = new Set(dayPlaces.map((place) => place.id))
  return markers.filter((marker) => ids.has(marker.id))
}
