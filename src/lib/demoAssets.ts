/** Imagens de preview/demo — URLs estáveis do Unsplash. */
export const DEMO_AVATAR_URI =
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=85&facepad=2'

export const COLOMBIA_COVER_URI =
  'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1400&q=80'

export const DEFAULT_TRIP_COVER =
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=85'

export function isColombiaDestination(destination?: string | null) {
  const value = destination?.toLowerCase() ?? ''
  return value.includes('colomb') || value.includes('colômb')
}

export function getTripCoverFallback(destination?: string | null) {
  return isColombiaDestination(destination) ? COLOMBIA_COVER_URI : DEFAULT_TRIP_COVER
}
