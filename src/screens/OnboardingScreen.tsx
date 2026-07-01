import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useRef, useState } from 'react'
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
import { Box, HStack, Pressable, Text, VStack } from '../../components/ui'
import { BrandMark } from '../components/BrandMark'
import { colors, shadowStrong } from '../theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const absoluteFill = StyleSheet.absoluteFill

type Slide = {
  id: string
  label: string
  title: string
  subtitle: string
  image: string
  icon: keyof typeof Ionicons.glyphMap
  chips: string[]
}

const slides: Slide[] = [
  {
    id: 'intent',
    label: '01 / Antes',
    title: 'Do print ao plano.',
    subtitle:
      'Viu um lugar e salvou? A FEFAI transforma a ideia em roteiro, orçamento e checklist sem você abrir cinco apps.',
    image:
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=88',
    icon: 'sparkles-outline',
    chips: ['Roteiro com IA', 'Orçamento', 'Documentos']
  },
  {
    id: 'live',
    label: '02 / Durante',
    title: 'Grupo alinhado na rua.',
    subtitle:
      'Roteiro, chat, localização, check-in, conversor e recibo por OCR ficam juntos. Menos caos, mais viagem.',
    image:
      'https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?auto=format&fit=crop&w=1400&q=88',
    icon: 'people-outline',
    chips: ['Grupo', 'Localização', 'Gastos']
  },
  {
    id: 'memory',
    label: '03 / Memória',
    title: 'Memória sem perder qualidade.',
    subtitle:
      'Fotos originais, busca por rosto, mapa vivido, broches e retrospectiva para guardar a viagem do jeito certo.',
    image:
      'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1400&q=88',
    icon: 'images-outline',
    chips: ['Fotos originais', 'Mapa vivido', 'Broches']
  }
]

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const insets = useSafeAreaInsets()
  const listRef = useRef<Animated.FlatList<Slide>>(null)
  const scrollX = useRef(new Animated.Value(0)).current
  const [index, setIndex] = useState(0)

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
            <Text className="text-[13px] font-black text-white">Pular</Text>
          </Pressable>
        </HStack>
      </VStack>

      <HStack
        className="absolute left-7 right-7 items-center justify-between"
        style={{ bottom: insets.bottom + 26 }}
      >
        <Pressable
          disabled={index === 0}
          onPress={goPrev}
          className="h-[56px] w-[56px] items-center justify-center rounded-full border border-white/25 bg-white/18 data-[disabled=true]:opacity-35"
        >
          <Ionicons color={colors.white} name="arrow-back" size={20} />
        </Pressable>

        <Pressable
          onPress={goNext}
          className="h-[58px] flex-1 items-center justify-center rounded-full bg-primary px-5 active:opacity-90"
          style={[shadowStrong, { marginHorizontal: 14 }]}
        >
          <Text className="text-[15px] font-black text-white">
            {index === slides.length - 1 ? 'Começar agora' : 'Ver próximo'}
          </Text>
        </Pressable>

        <Pressable
          onPress={goNext}
          className="h-[56px] w-[56px] items-center justify-center rounded-full bg-white"
          style={shadowStrong}
        >
          <Ionicons color={colors.primary} name="arrow-forward" size={20} />
        </Pressable>
      </HStack>
    </Box>
  )
}

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

      <VStack className="absolute bottom-[132px] left-7 right-7 items-center">
        <HStack className="mb-4 items-center gap-2 rounded-full bg-white/18 px-4 py-2">
          <Ionicons color={colors.white} name={item.icon} size={16} />
          <Text className="text-[12px] font-black uppercase text-white/90">{item.label}</Text>
        </HStack>

        <Text className="text-center text-[38px] font-black leading-[43px] text-white">
          {item.title}
        </Text>
        <Text
          className="mt-4 max-w-[310px] text-center text-[15px] font-bold leading-6"
          style={{ color: 'rgba(255,255,255,0.82)' }}
        >
          {item.subtitle}
        </Text>

        <HStack className="mt-5 flex-wrap justify-center gap-2">
          {item.chips.map((chip) => (
            <Box key={chip} className="rounded-full bg-white/18 px-3 py-1.5">
              <Text className="text-[12px] font-black text-white">{chip}</Text>
            </Box>
          ))}
        </HStack>
      </VStack>
    </View>
  )
}
