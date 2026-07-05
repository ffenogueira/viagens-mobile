import type { LeafletMapMarker } from './buildLeafletMapHtml'
import { buildMapTileUrl } from './mapTiles'

const TILE_SIZE = 256

export type OsmMapLayout = {
  width: number
  height: number
  zoom: number
  tiles: Array<{ key: string; url: string; left: number; top: number }>
  markerPoints: Array<{ id: string; order: number; x: number; y: number }>
  routePoints: string
}

function latLngToPixel(latitude: number, longitude: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom
  const x = ((longitude + 180) / 360) * scale
  const sinLat = Math.sin((latitude * Math.PI) / 180)
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale
  return { x, y }
}

function boundsForMarkers(markers: LeafletMapMarker[]) {
  let minLat = markers[0]!.latitude
  let maxLat = markers[0]!.latitude
  let minLng = markers[0]!.longitude
  let maxLng = markers[0]!.longitude

  for (const marker of markers) {
    minLat = Math.min(minLat, marker.latitude)
    maxLat = Math.max(maxLat, marker.latitude)
    minLng = Math.min(minLng, marker.longitude)
    maxLng = Math.max(maxLng, marker.longitude)
  }

  const padLat = Math.max((maxLat - minLat) * 0.18, 0.012)
  const padLng = Math.max((maxLng - minLng) * 0.18, 0.012)

  return {
    minLat: minLat - padLat,
    maxLat: maxLat + padLat,
    minLng: minLng - padLng,
    maxLng: maxLng + padLng
  }
}

function pickZoom(bounds: ReturnType<typeof boundsForMarkers>, width: number, height: number) {
  for (let zoom = 16; zoom >= 4; zoom -= 1) {
    const northWest = latLngToPixel(bounds.maxLat, bounds.minLng, zoom)
    const southEast = latLngToPixel(bounds.minLat, bounds.maxLng, zoom)
    if (southEast.x - northWest.x <= width && southEast.y - northWest.y <= height) {
      return zoom
    }
  }
  return 4
}

export function buildOsmMapLayout(
  markers: LeafletMapMarker[],
  width: number,
  height: number
): OsmMapLayout | null {
  if (!markers.length || width <= 0 || height <= 0) return null

  const bounds = boundsForMarkers(markers)
  const zoom = pickZoom(bounds, width, height)
  const northWest = latLngToPixel(bounds.maxLat, bounds.minLng, zoom)
  const southEast = latLngToPixel(bounds.minLat, bounds.maxLng, zoom)
  const spanX = southEast.x - northWest.x
  const spanY = southEast.y - northWest.y
  const originX = northWest.x - Math.max(0, (width - spanX) / 2)
  const originY = northWest.y - Math.max(0, (height - spanY) / 2)

  const startTileX = Math.floor(originX / TILE_SIZE)
  const startTileY = Math.floor(originY / TILE_SIZE)
  const endTileX = Math.floor((originX + width) / TILE_SIZE)
  const endTileY = Math.floor((originY + height) / TILE_SIZE)

  const tiles: OsmMapLayout['tiles'] = []
  for (let x = startTileX; x <= endTileX; x += 1) {
    for (let y = startTileY; y <= endTileY; y += 1) {
      tiles.push({
        key: `${zoom}-${x}-${y}`,
        url: buildMapTileUrl(zoom, x, y),
        left: x * TILE_SIZE - originX,
        top: y * TILE_SIZE - originY
      })
    }
  }

  const markerPoints = markers.map((marker) => {
    const pixel = latLngToPixel(marker.latitude, marker.longitude, zoom)
    return {
      id: marker.id,
      order: marker.order,
      x: pixel.x - originX,
      y: pixel.y - originY
    }
  })

  const routePoints = markerPoints.map((point) => `${point.x},${point.y}`).join(' ')

  return {
    width,
    height,
    zoom,
    tiles,
    markerPoints,
    routePoints
  }
}
