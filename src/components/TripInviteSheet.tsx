import { Ionicons } from '@expo/vector-icons'
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Modal, Share } from 'react-native'
import { useTranslation } from 'react-i18next'
import { createTripInvite } from '../api/client'
import { buildInviteShareMessage, inviteRoleLabel } from '../lib/tripInvite'
import { colors } from '../theme'
import type { InvitePermissionLevel, Trip } from '../types/trip'
import { Box, HStack, Pressable, Text, VStack } from '../../components/ui'

export function TripInviteSheet({
  visible,
  trip,
  onClose
}: {
  visible: boolean
  trip: Trip | null
  onClose: () => void
}) {
  const { t } = useTranslation('invite')
  const [permission, setPermission] = useState<InvitePermissionLevel>('editor')
  const [sharing, setSharing] = useState(false)

  const permissionOptions = useMemo(
    () =>
      [
        {
          id: 'viewer' as const,
          title: t('viewerTitle'),
          description: t('viewerDesc'),
          icon: 'eye-outline' as const
        },
        {
          id: 'editor' as const,
          title: t('editorTitle'),
          description: t('editorDesc'),
          icon: 'create-outline' as const
        },
        {
          id: 'admin' as const,
          title: t('adminTitle'),
          description: t('adminDesc'),
          icon: 'shield-checkmark-outline' as const
        }
      ] as const,
    [t]
  )

  async function handleShare() {
    if (!trip) return
    setSharing(true)
    try {
      const token = await createTripInvite(trip.id, permission)
      if (!token) {
        throw new Error(t('generateFailed'))
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
      Alert.alert(t('inviteAlert'), error instanceof Error ? error.message : t('shareFailed'))
    } finally {
      setSharing(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Box className="flex-1 justify-end bg-black/35">
        <Box className="rounded-t-[32px] bg-white px-5 pb-8 pt-4">
          <Box className="mb-5 h-1.5 w-16 self-center rounded-full bg-[#D1D5DB]" />
          <Text className="text-[24px] font-black text-foreground">{t('sheetTitle')}</Text>
          <Text className="mt-2 text-[14px] font-semibold leading-6 text-muted-foreground">
            {t('sheetSubtitle', {
              destination: trip?.destination ?? t('sheetSubtitleFallback')
            })}
          </Text>

          <VStack className="mt-5 gap-3">
            {permissionOptions.map((option) => {
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
              {t('chosenPermission', { role: inviteRoleLabel(permission) })}
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
              <Text className="text-[16px] font-black text-white">{t('shareLink')}</Text>
            )}
          </Pressable>

          <Pressable onPress={onClose} className="mt-4 items-center">
            <Text className="text-[14px] font-bold text-muted-foreground">{t('common:cancel')}</Text>
          </Pressable>
        </Box>
      </Box>
    </Modal>
  )
}
