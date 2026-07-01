import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { ImageBackground, ScrollView, StyleSheet } from 'react-native'
import {
  Box,
  Button,
  ButtonSpinner,
  ButtonText,
  HStack,
  Pressable,
  Text,
  VStack
} from '../../components/ui'
import { colors, shadow, shadowStrong } from '../theme'
import type { Tab, Trip } from '../types/trip'

type TodayScreenProps = {
  selectedTrip: Trip | null
  trips: Trip[]
  loading: boolean
  onCreateTrip: () => void
  onNavigate: (tab: Tab) => void
}

type ExploreChip = {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  tab: Tab
}

type TravelCard = {
  title: string
  subtitle: string
  image: string
  icon: keyof typeof Ionicons.glyphMap
  tab: Tab
  accent: string
}

const absoluteFill = StyleSheet.absoluteFill

const exploreChips: ExploreChip[] = [
  { label: 'Planejar', icon: 'sparkles-outline', tab: 'tools' },
  { label: 'Escanear', icon: 'scan-outline', tab: 'tools' },
  { label: 'Grupo', icon: 'people-outline', tab: 'today' },
  { label: 'Memórias', icon: 'images-outline', tab: 'memories' }
]

const travelCards: TravelCard[] = [
  {
    title: 'FEFAI no roteiro',
    subtitle: 'Sugere, explica e adapta sem decidir por você.',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    icon: 'sparkles',
    tab: 'tools',
    accent: colors.primary
  },
  {
    title: 'Grupo no mesmo plano',
    subtitle: 'Chat, localização, check-ins e divisão de gastos.',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
    icon: 'people',
    tab: 'today',
    accent: colors.sky
  },
  {
    title: 'Fotos sem perder qualidade',
    subtitle: 'Álbum, timeline, mapa vivido e passaporte digital.',
    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=900&q=80',
    icon: 'images',
    tab: 'memories',
    accent: colors.mint
  }
]

const itinerary = [
  {
    title: 'Checar documentos',
    detail: 'Passaporte, seguro e reservas offline',
    icon: 'document-text-outline' as const,
    time: 'Pré'
  },
  {
    title: 'Converter conta pela câmera',
    detail: 'OCR de preço + moeda + divisão no grupo',
    icon: 'scan-outline' as const,
    time: 'Durante'
  },
  {
    title: 'Montar retrospectiva',
    detail: 'Fotos originais, mapa e diário da viagem',
    icon: 'sparkles-outline' as const,
    time: 'Pós'
  }
]

function formatDateRange(start?: string, end?: string) {
  if (!start) return 'Datas flexíveis'
  const startDate = new Date(start)
  const endDate = end ? new Date(end) : null
  const fmt = (date: Date) => date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  if (!endDate) return fmt(startDate)
  return `${fmt(startDate)} - ${fmt(endDate)}`
}

function getTripPhase(start?: string, end?: string): { label: string; color: string } {
  const now = Date.now()
  const startMs = start ? new Date(start).getTime() : null
  const endMs = end ? new Date(end).getTime() : null

  if (startMs && now < startMs) return { label: 'Antes da viagem', color: colors.sky }
  if (endMs && now > endMs) return { label: 'Depois da viagem', color: colors.mint }
  if (startMs && (!endMs || now <= endMs)) return { label: 'Durante a viagem', color: colors.orange }
  return { label: 'Planejamento', color: colors.primary }
}

