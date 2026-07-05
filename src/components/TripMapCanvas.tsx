import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Image, LayoutChangeEvent, StyleSheet, View } from 'react-native'
import Svg, { Circle, Polyline, Text as SvgText } from 'react-native-svg'
import type { LeafletMapMarker } from '../lib/buildLeafletMapHtml'
import { buildOsmMapLayout } from '../lib/osmMap'
import { colors } from '../theme'

type TripMapCanvasProps = {
  markers: LeafletMapMarker[]
  height: number
  loading?: boolean
}

export function TripMapCanvas({ markers, height, loading = false }: TripMapCanvasProps) {
  const [width, setWidth] = useState(0)
  const [failedTiles, setFailedTiles] = useState<Record<string, true>>({})

  const layout = useMemo(() => {
    if (!width) return null
    return buildOsmMapLayout(markers, width, height)
  }, [markers, width, height])

  function onLayout(event: LayoutChangeEvent) {
    const nextWidth = Math.round(event.nativeEvent.layout.width)
    if (nextWidth !== width) setWidth(nextWidth)
  }

  if (loading) {
    return (
      <View style={[styles.container, { height }]}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    )
  }

  return (
    <View style={[styles.container, { height }]} onLayout={onLayout}>
      {layout ? (
        <>
          {layout.tiles.map((tile) => {
            if (failedTiles[tile.key]) return null
            return (
              <Image
                key={tile.key}
                source={{ uri: tile.url }}
                style={{
                  position: 'absolute',
                  left: tile.left,
                  top: tile.top,
                  width: 256,
                  height: 256
                }}
                resizeMode="cover"
                onError={() => {
                  console.warn('[map-tile] image failed', tile.url)
                  setFailedTiles((current) => ({ ...current, [tile.key]: true }))
                }}
              />
            )
          })}

          <Svg width={layout.width} height={layout.height} style={StyleSheet.absoluteFill}>
            {layout.markerPoints.length > 1 ? (
              <Polyline
                points={layout.routePoints}
                stroke={colors.primary}
                strokeWidth={3}
                strokeDasharray="8,6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
                fill="none"
              />
            ) : null}

            {layout.markerPoints.map((point) => (
              <React.Fragment key={point.id}>
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={16}
                  fill={colors.primary}
                  stroke="#FFFFFF"
                  strokeWidth={3}
                />
                <SvgText
                  x={point.x}
                  y={point.y + 5}
                  fill="#FFFFFF"
                  fontSize={13}
                  fontWeight="800"
                  textAnchor="middle"
                >
                  {String(point.order)}
                </SvgText>
              </React.Fragment>
            ))}
          </Svg>
        </>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  }
})
