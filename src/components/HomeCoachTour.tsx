import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useMemo, useState, type RefObject } from 'react'
import { Modal, Platform, StatusBar, StyleSheet, useWindowDimensions, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import Svg, { Defs, Mask, Rect } from 'react-native-svg'
import { Box, HStack, Pressable, Text, VStack } from '../../components/ui'
import { colors, shadowStrong } from '../theme'

export type HomeTourTarget = 'create' | 'utilities' | 'memories'

export type HomeTourTargetRefs = Record<HomeTourTarget, RefObject<View | null>>

type TargetFrame = {
  x: number
  y: number
  width: number
  height: number
}

type HomeCoachTourProps = {
  visible: boolean
  targets: HomeTourTargetRefs
  onClose: () => void
}

const highlightPadding = 7

export function HomeCoachTour({
  visible,
  targets,
  onClose
}: HomeCoachTourProps) {
  const { t } = useTranslation('onboarding')
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const [stepIndex, setStepIndex] = useState(0)
  const [frame, setFrame] = useState<TargetFrame | null>(null)

  const steps = useMemo(
    () => [
      {
        target: 'create' as const,
        icon: 'add-circle-outline' as const,
        title: t('tourCreateTitle'),
        description: t('tourCreateBody')
      },
      {
        target: 'utilities' as const,
        icon: 'grid-outline' as const,
        title: t('tourUtilitiesTitle'),
        description: t('tourUtilitiesBody')
      },
      {
        target: 'memories' as const,
        icon: 'images-outline' as const,
        title: t('tourMemoriesTitle'),
        description: t('tourMemoriesBody')
      }
    ],
    [t]
  )

  const step = steps[stepIndex]

  useEffect(() => {
    if (!visible) {
      setStepIndex(0)
      setFrame(null)
      return
    }

    let cancelled = false
    const timeout = setTimeout(() => {
      targets[step.target].current?.measureInWindow((x, y, width, height) => {
        if (!cancelled) {
          const statusBarOffset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0
          setFrame({ x, y: y + statusBarOffset, width, height })
        }
      })
    }, 140)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [visible, step.target, targets, windowWidth, windowHeight])

  function next() {
    if (stepIndex < steps.length - 1) {
      setFrame(null)
      setStepIndex((current) => current + 1)
      return
    }
    onClose()
  }

  if (!visible) return null

  const paddedFrame = frame
    ? {
        x: Math.max(frame.x - highlightPadding, 0),
        y: Math.max(frame.y - highlightPadding, 0),
        width: Math.min(frame.width + highlightPadding * 2, windowWidth),
        height: frame.height + highlightPadding * 2
      }
    : null

  const placeAbove = paddedFrame ? paddedFrame.y > windowHeight / 2 : true
  const bubbleEdge = paddedFrame
    ? placeAbove
      ? Math.max(windowHeight - paddedFrame.y + 16, 118)
      : paddedFrame.y + paddedFrame.height + 16
    : 150
  const pointerLeft = paddedFrame
    ? Math.min(
        Math.max(paddedFrame.x + paddedFrame.width / 2 - 29, 22),
        windowWidth - 66
      )
    : windowWidth / 2 - 20

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        {paddedFrame ? (
          <>
            <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
              <Defs>
                <Mask id="tour-spotlight">
                  <Rect width={windowWidth} height={windowHeight} fill="#FFFFFF" />
                  <Rect
                    x={paddedFrame.x}
                    y={paddedFrame.y}
                    width={paddedFrame.width}
                    height={paddedFrame.height}
                    rx={paddedFrame.height / 2}
                    fill="#000000"
                  />
                </Mask>
              </Defs>
              <Rect
                width={windowWidth}
                height={windowHeight}
                fill="rgba(15, 23, 42, 0.64)"
                mask="url(#tour-spotlight)"
              />
            </Svg>
            <View
              pointerEvents="none"
              style={[
                styles.highlight,
                {
                  left: paddedFrame.x,
                  top: paddedFrame.y,
                  width: paddedFrame.width,
                  height: paddedFrame.height
                }
              ]}
            />
          </>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.scrim]} />
        )}

        <View
          pointerEvents="none"
          style={[
            styles.pointer,
            {
              left: pointerLeft,
              ...(placeAbove ? { bottom: bubbleEdge - 9 } : { top: bubbleEdge - 9 })
            }
          ]}
        />

        <Box
          className="absolute left-5 right-5 rounded-[24px] bg-white px-5 py-4"
          style={[shadowStrong, placeAbove ? { bottom: bubbleEdge } : { top: bubbleEdge }]}
        >
          <HStack className="items-start gap-3">
            <Box className="h-10 w-10 items-center justify-center rounded-2xl bg-viagens-lilac">
              <Ionicons color={colors.primary} name={step.icon} size={21} />
            </Box>
            <VStack className="flex-1 pr-1">
              <Text className="text-[11px] font-black uppercase tracking-[1px] text-primary">
                {t('tourProgress', { current: stepIndex + 1, total: steps.length })}
              </Text>
              <Text className="mt-1 text-[18px] font-black leading-6 text-foreground">
                {step.title}
              </Text>
              <Text className="mt-1.5 text-[13px] font-semibold leading-5 text-muted-foreground">
                {step.description}
              </Text>
            </VStack>
          </HStack>

          <HStack className="mt-4 items-center justify-between">
            <Pressable onPress={onClose} className="py-2 pr-4">
              <Text className="text-[13px] font-black text-muted-foreground">{t('tourSkip')}</Text>
            </Pressable>
            <Pressable onPress={next} className="rounded-full bg-primary px-5 py-3">
              <HStack className="items-center gap-2">
                <Text className="text-[13px] font-black text-white">
                  {stepIndex === steps.length - 1 ? t('tourFinish') : t('tourNext')}
                </Text>
                <Ionicons color={colors.white} name="arrow-forward" size={16} />
              </HStack>
            </Pressable>
          </HStack>
        </Box>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 23, 42, 0.64)'
  },
  highlight: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 999,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8
  },
  pointer: {
    position: 'absolute',
    width: 18,
    height: 18,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    borderRadius: 3
  }
})
