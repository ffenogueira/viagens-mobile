import React from 'react'
import type { LeafletMapMarker } from '../lib/buildLeafletMapHtml'
import { TripMapCanvas } from './TripMapCanvas'

type TripMapViewProps = {
  markers: LeafletMapMarker[]
  height?: number
  loading?: boolean
}

export function TripMapView({ markers, height = 140, loading = false }: TripMapViewProps) {
  return <TripMapCanvas markers={markers} height={height} loading={loading} />
}
