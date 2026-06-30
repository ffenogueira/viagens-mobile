import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { ScrollView } from 'react-native'
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
import { FeatureRow, MetricTile, QuickAction, SectionTitle } from '../components/shared'
import { gradients } from '../theme'
import type { Tab, Trip } from '../types/trip'

type TodayScreenProps = {
  selectedTrip: Trip | null
  trips: Trip[]
  loading: boolean
  onCreateTrip: () => void
  onNavigate: (tab: Tab) => void
}

function formatDateRange(start?: string, end?: string) {
  if (!start) return 'Datas a definir'
  const startDate = new Date(start)
  const endDate = end ? new Date(end) : null
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  if (!endDate) return fmt(startDate)
  return `${fmt(startDate)} – ${fmt(endDate)}`
}

function getTripPhase(start?: string, end?: string): { label: string; color: string } {
  const now = Date.now()
  const startMs = start ? new Date(start).getTime() : null
  const endMs = end ? new Date(end).getTime() : null

  if (startMs && now < startMs) return { label: 'Antes da viagem', color: '#0EA5E9' }
  if (endMs && now > endMs) return { label: 'Depois da viagem', color: '#10B981' }
  if (startMs && (!endMs || now <= endMs)) return { label: 'Durante a viagem', color: '#F97316' }
  return { label: 'Planejamento', color: '#7B4DFF' }
}

const steps = [
  { step: '01', title: 'Comece por uma ideia', desc: 'Destino, inspiração ou tipo de viagem com ajuda da FEFAI.', color: '#7B4DFF' },
  { step: '02', title: 'Organize com o grupo', desc: 'Roteiro, checklist, gastos e check-ins no mesmo espaço.', color: '#0EA5E9' },
  { step: '03', title: 'Guarde a memória', desc: 'Fotos originais, timeline e passaporte digital.', color: '#10B981' }
]

export function TodayScreen({ selectedTrip, trips, loading, onCreateTrip, onNavigate }: TodayScreenProps) {
  const phase = getTripPhase(selectedTrip?.start_date, selectedTrip?.end_date)
  const destination = selectedTrip
    ? `${selectedTrip.destination}${selectedTrip.country ? `, ${selectedTrip.country}` : ''}`
    : null

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
      <Text className="mb-5 text-3xl font-black leading-10 text-foreground">
        Vamos planejar{'\n'}sua viagem ✈️
      </Text>

      <Box className="mb-6 overflow-hidden rounded-3xl shadow-soft-3">
        <LinearGradient
          colors={[...gradients.hero]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 24 }}
        >
        <HStack className="mb-4 items-center justify-between">
          <HStack className="items-center gap-2 rounded-full bg-white/20 px-3 py-2">
            <Box className="h-2 w-2 rounded-full" style={{ backgroundColor: phase.color }} />
            <Text className="text-xs font-extrabold text-white">{phase.label}</Text>
          </HStack>
          {selectedTrip?.base_currency && (
            <Box className="rounded-full bg-white/20 px-3 py-2">
              <Text className="text-xs font-black text-white">{selectedTrip.base_currency}</Text>
            </Box>
          )}
        </HStack>

        <Text className="text-3xl font-black leading-9 text-white">
          {destination || 'Crie sua primeira viagem'}
        </Text>
        <Text className="mb-5 mt-2 text-sm font-semibold leading-6 text-white/85">
          {selectedTrip
            ? formatDateRange(selectedTrip.start_date, selectedTrip.end_date)
            : 'Roteiro, grupo, gastos e memórias em um só lugar.'}
        </Text>

        {!selectedTrip && (
          <Button
            size="lg"
            className="h-14 rounded-2xl bg-white data-[active=true]:bg-white/90"
            onPress={onCreateTrip}
            disabled={loading}
          >
            {loading ? (
              <ButtonSpinner color="#7B4DFF" />
            ) : (
              <>
                <Ionicons color="#7B4DFF" name="add-circle-outline" size={18} />
                <ButtonText className="text-base font-black text-primary">Criar viagem exemplo</ButtonText>
              </>
            )}
          </Button>
        )}
        </LinearGradient>
      </Box>

      <SectionTitle
        kicker="Acesso rápido"
        title="Ferramentas nativas"
        subtitle="O que torna o app diferente do WhatsApp + planilha."
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6" contentContainerClassName="gap-4">
        <QuickAction color="#7B4DFF" icon="sparkles" label="FEFAI" onPress={() => onNavigate('tools')} />
        <QuickAction color="#0EA5E9" icon="scan" label="Câmera OCR" onPress={() => onNavigate('tools')} />
        <QuickAction color="#10B981" icon="location" label="Check-in" onPress={() => onNavigate('tools')} />
        <QuickAction color="#F97316" icon="receipt" label="Gastos" onPress={() => onNavigate('tools')} />
        <QuickAction color="#5E35D9" icon="images" label="Memórias" onPress={() => onNavigate('memories')} />
      </ScrollView>

      <SectionTitle kicker="Resumo" title="Seu workspace" />

      <HStack className="mb-6 flex-wrap gap-3">
        <MetricTile
          color="#7B4DFF"
          icon="checkbox-outline"
          label="Checklist"
          value={String(selectedTrip?.checklist_items?.length || 0)}
          bgClass="bg-viagens-lilac"
        />
        <MetricTile
          color="#0EA5E9"
          icon="receipt-outline"
          label="Gastos"
          value={String(selectedTrip?.expenses?.length || 0)}
          bgClass="bg-viagens-sky-soft"
        />
        <MetricTile
          color="#10B981"
          icon="image-outline"
          label="Fotos"
          value={String(selectedTrip?.photos?.length || 0)}
          bgClass="bg-viagens-mint-soft"
        />
        <MetricTile
          color="#F97316"
          icon="airplane-outline"
          label="Viagens"
          value={String(trips.length)}
          bgClass="bg-viagens-orange-soft"
        />
      </HStack>

      <Text className="mb-3 text-lg font-black text-foreground">Fluxo da viagem</Text>
      <VStack className="gap-3">
        {steps.map((item) => (
          <HStack key={item.step} className="items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft-1">
            <Box className="h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: item.color }}>
              <Text className="text-sm font-black text-white">{item.step}</Text>
            </Box>
            <VStack className="flex-1">
              <Text className="font-black text-foreground">{item.title}</Text>
              <Text className="mt-0.5 text-sm font-semibold leading-5 text-muted-foreground">{item.desc}</Text>
            </VStack>
            <Ionicons color="#94A3B8" name="chevron-forward" size={18} />
          </HStack>
        ))}
      </VStack>
    </ScrollView>
  )
}
