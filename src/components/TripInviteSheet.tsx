import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { ActivityIndicator, Alert, Modal, Share } from 'react-native'
import { createTripInvite } from '../api/client'
import { buildInviteShareMessage, inviteRoleLabel } from '../lib/tripInvite'
import { colors } from '../theme'
import type { InvitePermissionLevel, Trip } from '../types/trip'
import { Box, HStack, Pressable, Text, VStack } from '../../components/ui'

const PERMISSION_OPTIONS: Array<{
  id: InvitePermissionLevel
  title: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
}> = [
  {
    id: 'viewer',
    title: 'Leitor',
    description: 'Vê roteiro, gastos e chat sem editar',
    icon: 'eye-outline'
  },
  {
    id: 'editor',
    title: 'Editor',
    description: 'Edita roteiro, checklist, gastos e mensagens',
    icon: 'create-outline'
  },
  {
    id: 'admin',
    title: 'Admin',
    description: 'Edita tudo e convida outras pessoas',
    icon: 'shield-checkmark-outline'
  }
]

export function TripInviteSheet({
  visible,
  trip,
  onClose
}: {
  visible: boolean
  trip: Trip | null
  onClose: () => void
}) {
  const [permission, setPermission] = useState<InvitePermissionLevel>('editor')
  const [sharing, setSharing] = useState(false)

  async function handleShare() {
    if (!trip) return
    setSharing(true)
    try {
      const token = await createTripInvite(trip.id, permission)
      if (!token) {
        throw new Error('Não foi possível gerar o convite.')
      }
      await Share.share({
        message: buildInviteShareMessage({
          destination: trip.destination,
          token,
          permission
        })
      })
      onClose()
    } catch (error) {
      Alert.alert('Convite', error instanceof Error ? error.message : 'Não foi possível compartilhar.')
    } finally {
      setSharing(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Box className="flex-1 justify-end bg-black/35">
        <Box className="rounded-t-[32px] bg-white px-5 pb-8 pt-4">
          <Box className="mb-5 h-1.5 w-16 self-center rounded-full bg-[#D1D5DB]" />
          <Text className="text-[24px] font-black text-foreground">Convidar para a viagem</Text>
          <Text className="mt-2 text-[14px] font-semibold leading-6 text-muted-foreground">
            A pessoa precisa baixar o app, criar conta e abrir o link para entrar em {trip?.destination ?? 'sua viagem'}.
          </Text>

          <VStack className="mt-5 gap-3">
            {PERMISSION_OPTIONS.map((option) => {
              const active = permission === option.id
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setPermission(option.id)}
                  className={`rounded-[22px] border px-4 py-4 ${
                    active ? 'border-primary bg-viagens-lilac' : 'border-[#EEF2FF] bg-white'
                  }`}
                >
                  <HStack className="items-start gap-3">
                    <Box className="mt-0.5 h-10 w-10 items-center justify-center rounded-full bg-white">
                      <Ionicons color={colors.primary} name={option.icon} size={20} />
                    </Box>
                    <VStack className="flex-1">
                      <Text className="text-[16px] font-black text-foreground">{option.title}</Text>
                      <Text className="mt-1 text-[13px] font-semibold leading-5 text-muted-foreground">
                        {option.description}
                      </Text>
                    </VStack>
                    {active ? <Ionicons color={colors.primary} name="checkmark-circle" size={22} /> : null}
                  </HStack>
                </Pressable>
              )
            })}
          </VStack>

          <Box className="mt-4 rounded-2xl bg-[#F8FAFC] px-4 py-3">
            <Text className="text-[12px] font-semibold leading-5 text-muted-foreground">
              Permissão escolhida: {inviteRoleLabel(permission)}
            </Text>
          </Box>

          <Pressable
            onPress={() => void handleShare()}
            disabled={sharing || !trip}
            className="mt-5 h-14 items-center justify-center rounded-full bg-primary"
          >
            {sharing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-[16px] font-black text-white">Gerar link e compartilhar</Text>
            )}
          </Pressable>

          <Pressable onPress={onClose} className="mt-4 items-center">
            <Text className="text-[14px] font-bold text-muted-foreground">Cancelar</Text>
          </Pressable>
        </Box>
      </Box>
    </Modal>
  )
}
