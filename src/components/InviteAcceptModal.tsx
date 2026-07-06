import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Modal } from 'react-native'
import { acceptTripInvite, fetchInvitePreview } from '../api/client'
import { memberRoleLabel } from '../lib/tripInvite'
import { colors } from '../theme'
import type { TripInvitePreview } from '../types/trip'
import { Box, HStack, Pressable, Text, VStack } from '../../components/ui'

export function InviteAcceptModal({
  visible,
  token,
  onClose,
  onAccepted
}: {
  visible: boolean
  token: string | null
  onClose: () => void
  onAccepted: (tripId: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [preview, setPreview] = useState<TripInvitePreview | null>(null)

  useEffect(() => {
    if (!visible || !token) {
      setPreview(null)
      return
    }

    let cancelled = false
    setLoading(true)
    void fetchInvitePreview(token)
      .then((data) => {
        if (!cancelled) setPreview(data)
      })
      .catch((error) => {
        if (!cancelled) {
          Alert.alert('Convite inválido', error instanceof Error ? error.message : 'Este convite expirou ou não existe.')
          onClose()
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [visible, token, onClose])

  async function handleAccept() {
    if (!token) return
    setAccepting(true)
    try {
      const result = await acceptTripInvite(token)
      onAccepted(result.tripId)
      onClose()
    } catch (error) {
      Alert.alert('Não foi possível entrar', error instanceof Error ? error.message : 'Tente novamente.')
    } finally {
      setAccepting(false)
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Box className="flex-1 items-center justify-center bg-black/45 px-5">
        <Box className="w-full max-w-[420px] rounded-[28px] bg-white p-5">
          <HStack className="items-center gap-3">
            <Box className="h-12 w-12 items-center justify-center rounded-full bg-viagens-lilac">
              <Ionicons color={colors.primary} name="airplane" size={22} />
            </Box>
            <VStack className="flex-1">
              <Text className="text-[11px] font-black uppercase tracking-[1.4px] text-muted-foreground">
                Convite de viagem
              </Text>
              <Text className="text-[22px] font-black text-foreground">Entrar no grupo</Text>
            </VStack>
          </HStack>

          {loading ? (
            <ActivityIndicator color={colors.primary} className="my-8" />
          ) : preview ? (
            <VStack className="mt-5 gap-3">
              <Text className="text-[15px] font-semibold leading-6 text-foreground">
                {preview.hostName ? `${preview.hostName} convidou você para ` : 'Você foi convidado para '}
                <Text className="font-black">{preview.destination}</Text>
                {preview.country ? `, ${preview.country}` : ''}.
              </Text>
              <Box className="rounded-2xl bg-[#F8FAFC] px-4 py-3">
                <Text className="text-[13px] font-semibold text-muted-foreground">
                  Seu acesso: {memberRoleLabel(preview.role)}
                </Text>
              </Box>
              <Text className="text-[13px] font-semibold leading-5 text-muted-foreground">
                Ao aceitar, você entra na viagem com roteiro, checklist, gastos e chat do grupo.
              </Text>
            </VStack>
          ) : null}

          <Pressable
            onPress={() => void handleAccept()}
            disabled={accepting || loading || !preview}
            className="mt-5 h-14 items-center justify-center rounded-full bg-primary"
          >
            {accepting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-[16px] font-black text-white">Aceitar convite</Text>
            )}
          </Pressable>

          <Pressable onPress={onClose} className="mt-4 items-center">
            <Text className="text-[14px] font-bold text-muted-foreground">Agora não</Text>
          </Pressable>
        </Box>
      </Box>
    </Modal>
  )
}
