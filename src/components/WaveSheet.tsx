import React from 'react'
import { View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

type WaveSheetProps = {
  width: number
  fill?: string
  height?: number
}

export function WaveSheet({ width, fill = '#FFFFFF', height = 48 }: WaveSheetProps) {
  const h = height
  const path = [
    `M0 ${h}`,
    `C ${width * 0.18} ${h * 0.72}`,
    `${width * 0.38} ${h * 0.08}`,
    `${width * 0.58} ${h * 0.58}`,
    `C ${width * 0.72} ${h * 0.96}`,
    `${width * 0.86} ${h * 0.34}`,
    `${width} ${h * 0.62}`,
    `L ${width} ${h}`,
    `L 0 ${h}`,
    'Z'
  ].join(' ')

  return (
    <View style={{ marginTop: -h + 4 }}>
      <Svg width={width} height={h} viewBox={`0 0 ${width} ${h}`}>
        <Path d={path} fill={fill} />
      </Svg>
    </View>
  )
}
