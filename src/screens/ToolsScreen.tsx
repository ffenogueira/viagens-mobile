import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import * as Location from 'expo-location'
import React, { useState } from 'react'
import { Alert, ScrollView } from 'react-native'
import {
  Badge,
  BadgeText,
  Box,
  Button,
  ButtonSpinner,
  ButtonText,
  Card,
  HStack,
  Pressable,
  Text,
  VStack
} from '../../components/ui'
import { apiRequest } from '../api/client'
import { SectionTitle } from '../components/shared'
import { colors, gradients } from '../theme'
import type { Trip } from '../types/trip'

const fefaiPrompts = [
  'Reorganiza meu roteiro sem estourar o orçamento?',
  'Divide essa conta entre nós quatro.',
  'Quais fotos minhas apareceram nesse álbum?'
]

export function ToolsScreen({ selectedTrip }: { selectedTrip: Trip | null }) {
  const [busy, setBusy] = useState(false)
  const [activePrompt, setActivePrompt] = useState(fefaiPrompts[0])
  const [answer, setAnswer] = useState('')

  async function askFefai(prompt?: string) {
    const question = prompt || activePrompt
    if (!selectedTrip) {
      Alert.alert('Crie uma viagem primeiro', 'A FEFAI funciona melhor com destino, datas, orçamento e contexto do grupo.')
      return
    }
    setBusy(true)
    setActivePrompt(question)
    try {
      const data = await apiRequest<{ answer?: string; job?: unknown }>(
        `/trips/${selectedTrip.id}/ai/assistant`,
        {
          method: 'POST',
          body: JSON.stringify({ prompt: question })
        }
      )
      setAnswer(data.answer || 'FEFAI está analisando sua viagem. Consulte o status em instantes.')
    } catch (error) {
      Alert.alert('FEFAI indisponível', error instanceof Error ? error.message : 'Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  async function scanPrice() {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permissão de câmera', 'Autorize a câmera para ler preço e recibo.')
      return
    }
    const image = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: false })
    if (!image.canceled) {
      Alert.alert('Imagem capturada', 'Próximo passo: enviar para o pipeline OCR da API e converter a moeda.')
    }
  }

  async function shareLocation() {
    const permission = await Location.requestForegroundPermissionsAsync()
    if (permission.status !== 'granted') {
      Alert.alert('Permissão de localização', 'Autorize a localização para check-in e segurança do grupo.')
      return
    }
    const location = await Location.getCurrentPositionAsync({})
    Alert.alert(
      'Check-in pronto',
      `Lat: ${location.coords.latitude.toFixed(4)} | Lng: ${location.coords.longitude.toFixed(4)}`
    )
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
      <SectionTitle
        kicker="Diferencial"
        title="IA & Câmera nativa"
        subtitle="Ferramentas que só fazem sentido no app, com contexto da viagem."
      />

      <Box className="mb-4 overflow-hidden rounded-3xl shadow-soft-3">
        <LinearGradient
          colors={[...gradients.fefai]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 24 }}
        >
        <HStack className="mb-3 items-start justify-between">
          <VStack>
            <Text className="text-xs font-black uppercase tracking-wider text-white/75">FEFAI</Text>
            <Text className="mt-1 text-2xl font-black text-white">Copilota com contexto</Text>
          </VStack>
          <Box className="h-13 w-13 items-center justify-center rounded-2xl bg-white">
            <Ionicons color={colors.primary} name="sparkles" size={28} />
          </Box>
        </HStack>

        <Text className="mb-5 text-sm font-semibold leading-6 text-white/90">
          Sugere roteiro, explica escolhas, resume pendências e responde com dados reais da viagem — não respostas genéricas.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5" contentContainerClassName="gap-2">
          {fefaiPrompts.map((prompt) => {
            const active = activePrompt === prompt
            return (
              <Pressable
                key={prompt}
                className={`max-w-[260px] rounded-2xl border px-4 py-3 ${active ? 'border-white bg-white' : 'border-white/20 bg-white/15'}`}
                onPress={() => setActivePrompt(prompt)}
              >
                <Text className={`text-sm font-bold leading-5 ${active ? 'text-primary' : 'text-white/90'}`}>
                  "{prompt}"
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>

        <Button
          variant="outline"
          size="lg"
          className="h-12 rounded-2xl border-white bg-transparent data-[active=true]:bg-white/10"
          onPress={() => askFefai()}
          disabled={busy}
        >
          {busy ? (
            <ButtonSpinner color="white" />
          ) : (
            <ButtonText className="font-black text-white">
              {busy ? 'Processando...' : 'Perguntar à FEFAI'}
            </ButtonText>
          )}
        </Button>
        </LinearGradient>
      </Box>

      {answer ? (
        <Card className="mb-4 rounded-3xl border border-viagens-lilac-deep bg-viagens-lilac p-4">
          <HStack className="mb-2 items-center gap-2">
            <Ionicons color={colors.primaryDark} name="chatbubble-ellipses" size={18} />
            <Text className="text-sm font-black text-primary">Resposta da FEFAI</Text>
          </HStack>
          <Text className="text-sm font-semibold leading-6 text-primary">{answer}</Text>
        </Card>
      ) : null}

      <VStack className="gap-4">
        <ToolCard
          gradient={[colors.sky, '#0284C7'] as const}
          icon="scan"
          title="Câmera de preço e recibo"
          description="Captura cardápio, etiqueta ou recibo para OCR, conversão de moeda e divisão de gasto entre o grupo."
          tags={['OCR', 'Moeda', 'Split']}
          actionLabel="Abrir câmera"
          actionColor={colors.sky}
          onPress={scanPrice}
          borderClass="border-viagens-sky-soft"
        />

        <ToolCard
          gradient={gradients.mint}
          icon="location"
          title="Check-in com consentimento"
          description="Compartilha localização temporária com o grupo para segurança durante a viagem — só quando você autorizar."
          tags={['Privacidade', 'Grupo']}
          actionLabel="Fazer check-in"
          actionColor={colors.mint}
          onPress={shareLocation}
        />
      </VStack>
    </ScrollView>
  )
}

function ToolCard({
  gradient,
  icon,
  title,
  description,
  tags,
  actionLabel,
  actionColor,
  onPress,
  borderClass = 'border-border'
}: {
  gradient: readonly [string, string, ...string[]]
  icon: keyof typeof Ionicons.glyphMap
  title: string
  description: string
  tags: string[]
  actionLabel: string
  actionColor: string
  onPress: () => void
  borderClass?: string
}) {
  return (
    <Card className={`rounded-3xl border bg-card p-5 shadow-soft-2 ${borderClass}`}>
      <LinearGradient
        colors={gradient}
        style={{ width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
      >
        <Ionicons color="#FFFFFF" name={icon} size={32} />
      </LinearGradient>
      <Text className="text-xl font-black text-foreground">{title}</Text>
      <Text className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">{description}</Text>
      <HStack className="my-4 flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} className="rounded-full bg-muted px-3 py-1">
            <BadgeText className="text-[11px] font-extrabold text-muted-foreground">{tag}</BadgeText>
          </Badge>
        ))}
      </HStack>
      <Button
        variant="outline"
        size="lg"
        className="h-12 rounded-2xl"
        style={{ borderColor: actionColor }}
        onPress={onPress}
      >
        <ButtonText className="font-black" style={{ color: actionColor }}>
          {actionLabel}
        </ButtonText>
      </Button>
    </Card>
  )
}
