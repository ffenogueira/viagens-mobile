import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, TextInput } from 'react-native'
import { useTranslation } from 'react-i18next'
import { formatAppDateTime } from '../i18n/format'
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
import type { AuthUser } from '../api/client'
import { fetchTrip, sendChatMessage, updateTripMemberRole } from '../api/client'
import { EmptyTripNotice, OverlayScreenLayout } from '../components/OverlayScreenLayout'
import { TripInviteSheet } from '../components/TripInviteSheet'
import { UserAvatar } from '../components/UserAvatar'
import { memberRoleLabel } from '../lib/tripInvite'
import { colors, shadow } from '../theme'
import type { ChatMessage, Trip, TripInviteRole, TripMember } from '../types/trip'

function canManageMembers(members: TripMember[], userId?: string) {
  if (!userId) return false
  const self = members.find((member) => member.user.id === userId)
  return self?.role === 'OWNER' || self?.role === 'ORGANIZER'
}

export function GroupChatScreen({
  selectedTrip,
  user,
  onBack
}: {
  selectedTrip: Trip | null
  user: AuthUser | null
  onBack: () => void
}) {
  const { t } = useTranslation('group')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [members, setMembers] = useState<TripMember[]>([])
  const [draft, setDraft] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null)

  const currentUserId = user?.id
  const manager = canManageMembers(members, currentUserId)
  const viewerOnly = members.some((member) => member.user.id === currentUserId && member.role === 'VIEWER')

  async function loadTrip() {
    if (!selectedTrip) return
    setLoading(true)
    try {
      const trip = await fetchTrip(selectedTrip.id)
      setMessages(trip.messages ?? [])
      setMembers(trip.members ?? [])
    } catch (error) {
      Alert.alert(t('unavailable'), error instanceof Error ? error.message : t('common:tryAgain'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTrip()
  }, [selectedTrip?.id])

  async function submitMessage() {
    if (!selectedTrip || !draft.trim()) return
    if (viewerOnly) {
      Alert.alert(t('readOnlyTitle'), t('readOnlyBody'))
      return
    }
    setSending(true)
    try {
      const message = await sendChatMessage(selectedTrip.id, draft.trim())
      setMessages((current) => [...current, message])
      setDraft('')
    } catch (error) {
      Alert.alert(t('messageNotSent'), error instanceof Error ? error.message : t('common:tryAgain'))
    } finally {
      setSending(false)
    }
  }

  async function applyMemberRole(member: TripMember, role: TripInviteRole) {
    if (!selectedTrip || member.role === 'OWNER') return
    setUpdatingMemberId(member.id)
    try {
      await updateTripMemberRole(selectedTrip.id, member.id, role)
      await loadTrip()
    } catch (error) {
      Alert.alert(t('permission'), error instanceof Error ? error.message : t('common:couldNotUpdate'))
    } finally {
      setUpdatingMemberId(null)
    }
  }

  function openRolePicker(member: TripMember) {
    if (!manager || member.role === 'OWNER' || member.user.id === currentUserId) return

    Alert.alert(t('permissionOf', { name: member.user.name }), t('chooseAccess'), [
      { text: t('roleViewer'), onPress: () => void applyMemberRole(member, 'VIEWER') },
      { text: t('roleEditor'), onPress: () => void applyMemberRole(member, 'MEMBER') },
      { text: t('roleAdmin'), onPress: () => void applyMemberRole(member, 'ORGANIZER') },
      { text: t('common:cancel'), style: 'cancel' }
    ])
  }

  if (!selectedTrip) {
    return <EmptyTripNotice onBack={onBack} />
  }

  const membersCount = Math.max(members.length, 1)

  return (
    <>
      <OverlayScreenLayout
        title={t('title')}
        subtitle={
          membersCount > 1
            ? t('subtitleMulti', { count: membersCount })
            : t('subtitleSolo')
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
                    {t('tripGroup')}
                  </Text>
                  <Text className="mt-1 text-[18px] font-black text-foreground">{selectedTrip.destination}</Text>
                </VStack>
                <Box className="rounded-full bg-viagens-lilac px-3 py-1.5">
                  <Text className="text-[12px] font-black text-primary">{membersCount}</Text>
                </Box>
              </HStack>

              <VStack className="mt-4 gap-3">
                {members.length ? (
                  members.map((member) => {
                    const busy = updatingMemberId === member.id
                    const row = (
                      <HStack className="items-center gap-3">
                        <UserAvatar name={member.user.name} className="h-11 w-11" />
                        <VStack className="flex-1">
                          <Text className="text-[15px] font-black text-foreground">{member.user.name}</Text>
                          <Text className="text-[12px] font-semibold text-muted-foreground">
                            {memberRoleLabel(member.role)}
                          </Text>
                        </VStack>
                        {busy ? <ActivityIndicator color={colors.primary} size="small" /> : null}
                        {manager && member.role !== 'OWNER' && member.user.id !== currentUserId ? (
                          <Ionicons color={colors.muted} name="chevron-forward" size={18} />
                        ) : null}
                      </HStack>
                    )

                    if (manager && member.role !== 'OWNER' && member.user.id !== currentUserId) {
                      return (
                        <Pressable key={member.id} onPress={() => openRolePicker(member)} disabled={busy}>
                          {row}
                        </Pressable>
                      )
                    }

                    return <Box key={member.id}>{row}</Box>
                  })
                ) : (
                  <Text className="text-[14px] font-semibold text-muted-foreground">
                    {t('firstMember')}
                  </Text>
                )}
              </VStack>

              {manager ? (
                <Pressable
                  onPress={() => setInviteOpen(true)}
                  className="mt-4 h-12 flex-row items-center justify-center gap-2 rounded-full bg-primary"
                >
                  <Ionicons color={colors.white} name="person-add-outline" size={18} />
                  <Text className="text-[15px] font-black text-white">{t('inviteFriends')}</Text>
                </Pressable>
              ) : (
                <Box className="mt-4 rounded-2xl bg-[#F8FAFC] px-4 py-3">
                  <Text className="text-[13px] font-semibold leading-5 text-muted-foreground">
                    {t('onlyOrganizers')}
                  </Text>
                </Box>
              )}

              <Text className="mt-3 text-center text-[12px] font-semibold leading-5 text-muted-foreground">
                {t('inviteHint')}
              </Text>
            </Box>

            <VStack className="gap-3">
              <Text className="text-[11px] font-black uppercase tracking-[1.4px] text-muted-foreground">
                {t('messages')}
              </Text>
              {messages.length === 0 ? (
                <Text className="text-sm font-semibold text-muted-foreground">
                  {t('noMessages')}
                </Text>
              ) : (
                messages.map((message) => (
                  <Box key={message.id} className="rounded-[22px] border border-[#EEF2FF] bg-white p-4" style={shadow}>
                    <Text className="text-[12px] font-black text-primary">{message.user.name}</Text>
                    <Text className="mt-1 text-[15px] font-semibold leading-6 text-foreground">{message.body}</Text>
                    <Text className="mt-2 text-[11px] font-semibold text-muted-foreground">
                      {formatAppDateTime(message.createdAt)}
                    </Text>
                  </Box>
                ))
              )}
            </VStack>

            <Box className="rounded-[24px] border border-[#EEF2FF] bg-white p-4" style={shadow}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={viewerOnly ? t('placeholderViewer') : t('placeholder')}
                placeholderTextColor={colors.muted}
                multiline
                editable={!viewerOnly}
                className="min-h-[88px] text-[15px] font-semibold text-foreground"
              />
              <Button
                className="mt-3 h-12 rounded-full bg-primary"
                onPress={submitMessage}
                disabled={sending || viewerOnly}
              >
                {sending ? <ButtonSpinner color="#FFF" /> : <ButtonText className="font-black text-white">{t('common:send')}</ButtonText>}
              </Button>
            </Box>
          </VStack>
        )}
      </OverlayScreenLayout>

      <TripInviteSheet visible={inviteOpen} trip={selectedTrip} onClose={() => setInviteOpen(false)} />
    </>
  )
}
