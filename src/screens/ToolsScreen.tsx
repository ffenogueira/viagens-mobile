import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useMemo, useState } from 'react'
import { Alert, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
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

export function ToolsScreen({
  selectedTrip,
  initialMode = 'fefai'
}: {
  selectedTrip: Trip | null
  initialMode?: ToolMode
}) {
  const { t } = useTranslation('tools')
  const [mode, setMode] = useState<ToolMode>(initialMode)
  const [busy, setBusy] = useState(false)
  const prompts = useMemo(() => [t('prompt1'), t('prompt2'), t('prompt3')], [t])
  const [question, setQuestion] = useState(prompts[0])
  const [answer, setAnswer] = useState('')

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    setQuestion(prompts[0])
  }, [prompts])

  async function askFefai() {
    if (!selectedTrip) {
      Alert.alert(t('needTripTitle'), t('needTripBody'))
      return
    }
    setBusy(true)
    setAnswer('')
    try {
      const data = await apiRequest<{ answer?: string }>(`/trips/${selectedTrip.id}/ai/assistant`, {
        method: 'POST',
        body: JSON.stringify({ prompt: question })
      })
      setAnswer(data.answer || t('analyzing'))
    } catch (error) {
      Alert.alert(t('unavailable'), error instanceof Error ? error.message : t('common:tryAgain'))
    } finally {
      setBusy(false)
    }
  }

  const tabs: Array<{ id: ToolMode; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { id: 'fefai', label: t('tabFefai'), icon: 'sparkles' },
    { id: 'camera', label: t('tabPrice'), icon: 'scan' },
    { id: 'checkin', label: t('tabCheckin'), icon: 'location' }
  ]

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
      <SectionTitle kicker={t('kicker')} title={t('title')} subtitle={t('subtitle')} />

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
          prompts={prompts}
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
  prompts,
  question,
  answer,
  busy,
  onSelectQuestion,
  onAsk
}: {
  selectedTrip: Trip | null
  prompts: string[]
  question: string
  answer: string
  busy: boolean
  onSelectQuestion: (value: string) => void
  onAsk: () => void
}) {
  const { t } = useTranslation('tools')
  return (
    <VStack className="gap-4">
      <Box className="rounded-[28px] bg-viagens-lilac p-5">
        <Text className="text-xs font-black uppercase text-primary">{t('tabFefai')}</Text>
        <Text className="mt-2 text-[15px] font-semibold leading-6 text-primary">
          {selectedTrip
            ? `${selectedTrip.destination}${selectedTrip.country ? `, ${selectedTrip.country}` : ''}`
            : t('needTripBody')}
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
        {busy ? <ButtonSpinner color="#FFF" /> : <ButtonText className="font-black text-white">{t('tabFefai')}</ButtonText>}
      </Button>

      {answer ? (
        <Box className="rounded-2xl border border-[#EEF2FF] bg-white p-4">
          <Text className="mt-2 text-sm font-semibold leading-6 text-foreground">{answer}</Text>
        </Box>
      ) : null}
    </VStack>
  )
}

function CameraPanel() {
  const { t } = useTranslation('tools')
  return (
    <VStack className="items-center rounded-[28px] border border-[#EEF2FF] bg-white px-5 py-8">
      <Box className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-viagens-sky-soft">
        <Ionicons color={colors.sky} name="scan" size={32} />
      </Box>
      <Text className="text-center text-xl font-black text-foreground">{t('tabPrice')}</Text>
      <Text className="mt-2 text-center text-sm font-semibold leading-6 text-muted-foreground">
        {t('subtitle')}
      </Text>
    </VStack>
  )
}

function CheckinPanel({ selectedTrip }: { selectedTrip: Trip | null }) {
  const { t } = useTranslation('tools')
  return (
    <VStack className="items-center rounded-[28px] border border-[#EEF2FF] bg-white px-5 py-8">
      <Box className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
        <Ionicons color={colors.mint} name="location" size={32} />
      </Box>
      <Text className="text-center text-xl font-black text-foreground">{t('tabCheckin')}</Text>
      <Text className="mt-2 text-center text-sm font-semibold leading-6 text-muted-foreground">
        {selectedTrip ? t('subtitle') : t('needTripBody')}
      </Text>
    </VStack>
  )
}
