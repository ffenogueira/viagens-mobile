import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useMemo, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Box, HStack, Pressable, Text, VStack } from '../../components/ui'
import { BrandMark } from '../components/BrandMark'
import { colors } from '../theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const absoluteFill = StyleSheet.absoluteFill

type Slide = {
  id: string
  label: string
  title: string
  subtitle: string
  image: string
  icon: keyof typeof Ionicons.glyphMap
  benefits: Array<{
    icon: keyof typeof Ionicons.glyphMap
    text: string
  }>
}

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation('onboarding')
  const insets = useSafeAreaInsets()
  const listRef = useRef<Animated.FlatList<Slide>>(null)
  const scrollX = useRef(new Animated.Value(0)).current
  const [index, setIndex] = useState(0)

  const slides: Slide[] = useMemo(
    () => [
      {
        id: 'intent',
        label: t('slide1Label'),
        title: t('slide1Title'),
        subtitle: t('slide1Subtitle'),
        image:
          'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=88',
        icon: 'sparkles-outline',
        benefits: [
          { icon: 'map-outline', text: t('slide1Benefit1') },
          { icon: 'wallet-outline', text: t('slide1Benefit2') },
          { icon: 'document-text-outline', text: t('slide1Benefit3') }
        ]
      },
      {
        id: 'live',
        label: t('slide2Label'),
        title: t('slide2Title'),
        subtitle: t('slide2Subtitle'),
        image:
          'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=88',
        icon: 'people-outline',
        benefits: [
          { icon: 'location-outline', text: t('slide2Benefit1') },
          { icon: 'scan-outline', text: t('slide2Benefit2') },
          { icon: 'receipt-outline', text: t('slide2Benefit3') }
        ]
      },
      {
        id: 'memory',
        label: t('slide3Label'),
        title: t('slide3Title'),
        subtitle: t('slide3Subtitle'),
        image:
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=88',
        icon: 'images-outline',
        benefits: [
          { icon: 'images-outline', text: t('slide3Benefit1') },
          { icon: 'person-circle-outline', text: t('slide3Benefit2') },
          { icon: 'ribbon-outline', text: t('slide3Benefit3') }
        ]
      }
    ],
    [t]
  )

  function goNext() {
    if (index === slides.length - 1) {
      onComplete()
      return
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true })
  }

  function goPrev() {
    if (index === 0) return
    listRef.current?.scrollToIndex({ index: index - 1, animated: true })
  }

  function onScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH))
  }

  return (
    <Box className="flex-1 bg-[#111827]">
      <Animated.FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: true
        })}
        scrollEventThrottle={16}
        renderItem={({ item, index: slideIndex }) => (
          <SlideFrame item={item} index={slideIndex} scrollX={scrollX} />
        )}
      />

      <VStack
        className="absolute left-0 right-0 px-7"
        style={{ top: insets.top + 16 }}
      >
        <HStack className="mb-5 gap-2">
          {slides.map((slide, dotIndex) => (
            <Box
              key={slide.id}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/30"
            >
              <Box
                className="h-full rounded-full"
                style={{
                  width: dotIndex <= index ? '100%' : '0%',
                  backgroundColor: dotIndex === index ? colors.primary : 'rgba(255,255,255,0.75)'
                }}
              />
            </Box>
          ))}
        </HStack>

        <HStack className="items-center justify-between">
          <BrandMark variant="light" size="sm" />
          <Pressable onPress={onComplete} className="rounded-full bg-white/20 px-4 py-2">
            <Text className="text-[13px] font-black text-white">{t('skip')}</Text>
          </Pressable>
        </HStack>
      </VStack>

      <HStack
        className="absolute left-7 right-7 items-center justify-between"
        style={{ bottom: insets.bottom + 28 }}
      >
        <Pressable
          disabled={index === 0}
          onPress={goPrev}
          className="h-[58px] w-[58px] items-center justify-center rounded-full bg-white/18 data-[disabled=true]:opacity-30"
          style={styles.glassArrow}
        >
          <Ionicons color={colors.white} name="arrow-back" size={22} />
        </Pressable>

        <Pressable
          onPress={goNext}
          className="h-[58px] w-[58px] items-center justify-center rounded-full bg-white/20"
          style={styles.glassArrow}
        >
          <Ionicons color={colors.white} name="arrow-forward" size={22} />
        </Pressable>
      </HStack>
    </Box>
  )
}

const styles = StyleSheet.create({
  glassArrow: {
    borderColor: 'rgba(255,255,255,0.26)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10
  }
})

function SlideFrame({
  item,
  index,
  scrollX
}: {
  item: Slide
  index: number
  scrollX: Animated.Value
}) {
  const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH]
  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [1.08, 1, 1.08],
    extrapolate: 'clamp'
  })
  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.78, 1, 0.78],
    extrapolate: 'clamp'
  })

  return (
    <View style={{ width: SCREEN_WIDTH }}>
      <Animated.View style={{ flex: 1, opacity, transform: [{ scale }] }}>
        <ImageBackground source={{ uri: item.image }} resizeMode="cover" style={{ flex: 1 }}>
          <LinearGradient
            colors={[
              'rgba(15,23,42,0.05)',
              'rgba(15,23,42,0.18)',
              'rgba(15,23,42,0.70)',
              'rgba(15,23,42,0.92)'
            ]}
            locations={[0, 0.36, 0.72, 1]}
            style={absoluteFill}
          />
        </ImageBackground>
      </Animated.View>

      <VStack className="absolute bottom-[124px] left-7 right-7 items-center">
        <HStack className="mb-3 items-center gap-2 rounded-full bg-white/18 px-4 py-2">
          <Ionicons color={colors.white} name={item.icon} size={16} />
          <Text className="text-[12px] font-black uppercase text-white/90">{item.label}</Text>
        </HStack>

        <Text className="text-center text-[32px] font-black leading-[37px] text-white">
          {item.title}
        </Text>
        <Text
          className="mt-3 max-w-[322px] text-center text-[14px] font-bold leading-[22px]"
          style={{ color: 'rgba(255,255,255,0.82)' }}
        >
          {item.subtitle}
        </Text>

        <VStack className="mt-5 w-full gap-2 rounded-[24px] bg-white/14 p-3">
          {item.benefits.map((benefit) => (
            <HStack key={benefit.text} className="items-center gap-3 rounded-2xl bg-white/13 px-3 py-2">
              <Box className="h-8 w-8 items-center justify-center rounded-full bg-white/18">
                <Ionicons color={colors.white} name={benefit.icon} size={16} />
              </Box>
              <Text className="flex-1 text-[12px] font-black leading-4 text-white">
                {benefit.text}
              </Text>
            </HStack>
          ))}
        </VStack>
      </VStack>
    </View>
  )
}
