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
import { colors, shadow } from '../theme'

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

const slides: Slide[] = [
  {
    id: 'intent',
    label: '01 / Antes',
    title: 'Planeje sem travar.',
    subtitle:
      'Salvou um destino, viu um vídeo ou recebeu uma dica? O app transforma essa vontade em um plano simples de seguir.',
    image:
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=88',
    icon: 'sparkles-outline',
    benefits: [
      { icon: 'map-outline', text: 'Roteiro por dia, com ajuda da FEFAI' },
      { icon: 'wallet-outline', text: 'Orçamento estimado antes de comprar' },
      { icon: 'document-text-outline', text: 'Checklist de documentos e reservas' }
    ]
  },
  {
    id: 'live',
    label: '02 / Durante',
    title: 'Viaje com o grupo no controle.',
    subtitle:
      'Na hora da viagem, todo mundo vê o plano, divide contas, combina pontos de encontro e evita perder informação no chat.',
    image:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=88',
    icon: 'people-outline',
    benefits: [
      { icon: 'location-outline', text: 'Check-in e localização com consentimento' },
      { icon: 'scan-outline', text: 'Câmera lê preço, recibo e converte moeda' },
      { icon: 'receipt-outline', text: 'Gastos entram no grupo e dividem automático' }
    ]
  },
  {
    id: 'memory',
    label: '03 / Memória',
    title: 'Depois, a viagem continua viva.',
    subtitle:
      'As fotos, lugares, gastos e histórias viram um álbum organizado para guardar, rever e compartilhar sem perder qualidade.',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=88',
    icon: 'images-outline',
    benefits: [
      { icon: 'images-outline', text: 'Álbum do grupo em qualidade original' },
      { icon: 'person-circle-outline', text: 'Buscar fotos onde você aparece' },
      { icon: 'ribbon-outline', text: 'Mapa vivido, retrospectiva e broches' }
    ]
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
        className="absolute left-7 right-7 items-center justify-between rounded-full border border-white/16 bg-white/12 p-1.5"
        style={{ bottom: insets.bottom + 24 }}
      >
        <Pressable
          disabled={index === 0}
          onPress={goPrev}
          className="h-[46px] w-[46px] items-center justify-center rounded-full bg-white/10 data-[disabled=true]:opacity-30"
        >
          <Ionicons color={colors.white} name="arrow-back" size={18} />
        </Pressable>

        <Pressable
          onPress={goNext}
          className={`h-[46px] flex-1 items-center justify-center rounded-full px-5 active:opacity-90 ${
            index === slides.length - 1 ? 'bg-primary' : 'bg-white'
          }`}
          style={[{ marginHorizontal: 8 }, index === slides.length - 1 ? shadow : null]}
        >
          <Text
            className={`text-[14px] font-black ${
              index === slides.length - 1 ? 'text-white' : 'text-primary'
            }`}
          >
            {index === slides.length - 1 ? 'Entrar no app' : 'Próximo'}
          </Text>
        </Pressable>

        <Pressable
          onPress={goNext}
          className="h-[46px] w-[46px] items-center justify-center rounded-full bg-white/90"
        >
          <Ionicons color={colors.primary} name="arrow-forward" size={18} />
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
