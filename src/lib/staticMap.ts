import type { LeafletMapMarker } from './buildLeafletMapHtml'

function centerOf(markers: LeafletMapMarker[]) {
  const latitude = markers.reduce((sum, marker) => sum + marker.latitude, 0) / markers.length
  const longitude = markers.reduce((sum, marker) => sum + marker.longitude, 0) / markers.length
  return { latitude, longitude }
}

function zoomFor(markers: LeafletMapMarker[]) {
  if (markers.length <= 1) return 13
  const lats = markers.map((marker) => marker.latitude)
  const lngs = markers.map((marker) => marker.longitude)
  const span = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs))
  if (span > 8) return 4
  if (span > 2) return 6
  if (span > 0.8) return 8
  if (span > 0.25) return 10
  return 12
}

export function buildStaticMapUrl(markers: LeafletMapMarker[], width = 640, height = 280) {
  if (!markers.length) return null

  const center = markers.length === 1 ? markers[0]! : centerOf(markers)
  const markerParam = markers.map((marker) => `${marker.latitude},${marker.longitude},red`).join('|')
  const url = new URL('https://staticmap.openstreetmap.de/staticmap.php')
  url.searchParams.set('center', `${center.latitude},${center.longitude}`)
  url.searchParams.set('zoom', String(zoomFor(markers)))
  url.searchParams.set('size', `${width}x${height}`)
  url.searchParams.set('markers', markerParam)
  return url.toString()
}

export function buildGoogleMapsUrl(markers: LeafletMapMarker[]) {
  if (!markers.length) return null
  if (markers.length === 1) {
    const marker = markers[0]!
    return `https://www.google.com/maps/search/?api=1&query=${marker.latitude},${marker.longitude}`
  }

  const origin = markers[0]!
  const destination = markers[markers.length - 1]!
  const waypoints = markers
    .slice(1, -1)
    .map((marker) => `${marker.latitude},${marker.longitude}`)
    .join('|')

  const url = new URL('https://www.google.com/maps/dir/?api=1')
  url.searchParams.set('origin', `${origin.latitude},${origin.longitude}`)
  url.searchParams.set('destination', `${destination.latitude},${destination.longitude}`)
  url.searchParams.set('travelmode', 'walking')
  if (waypoints) url.searchParams.set('waypoints', waypoints)
  return url.toString()
}
