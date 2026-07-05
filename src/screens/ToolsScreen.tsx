import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { Alert, ScrollView } from 'react-native'
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
import { apiRequest } from '../api/client'
import { SectionTitle } from '../components/shared'
import { colors } from '../theme'
import type { Trip } from '../types/trip'

type ToolMode = 'fefai' | 'camera' | 'checkin'

const prompts = [
  'Reorganiza meu roteiro sem estourar o orçamento?',
  'Divide essa conta entre nós quatro.',
  'O que falta no checklist da viagem?'
]

export function ToolsScreen({
  selectedTrip,
  initialMode = 'fefai'
}: {
  selectedTrip: Trip | null
  initialMode?: ToolMode
}) {
  const [mode, setMode] = useState<ToolMode>(initialMode)
  const [busy, setBusy] = useState(false)
  const [question, setQuestion] = useState(prompts[0])
  const [answer, setAnswer] = useState('')

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  async function askFefai() {
    if (!selectedTrip) {
      Alert.alert('Crie uma viagem', 'A FEFAI precisa de uma viagem ativa para responder com contexto.')
      return
    }
    setBusy(true)
    setAnswer('')
    try {
      const data = await apiRequest<{ answer?: string }>(`/trips/${selectedTrip.id}/ai/assistant`, {
        method: 'POST',
        body: JSON.stringify({ prompt: question })
      })
      setAnswer(data.answer || 'Analisando sua viagem…')
    } catch (error) {
      Alert.alert('FEFAI indisponível', error instanceof Error ? error.message : 'Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  const tabs: Array<{ id: ToolMode; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { id: 'fefai', label: 'FEFAI', icon: 'sparkles' },
    { id: 'camera', label: 'Preço', icon: 'scan' },
    { id: 'checkin', label: 'Check-in', icon: 'location' }
  ]

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
      <SectionTitle
        kicker="Assistente"
        title="IA & ferramentas"
        subtitle="Escolha uma aba — menos texto, mais ação."
      />

      <HStack className="mb-5 rounded-full border border-[#E5E7EB] bg-white p-1">
        {tabs.map((tab) => {
          const active = mode === tab.id
          return (
            <Pressable
              key={tab.id}
              onPress={() => setMode(tab.id)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-full py-3 ${
                active ? 'bg-primary' : ''
              }`}
            >
              <Ionicons color={active ? '#FFF' : colors.muted} name={tab.icon} size={18} />
              <Text className={`text-xs font-black ${active ? 'text-white' : 'text-muted-foreground'}`}>
                {tab.label}
              </Text>
            </Pressable>
          )
        })}
      </HStack>

      {mode === 'fefai' && (
        <FefaiPanel
          selectedTrip={selectedTrip}
          question={question}
          answer={answer}
          busy={busy}
          onSelectQuestion={setQuestion}
          onAsk={askFefai}
        />
      )}
      {mode === 'camera' && <CameraPanel />}
      {mode === 'checkin' && <CheckinPanel selectedTrip={selectedTrip} />}
    </ScrollView>
  )
}

function FefaiPanel({
  selectedTrip,
  question,
  answer,
  busy,
  onSelectQuestion,
  onAsk
}: {
  selectedTrip: Trip | null
  question: string
  answer: string
  busy: boolean
  onSelectQuestion: (value: string) => void
  onAsk: () => void
}) {
  return (
    <VStack className="gap-4">
      <Box className="rounded-[28px] bg-viagens-lilac p-5">
        <Text className="text-xs font-black uppercase text-primary">Copilota da viagem</Text>
        <Text className="mt-2 text-[15px] font-semibold leading-6 text-primary">
          {selectedTrip
            ? `Contexto: ${selectedTrip.destination}${selectedTrip.country ? `, ${selectedTrip.country}` : ''}`
            : 'Crie uma viagem na aba Viagem para ativar respostas personalizadas.'}
        </Text>
      </Box>

      <VStack className="gap-2">
        {prompts.map((prompt) => (
          <Pressable
            key={prompt}
            onPress={() => onSelectQuestion(prompt)}
            className={`rounded-2xl border px-4 py-3 ${
              question === prompt ? 'border-primary bg-viagens-lilac' : 'border-[#EEF2FF] bg-white'
            }`}
          >
            <Text className="text-sm font-bold text-foreground">{prompt}</Text>
          </Pressable>
        ))}
      </VStack>

      <Button className="h-12 rounded-full bg-primary" onPress={onAsk} disabled={busy}>
        {busy ? <ButtonSpinner color="#FFF" /> : <ButtonText className="font-black text-white">Perguntar</ButtonText>}
      </Button>

      {answer ? (
        <Box className="rounded-2xl border border-[#EEF2FF] bg-white p-4">
          <Text className="text-xs font-black uppercase text-muted-foreground">Resposta</Text>
          <Text className="mt-2 text-sm font-semibold leading-6 text-foreground">{answer}</Text>
        </Box>
      ) : null}
    </VStack>
  )
}

function CameraPanel() {
  return (
    <VStack className="items-center rounded-[28px] border border-[#EEF2FF] bg-white px-5 py-8">
      <Box className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-viagens-sky-soft">
        <Ionicons color={colors.sky} name="scan" size={32} />
      </Box>
      <Text className="text-center text-xl font-black text-foreground">Ler preço na hora</Text>
      <Text className="mt-2 text-center text-sm font-semibold leading-6 text-muted-foreground">
        Aponte para uma placa, cardápio ou recibo. Em breve: leitura automática, conversão de moeda e lançamento nos gastos.
      </Text>
    </VStack>
  )
}

function CheckinPanel({ selectedTrip }: { selectedTrip: Trip | null }) {
  return (
    <VStack className="items-center rounded-[28px] border border-[#EEF2FF] bg-white px-5 py-8">
      <Box className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
        <Ionicons color={colors.mint} name="location" size={32} />
      </Box>
      <Text className="text-center text-xl font-black text-foreground">Check-in do grupo</Text>
      <Text className="mt-2 text-center text-sm font-semibold leading-6 text-muted-foreground">
        {selectedTrip
          ? 'Compartilhe localização temporária com quem viaja com você — só quando autorizar.'
          : 'Crie uma viagem para habilitar check-ins.'}
      </Text>
    </VStack>
  )
}
