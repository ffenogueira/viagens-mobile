import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, TextInput } from 'react-native'
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
import { fetchTrip, sendChatMessage } from '../api/client'
import { EmptyTripNotice, OverlayScreenLayout } from '../components/OverlayScreenLayout'
import { colors, shadow } from '../theme'
import type { ChatMessage, Trip } from '../types/trip'

export function GroupChatScreen({
  selectedTrip,
  onBack
}: {
  selectedTrip: Trip | null
  onBack: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [membersCount, setMembersCount] = useState(1)
  const [draft, setDraft] = useState('')

  async function loadTrip() {
    if (!selectedTrip) return
    setLoading(true)
    try {
      const trip = await fetchTrip(selectedTrip.id)
      setMessages(trip.messages ?? [])
      setMembersCount(Math.max(trip.members?.length ?? 1, 1))
    } catch (error) {
      Alert.alert('Chat indisponível', error instanceof Error ? error.message : 'Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTrip()
  }, [selectedTrip?.id])

  async function submitMessage() {
    if (!selectedTrip || !draft.trim()) return
    setSending(true)
    try {
      const message = await sendChatMessage(selectedTrip.id, draft.trim())
      setMessages((current) => [...current, message])
      setDraft('')
    } catch (error) {
      Alert.alert('Mensagem não enviada', error instanceof Error ? error.message : 'Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  if (!selectedTrip) {
    return <EmptyTripNotice onBack={onBack} />
  }

  return (
    <OverlayScreenLayout
      title="Chat do grupo"
      subtitle={
        membersCount > 1
          ? `${membersCount} pessoas nesta viagem`
          : 'Convide amigos para combinar tudo no mesmo lugar.'
      }
      onBack={onBack}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} className="my-10" />
      ) : (
        <VStack className="gap-4">
          {membersCount <= 1 ? (
            <Box className="rounded-[24px] border border-[#EDE9FE] bg-viagens-lilac p-4">
              <Text className="text-[14px] font-semibold leading-6 text-primary">
                Você ainda está solo nesta viagem. Use “Convidar amigos” na home para abrir o chat em grupo.
              </Text>
            </Box>
          ) : null}

          <VStack className="gap-3">
            {messages.length === 0 ? (
              <Text className="text-sm font-semibold text-muted-foreground">
                Nenhuma mensagem ainda. Combine horários, dicas e avisos aqui.
              </Text>
            ) : (
              messages.map((message) => (
                <Box key={message.id} className="rounded-[22px] border border-[#EEF2FF] bg-white p-4" style={shadow}>
                  <Text className="text-[12px] font-black text-primary">{message.user.name}</Text>
                  <Text className="mt-1 text-[15px] font-semibold leading-6 text-foreground">{message.body}</Text>
                  <Text className="mt-2 text-[11px] font-semibold text-muted-foreground">
                    {new Date(message.createdAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </Box>
              ))
            )}
          </VStack>

          <Box className="rounded-[24px] border border-[#EEF2FF] bg-white p-4" style={shadow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Aviso, dica ou combinado do grupo"
              placeholderTextColor={colors.muted}
              multiline
              className="min-h-[88px] text-[15px] font-semibold text-foreground"
            />
            <Button className="mt-3 h-12 rounded-full bg-primary" onPress={submitMessage} disabled={sending}>
              {sending ? <ButtonSpinner color="#FFF" /> : <ButtonText className="font-black text-white">Enviar</ButtonText>}
            </Button>
          </Box>
        </VStack>
      )}
    </OverlayScreenLayout>
  )
}
