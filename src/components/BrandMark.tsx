import React from 'react'
import { View } from 'react-native'
import { Box, HStack, Text, VStack } from '../../components/ui'

/** Mesma cor do logo no site (primary-500) */
const LOGO_PURPLE = '#a367ea'

type BrandMarkProps = {
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md'
  showTagline?: boolean
}

export function BrandMark({
  variant = 'dark',
  size = 'md',
  showTagline = true
}: BrandMarkProps) {
  const boxSize = size === 'sm' ? 36 : 48
  const radius = size === 'sm' ? 10 : 14
  const letterSize = size === 'sm' ? 18 : 24
  const titleSize = size === 'sm' ? 16 : 20
  const taglineSize = size === 'sm' ? 10 : 12

  const titleColor = variant === 'light' ? '#FFFFFF' : '#111827'
  const taglineColor = variant === 'light' ? 'rgba(255,255,255,0.78)' : '#9CA3AF'
  const lineColor = variant === 'light' ? 'rgba(255,255,255,0.45)' : '#D1D5DB'

  return (
    <HStack className="items-center gap-3">
      <View
        style={{
          width: boxSize,
          height: boxSize,
          borderRadius: radius,
          backgroundColor: LOGO_PURPLE,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: LOGO_PURPLE,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.28,
          shadowRadius: 8,
          elevation: 4
        }}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: letterSize,
            fontWeight: '800',
            lineHeight: letterSize + 2
          }}
        >
          V
        </Text>
      </View>

      <VStack className="justify-center">
        <Text
          style={{
            fontSize: titleSize,
            fontWeight: '800',
            color: titleColor,
            letterSpacing: -0.3
          }}
        >
          Viagens
        </Text>

        {showTagline && (
          <HStack className="mt-0.5 items-center gap-2">
            <Box style={{ width: 22, height: 1, backgroundColor: lineColor }} />
            <Text
              style={{
                fontSize: taglineSize,
                fontWeight: '500',
                color: taglineColor
              }}
            >
              by Up Your Idea
            </Text>
          </HStack>
        )}
      </VStack>
    </HStack>
  )
}