export function TodayScreen({
  selectedTrip,
  trips,
  loading,
  onCreateTrip,
  onNavigate
}: TodayScreenProps) {
  const phase = getTripPhase(selectedTrip?.start_date, selectedTrip?.end_date)
  const destination = selectedTrip
    ? `${selectedTrip.destination}${selectedTrip.country ? `, ${selectedTrip.country}` : ''}`
    : 'Sua próxima viagem'

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
    >
      <HStack className="mb-4 items-center justify-between">
        <VStack>
          <Text className="text-[15px] font-bold text-muted-foreground">Olá, viajante</Text>
          <Text className="mt-1 text-[33px] font-black leading-[38px] text-foreground">
            Sua viagem{'\n'}em um só lugar
          </Text>
        </VStack>
        <Box className="h-[64px] w-[52px] items-center justify-center rounded-full bg-white shadow-soft-2">
          <Ionicons color={colors.primary} name="search" size={24} />
        </Box>
      </HStack>

      <HStack className="mb-5 items-center gap-3 rounded-full bg-white p-2 shadow-soft-1">
        <Box className="h-11 w-11 items-center justify-center rounded-full bg-viagens-lilac">
          <Ionicons color={colors.primary} name="sparkles" size={20} />
        </Box>
        <VStack className="flex-1">
          <Text className="text-[12px] font-bold uppercase text-muted-foreground">
            Pergunte para a FEFAI
          </Text>
          <Text className="text-[14px] font-black text-foreground" numberOfLines={1}>
            Planejar, converter, dividir ou guardar?
          </Text>
        </VStack>
        <Pressable
          onPress={() => onNavigate('tools')}
          className="h-11 w-11 items-center justify-center rounded-full bg-primary"
        >
          <Ionicons color={colors.white} name="arrow-forward" size={18} />
        </Pressable>
      </HStack>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-5"
        contentContainerStyle={{ gap: 10 }}
      >
        {exploreChips.map((chip, index) => {
          const active = index === 0
          return (
            <Pressable
              key={chip.label}
              onPress={() => onNavigate(chip.tab)}
              className={`flex-row items-center gap-2 rounded-full px-4 py-3 ${
                active ? 'bg-primary' : 'bg-white'
              }`}
              style={shadow}
            >
              <Ionicons
                color={active ? colors.white : colors.primary}
                name={chip.icon}
                size={16}
              />
              <Text
                className={`text-[13px] font-black ${
                  active ? 'text-white' : 'text-foreground'
                }`}
              >
                {chip.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <Box className="mb-6 overflow-hidden rounded-[32px] bg-white" style={shadowStrong}>
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=85'
          }}
          resizeMode="cover"
          style={{ height: 250 }}
        >
          <LinearGradient
            colors={['rgba(17,24,39,0.05)', 'rgba(17,24,39,0.18)', 'rgba(17,24,39,0.72)']}
            locations={[0, 0.42, 1]}
            style={absoluteFill}
          />
          <VStack className="flex-1 justify-end p-5">
            <HStack className="mb-3 items-center gap-2">
              <Box
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: phase.color }}
              />
              <Text className="text-[12px] font-black uppercase text-white/85">
                {phase.label}
              </Text>
            </HStack>

            <Text className="text-[32px] font-black leading-[38px] text-white">
              {destination}
            </Text>
            <Text className="mt-2 text-[14px] font-bold leading-5 text-white/86">
              {selectedTrip
                ? formatDateRange(selectedTrip.start_date, selectedTrip.end_date)
                : 'Crie um workspace vivo para roteiro, grupo, gastos, segurança e memórias.'}
            </Text>
          </VStack>
        </ImageBackground>

        <VStack className="p-5">
          <HStack className="mb-4 items-center justify-between">
            <InfoPill icon="calendar-outline" label={formatDateRange(selectedTrip?.start_date, selectedTrip?.end_date)} />
            <InfoPill icon="people-outline" label="Grupo pronto" />
            <InfoPill icon="wallet-outline" label={selectedTrip?.base_currency || 'BRL'} />
          </HStack>

          {!selectedTrip ? (
            <Button
              size="lg"
              className="h-14 rounded-full bg-primary data-[active=true]:bg-primary/90"
              onPress={onCreateTrip}
              disabled={loading}
            >
              {loading ? (
                <ButtonSpinner color="#FFFFFF" />
              ) : (
                <ButtonText className="text-base font-black text-white">
                  Criar viagem exemplo
                </ButtonText>
              )}
            </Button>
          ) : (
            <HStack className="gap-3">
              <Pressable
                onPress={() => onNavigate('tools')}
                className="h-12 flex-1 items-center justify-center rounded-full bg-primary"
              >
                <Text className="font-black text-white">Usar FEFAI</Text>
              </Pressable>
              <Pressable
                onPress={() => onNavigate('memories')}
                className="h-12 flex-1 items-center justify-center rounded-full bg-viagens-lilac"
              >
                <Text className="font-black text-primary">Memórias</Text>
              </Pressable>
            </HStack>
          )}
        </VStack>
      </Box>

      <HStack className="mb-3 items-center justify-between">
        <Text className="text-[20px] font-black text-foreground">O que resolver agora?</Text>
        <Pressable onPress={() => onNavigate('tools')}>
          <Text className="text-[13px] font-black text-primary">Ver tudo</Text>
        </Pressable>
      </HStack>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-6"
        contentContainerStyle={{ gap: 14 }}
      >
        {travelCards.map((card) => (
          <Pressable
            key={card.title}
            onPress={() => onNavigate(card.tab)}
            className="w-[214px] overflow-hidden rounded-[28px] bg-white"
            style={shadow}
          >
            <ImageBackground source={{ uri: card.image }} resizeMode="cover" style={{ height: 142 }}>
              <LinearGradient
                colors={['rgba(15,23,42,0.02)', 'rgba(15,23,42,0.55)']}
                style={absoluteFill}
              />
              <Box className="absolute right-3 top-3 h-11 w-11 items-center justify-center rounded-full bg-white/80">
                <Ionicons color={card.accent} name={card.icon} size={20} />
              </Box>
            </ImageBackground>
            <VStack className="p-4">
              <Text className="text-[17px] font-black text-foreground">{card.title}</Text>
              <Text className="mt-1 text-[12px] font-bold leading-5 text-muted-foreground">
                {card.subtitle}
              </Text>
            </VStack>
          </Pressable>
        ))}
      </ScrollView>

      <HStack className="mb-3 items-center justify-between">
        <Text className="text-[20px] font-black text-foreground">Próximas ações</Text>
        <Text className="text-[13px] font-black text-muted-foreground">{trips.length} viagens</Text>
      </HStack>

      <VStack className="gap-3">
        {itinerary.map((item) => (
          <HStack key={item.title} className="items-center gap-4 rounded-[28px] bg-white p-3" style={shadow}>
            <Box className="h-[86px] w-[86px] items-center justify-center rounded-[24px] bg-viagens-lilac">
              <Ionicons color={colors.primary} name={item.icon} size={30} />
            </Box>
            <VStack className="flex-1">
              <Text className="text-[11px] font-black uppercase text-primary">{item.time}</Text>
              <Text className="mt-1 text-[17px] font-black text-foreground">{item.title}</Text>
              <Text className="mt-1 text-[12px] font-bold leading-5 text-muted-foreground">
                {item.detail}
              </Text>
            </VStack>
            <Ionicons color={colors.mutedLight} name="chevron-forward" size={18} />
          </HStack>
        ))}
      </VStack>
    </ScrollView>
  )
}

function InfoPill({
  icon,
  label
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
}) {
  return (
    <HStack className="items-center gap-1.5 rounded-full bg-viagens-lilac px-3 py-2">
      <Ionicons color={colors.primary} name={icon} size={14} />
      <Text className="text-[11px] font-black text-foreground" numberOfLines={1}>
        {label}
      </Text>
    </HStack>
  )
}
