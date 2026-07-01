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
import { colors, radius, shadowStrong } from '../theme'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const slideWidth = SCREEN_WIDTH
const absoluteFill = StyleSheet.absoluteFill

type Slide = {
  id: string
  badge: string
  title: string
  subtitle: string
  cta: string
  image: string
  icon: keyof typeof Ionicons.glyphMap
  chips: string[]
  accent: string
}

const slides: Slide[] = [
  {
    id: 'before',
    badge: 'Antes da viagem',
    title: 'A viagem começa quando você salva uma ideia.',
    subtitle:
      'Transforme vídeos, indicações e conversas com a FEFAI em um plano com datas, grupo, orçamento e documentos.',
    cta: 'Planejar minha viagem',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
    icon: 'sparkles-outline',
    chips: ['IA de roteiro', 'Checklist', 'Orçamento'],
    accent: colors.primary
  },
  {
    id: 'during',
    badge: 'Durante',
    title: 'Tudo que o grupo precisa no mesmo app.',
    subtitle:
      'Roteiro, chat, localização, check-ins, conversor, OCR de recibo e divisão de gastos sem bagunça no WhatsApp.',
    cta: 'Viajar com o grupo',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85',
    icon: 'people-outline',
    chips: ['Localização', 'Recibos', 'Chat'],
    accent: colors.sky
  },
  {
    id: 'after',
    badge: 'Depois',
    title: 'A viagem vira memória, guia e passaporte digital.',
    subtitle:
      'Fotos em qualidade original, mapa do caminho, diário, broches e retrospectiva para reviver ou compartilhar.',
    cta: 'Guardar minhas memórias',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85',
    icon: 'images-outline',
    chips: ['Álbum original', 'Timeline', 'Broches'],
    accent: colors.orange
  }
]

type OnboardingScreenProps = {
  onComplete: () => void
}

type SlideViewProps = {
  item: Slide
  index: number
  scrollX: Animated.Value
}

function SlideView({ item, index, scrollX }: SlideViewProps) {
  const inputRange = [
    (index - 1) * slideWidth,
    index * slideWidth,
    (index + 1) * slideWidth
  ]
  const imageScale = scrollX.interpolate({
    inputRange,
    outputRange: [1.08, 1, 1.08],
    extrapolate: 'clamp'
  })
  const cardTranslate = scrollX.interpolate({
    inputRange,
    outputRange: [28, 0, -28],
    extrapolate: 'clamp'
  })
  const cardOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.55, 1, 0.55],
    extrapolate: 'clamp'
  })

  return (
    <View style={{ width: slideWidth, paddingHorizontal: 22 }}>
      <Animated.View
        style={[
          {
            height: SCREEN_HEIGHT * 0.56,
            overflow: 'hidden',
            borderRadius: 36,
            backgroundColor: colors.lilacDeep,
            transform: [{ translateX: cardTranslate }],
            opacity: cardOpacity
          },
          shadowStrong
        ]}
      >
        <Animated.View style={{ flex: 1, transform: [{ scale: imageScale }] }}>
          <ImageBackground source={{ uri: item.image }} resizeMode="cover" style={{ flex: 1 }}>
            <LinearGradient
              colors={['rgba(15,23,42,0.10)', 'rgba(15,23,42,0.18)', 'rgba(15,23,42,0.66)']}
              locations={[0, 0.45, 1]}
              style={absoluteFill}
            />
          </ImageBackground>
        </Animated.View>

        <Box className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2">
          <HStack className="items-center gap-2">
            <Ionicons color={item.accent} name={item.icon} size={16} />
            <Text className="text-[12px] font-bold text-foreground">{item.badge}</Text>
          </HStack>
        </Box>

        <VStack className="absolute bottom-5 left-5 right-5 gap-3">
          <Text className="text-[31px] font-black leading-[37px] text-white">{item.title}</Text>
          <Text className="text-[15px] font-semibold leading-[22px] text-white/85">
            {item.subtitle}
          </Text>

          <HStack className="mt-1 flex-wrap gap-2">
            {item.chips.map((chip) => (
              <Box key={chip} className="rounded-full bg-white/18 px-3 py-1.5">
                <Text className="text-[12px] font-bold text-white">{chip}</Text>
              </Box>
            ))}
          </HStack>
        </VStack>
      </Animated.View>
    </View>
  )
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
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

  function onScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / slideWidth))
  }

  return (
    <Box className="flex-1 bg-[#FAF7FF]">
      <LinearGradient
        colors={['#FAF7FF', '#FFFFFF', '#ECFEFF']}
        locations={[0, 0.62, 1]}
        style={absoluteFill}
      />

      <HStack
        className="items-center justify-between px-6"
        style={{ paddingTop: insets.top + 14 }}
      >
        <BrandMark variant="dark" size="sm" />
        <Pressable
          onPress={onComplete}
          className="rounded-full border border-[#E9D5FF] bg-white/85 px-4 py-2"
        >
          <Text className="text-[13px] font-bold text-primary">Pular</Text>
        </Pressable>
      </HStack>

      <Animated.FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24 }}
        onMomentumScrollEnd={onScrollEnd}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: true
        })}
        scrollEventThrottle={16}
        renderItem={({ item, index: slideIndex }) => (
          <SlideView item={item} index={slideIndex} scrollX={scrollX} />
        )}
      />

      <VStack className="px-6" style={{ paddingBottom: insets.bottom + 18 }}>
        <HStack className="mb-5 items-center justify-center gap-2">
          {slides.map((slide, dotIndex) => (
            <Box
              key={slide.id}
              className="rounded-full"
              style={{
                height: 7,
                width: dotIndex === index ? 28 : 7,
                backgroundColor: dotIndex === index ? colors.primary : '#DDD6FE'
              }}
            />
          ))}
        </HStack>

        <Pressable
          onPress={goNext}
          className="h-[56px] overflow-hidden rounded-full active:opacity-90"
          style={shadowStrong}
        >
          <LinearGradient
            colors={[slides[index].accent, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.pill
            }}
          >
            <HStack className="items-center gap-2">
              <Text className="text-[16px] font-black text-white">
                {index === slides.length - 1 ? 'Entrar no app' : slides[index].cta}
              </Text>
              <Ionicons color={colors.white} name="arrow-forward" size={18} />
            </HStack>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={onComplete} className="mt-4 items-center py-2">
          <Text className="text-[14px] font-bold text-muted-foreground">Já tenho conta</Text>
        </Pressable>
      </VStack>
    </Box>
  )
}
