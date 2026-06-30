import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { ScrollView } from 'react-native'
import {
  Badge,
  BadgeText,
  Box,
  HStack,
  Text,
  VStack
} from '../../components/ui'
import { FeatureRow, SectionTitle } from '../components/shared'
import { colors, gradients } from '../theme'
import type { Trip } from '../types/trip'

const memoryFeatures = [
  {
    icon: 'cloud-upload-outline' as const,
    color: colors.primary,
    title: 'Álbum original',
    description: 'Fotos sem perder qualidade no envio — qualidade de arquivo, não thumbnail.',
    badge: 'Qualidade'
  },
  {
    icon: 'person-circle-outline' as const,
    color: colors.sky,
    title: 'Encontrar fotos comigo',
    description: 'Busca visual com consentimento para achar em quais fotos a pessoa aparece.',
    badge: 'IA'
  },
  {
    icon: 'earth-outline' as const,
    color: colors.mint,
    title: 'Passaporte digital',
    description: 'Broches, mapa vivido e histórico por estado e país visitado.',
    badge: 'Gamificação'
  },
  {
    icon: 'time-outline' as const,
    color: colors.orange,
    title: 'Linha do tempo',
    description: 'Depois da viagem, veja por onde passou e o que viveu em ordem cronológica.',
    badge: 'Retrospectiva'
  },
  {
    icon: 'book-outline' as const,
    color: colors.primaryDark,
    title: 'Diário de viagem',
    description: 'Notas, momentos e roteiro vivido transformados em memória organizada.',
    badge: 'Journal'
  },
  {
    icon: 'share-social-outline' as const,
    color: '#6366F1',
    title: 'Guia compartilhável',
    description: 'Exporte o roteiro vivido para compartilhar com quem vem depois.',
    badge: 'Social'
  }
]

export function MemoriesScreen({ selectedTrip }: { selectedTrip: Trip | null }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
      <Box className="mb-6 overflow-hidden rounded-3xl border border-viagens-lilac-deep shadow-soft-2">
        <LinearGradient colors={[...gradients.heroSoft]} style={{ padding: 24 }}>
          <HStack className="mb-4 items-center justify-between">
            <Box className="h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-soft-1">
              <Ionicons color={colors.primary} name="images" size={28} />
            </Box>
            <Badge className="rounded-full bg-white px-3 py-2">
              <BadgeText className="text-xs font-black text-primary">Pós-viagem</BadgeText>
            </Badge>
          </HStack>

          <Text className="text-2xl font-black leading-8 text-foreground">
            {selectedTrip ? 'Transforme a viagem em ativo' : 'Memórias prontas para sua próxima viagem'}
          </Text>
          <Text className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
            Álbum, diário, retrospectiva, roteiro vivido e guia compartilhável — tudo que o grupo viveu, guardado.
          </Text>

          {selectedTrip && (
            <HStack className="mt-4 gap-3">
              <StatPill icon="image-outline" value={String(selectedTrip.photos?.length || 0)} label="Fotos" />
              <StatPill icon="location-outline" value={selectedTrip.destination} label="Destino" />
            </HStack>
          )}
        </LinearGradient>
      </Box>

      <SectionTitle
        kicker="Diferenciais"
        title="Memórias que valem a pena"
        subtitle="Funcionalidades pensadas para depois da viagem, não só durante."
      />

      <VStack className="mb-6 gap-3">
        {memoryFeatures.map((feature) => (
          <FeatureRow key={feature.title} {...feature} />
        ))}
      </VStack>

      <HStack className="items-center gap-4 overflow-hidden rounded-3xl shadow-soft-2">
        <LinearGradient
          colors={[...gradients.fefai]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20 }}
        >
          <Ionicons color="#FFFFFF" name="sparkles" size={24} />
          <VStack className="flex-1">
            <Text className="font-black text-white">Retrospectiva com FEFAI</Text>
            <Text className="mt-1 text-sm font-semibold leading-5 text-white/85">
              Em breve: resumo automático da viagem com highlights e sugestões de álbum.
            </Text>
          </VStack>
        </LinearGradient>
      </HStack>
    </ScrollView>
  )
}

function StatPill({
  icon,
  value,
  label
}: {
  icon: keyof typeof Ionicons.glyphMap
  value: string
  label: string
}) {
  return (
    <HStack className="flex-1 items-center gap-2 rounded-2xl bg-white p-3 shadow-soft-1">
      <Ionicons color={colors.primary} name={icon} size={16} />
      <VStack>
        <Text className="text-sm font-black text-foreground" numberOfLines={1}>
          {value}
        </Text>
        <Text className="text-[11px] font-bold text-muted-foreground">{label}</Text>
      </VStack>
    </HStack>
  )
}
