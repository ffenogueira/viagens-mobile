import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Share, TextInput } from 'react-native'
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
import { createTripInvite, fetchTrip, sendChatMessage } from '../api/client'
import { EmptyTripNotice, OverlayScreenLayout } from '../components/OverlayScreenLayout'
import { UserAvatar } from '../components/UserAvatar'
import { colors, shadow } from '../theme'
import type { ChatMessage, Trip, TripMember } from '../types/trip'

function memberRoleLabel(role?: string) {
  if (role === 'OWNER' || role === 'ORGANIZER') return 'Organizador'
  if (role === 'VIEWER') return 'Convidado'
  return 'Viajante'
}

export function GroupChatScreen({
  selectedTrip,
  onBack
}: {
  selectedTrip: Trip | null
  onBack: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [members, setMembers] = useState<TripMember[]>([])
  const [draft, setDraft] = useState('')

  async function loadTrip() {
    if (!selectedTrip) return
    setLoading(true)
    try {
      const trip = await fetchTrip(selectedTrip.id)
      setMessages(trip.messages ?? [])
      setMembers(trip.members ?? [])
    } catch (error) {
      Alert.alert('Chat indisponível', error instanceof Error ? error.message : 'Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTrip()
  }, [selectedTrip?.id])

  async function inviteFriends() {
    if (!selectedTrip) return
    setInviting(true)
    try {
      const token = await createTripInvite(selectedTrip.id)
      if (!token) {
        throw new Error('Não foi possível gerar o convite.')
      }
      const link = `https://viagens.upyouridea.com.br/app?invite=${token}`
      await Share.share({
        message: `Vem planejar ${selectedTrip.destination} comigo no Viagens! ${link}`,
        url: link
      })
    } catch (error) {
      Alert.alert('Convite', error instanceof Error ? error.message : 'Não foi possível compartilhar o convite.')
    } finally {
      setInviting(false)
    }
  }

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

  const membersCount = Math.max(members.length, 1)

  return (
    <OverlayScreenLayout
      title="Chat do grupo"
      subtitle={
        membersCount > 1
          ? `${membersCount} pessoas nesta viagem`
          : 'Convide amigos para combinar roteiro, gastos e avisos juntos.'
      }
      onBack={onBack}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} className="my-10" />
      ) : (
        <VStack className="gap-4">
          <Box className="rounded-[24px] border border-[#EEF2FF] bg-white p-4" style={shadow}>
            <HStack className="items-center justify-between">
              <VStack>
                <Text className="text-[11px] font-black uppercase tracking-[1.4px] text-muted-foreground">
                  Grupo da viagem
                </Text>
                <Text className="mt-1 text-[18px] font-black text-foreground">{selectedTrip.destination}</Text>
              </VStack>
              <Box className="rounded-full bg-viagens-lilac px-3 py-1.5">
                <Text className="text-[12px] font-black text-primary">{membersCount}</Text>
              </Box>
            </HStack>

            <VStack className="mt-4 gap-3">
              {members.length ? (
                members.map((member) => (
                  <HStack key={member.id} className="items-center gap-3">
                    <UserAvatar name={member.user.name} className="h-11 w-11" />
                    <VStack className="flex-1">
                      <Text className="text-[15px] font-black text-foreground">{member.user.name}</Text>
                      <Text className="text-[12px] font-semibold text-muted-foreground">
                        {memberRoleLabel(member.role)}
                      </Text>
                    </VStack>
                  </HStack>
                ))
              ) : (
                <Text className="text-[14px] font-semibold text-muted-foreground">
                  Você é o primeiro por aqui. Convide quem vai viajar com você.
                </Text>
              )}
            </VStack>

            <Pressable
              onPress={() => void inviteFriends()}
              disabled={inviting}
              className="mt-4 h-12 flex-row items-center justify-center gap-2 rounded-full bg-primary"
            >
              {inviting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons color={colors.white} name="person-add-outline" size={18} />
                  <Text className="text-[15px] font-black text-white">Convidar amigos</Text>
                </>
              )}
            </Pressable>

            <Text className="mt-3 text-center text-[12px] font-semibold leading-5 text-muted-foreground">
              Envie o link por WhatsApp, iMessage ou qualquer app. Quem abrir entra na viagem e no chat.
            </Text>
          </Box>

          <VStack className="gap-3">
            <Text className="text-[11px] font-black uppercase tracking-[1.4px] text-muted-foreground">
              Mensagens
            </Text>
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
