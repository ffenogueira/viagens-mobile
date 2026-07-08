import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  View
} from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  addChecklistItem,
  addJournalEntry,
  addWishlistItem,
  updateChecklistItem
} from '../api/client'
import { formatAppDateTime } from '../i18n/format'
import { colors } from '../theme'
import type { Trip, TripChecklistItem, TripJournalEntry, TripWishlistItem } from '../types/trip'
import { Box, HStack, Pressable, Text, VStack } from '../../components/ui'

type SheetShellProps = {
  visible: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
}

function SheetShell({ visible, title, subtitle, onClose, children }: SheetShellProps) {
  const { t } = useTranslation('common')
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
          <View
            style={{
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              backgroundColor: '#FFF',
              paddingHorizontal: 20,
              paddingBottom: 32,
              paddingTop: 16,
              maxHeight: '88%'
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: 64,
                height: 6,
                borderRadius: 999,
                backgroundColor: '#D1D5DB',
                marginBottom: 20
              }}
            />
            <Text className="text-[24px] font-black text-foreground">{title}</Text>
            {subtitle ? (
              <Text className="mt-1 mb-5 text-[13px] font-semibold text-muted-foreground">{subtitle}</Text>
            ) : (
              <Box className="mb-5" />
            )}
            {children}
            <Pressable onPress={onClose} className="mt-4 items-center">
              <Text className="text-[14px] font-bold text-muted-foreground">{t('close')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

export function TripWishlistSheet({
  visible,
  trip,
  items,
  onClose,
  onRefresh,
  onAddToDay
}: {
  visible: boolean
  trip: Trip | null
  items: TripWishlistItem[]
  onClose: () => void
  onRefresh: () => Promise<void>
  onAddToDay: (title: string) => void
}) {
  const { t } = useTranslation('trip')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!trip || !title.trim()) return
    setSaving(true)
    try {
      await addWishlistItem(trip.id, title.trim(), notes.trim() || undefined)
      setTitle('')
      setNotes('')
      await onRefresh()
    } catch (error) {
      Alert.alert(t('wishlist'), error instanceof Error ? error.message : t('common:couldNotSave'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SheetShell
      visible={visible}
      title={t('wishlist')}
      subtitle={trip ? t('wishlistPlaces', { destination: trip.destination }) : undefined}
      onClose={onClose}
    >
      <VStack className="gap-3">
        {items.length ? (
          items.map((item) => (
            <Box key={item.id} className="rounded-2xl border border-[#EEF2FF] bg-[#FAFAFF] px-4 py-3">
              <HStack className="items-start justify-between gap-3">
                <VStack className="flex-1">
                  <Text className="text-[15px] font-black text-foreground">{item.title}</Text>
                  {item.notes ? (
                    <Text className="mt-1 text-[13px] font-semibold leading-5 text-muted-foreground">
                      {item.notes}
                    </Text>
                  ) : null}
                </VStack>
                <Pressable
                  onPress={() => {
                    onClose()
                    onAddToDay(item.title)
                  }}
                  className="rounded-full bg-viagens-lilac px-3 py-2"
                >
                  <Text className="text-[11px] font-black text-primary">{t('wishlistOnDay')}</Text>
                </Pressable>
              </HStack>
            </Box>
          ))
        ) : (
          <Box className="rounded-2xl border border-dashed border-[#E5E7EB] bg-[#FAFAFF] px-4 py-6">
            <Text className="text-center text-[14px] font-semibold text-muted-foreground">
              {t('wishlistEmpty')}
            </Text>
          </Box>
        )}

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('wishlistPlaceholder')}
          placeholderTextColor={colors.muted}
          style={inputStyle}
        />
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder={t('wishlistNotesPlaceholder')}
          placeholderTextColor={colors.muted}
          style={inputStyle}
        />
        <Pressable
          onPress={() => void handleAdd()}
          disabled={saving || !title.trim()}
          className="h-14 items-center justify-center rounded-full bg-primary"
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-[16px] font-black text-white">{t('wishlistSave')}</Text>
          )}
        </Pressable>
      </VStack>
    </SheetShell>
  )
}

export function TripChecklistSheet({
  visible,
  trip,
  items,
  onClose,
  onRefresh
}: {
  visible: boolean
  trip: Trip | null
  items: TripChecklistItem[]
  onClose: () => void
  onRefresh: () => Promise<void>
}) {
  const { t } = useTranslation('trip')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function handleAdd() {
    if (!trip || !title.trim()) return
    setSaving(true)
    try {
      await addChecklistItem(trip.id, title.trim())
      setTitle('')
      await onRefresh()
    } catch (error) {
      Alert.alert(t('checklist'), error instanceof Error ? error.message : t('common:couldNotSave'))
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(item: TripChecklistItem) {
    if (!trip) return
    setTogglingId(item.id)
    try {
      await updateChecklistItem(trip.id, item.id, !item.isCompleted)
      await onRefresh()
    } catch (error) {
      Alert.alert(t('checklist'), error instanceof Error ? error.message : t('common:couldNotUpdate'))
    } finally {
      setTogglingId(null)
    }
  }

  const doneCount = items.filter((item) => item.isCompleted).length

  return (
    <SheetShell
      visible={visible}
      title={t('checklist')}
      subtitle={
        trip
          ? t('checklistProgress', { done: doneCount, total: items.length, destination: trip.destination })
          : undefined
      }
      onClose={onClose}
    >
      <VStack className="gap-3">
        {items.length ? (
          items.map((item) => {
            const busy = togglingId === item.id
            return (
              <Pressable
                key={item.id}
                onPress={() => void handleToggle(item)}
                disabled={busy}
                className="rounded-2xl border border-[#EEF2FF] bg-white px-4 py-3"
              >
                <HStack className="items-center gap-3">
                  <Box
                    className={`h-7 w-7 items-center justify-center rounded-full ${
                      item.isCompleted ? 'bg-primary' : 'border-2 border-[#D1D5DB] bg-white'
                    }`}
                  >
                    {busy ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : item.isCompleted ? (
                      <Ionicons color={colors.white} name="checkmark" size={16} />
                    ) : null}
                  </Box>
                  <Text
                    className={`flex-1 text-[15px] font-semibold ${
                      item.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}
                  >
                    {item.title}
                  </Text>
                </HStack>
              </Pressable>
            )
          })
        ) : (
          <Box className="rounded-2xl border border-dashed border-[#E5E7EB] bg-[#FAFAFF] px-4 py-6">
            <Text className="text-center text-[14px] font-semibold text-muted-foreground">
              {t('checklistEmpty')}
            </Text>
          </Box>
        )}

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('checklistPlaceholder')}
          placeholderTextColor={colors.muted}
          style={inputStyle}
        />
        <Pressable
          onPress={() => void handleAdd()}
          disabled={saving || !title.trim()}
          className="h-14 items-center justify-center rounded-full bg-primary"
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-[16px] font-black text-white">{t('checklistAdd')}</Text>
          )}
        </Pressable>
      </VStack>
    </SheetShell>
  )
}

export function TripBoardSheet({
  visible,
  trip,
  entries,
  onClose,
  onRefresh
}: {
  visible: boolean
  trip: Trip | null
  entries: TripJournalEntry[]
  onClose: () => void
  onRefresh: () => Promise<void>
}) {
  const { t } = useTranslation('trip')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!trip || !body.trim()) return
    setSaving(true)
    try {
      await addJournalEntry(trip.id, body.trim(), title.trim() || undefined)
      setTitle('')
      setBody('')
      await onRefresh()
    } catch (error) {
      Alert.alert(t('journal'), error instanceof Error ? error.message : t('common:couldNotPublish'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SheetShell
      visible={visible}
      title={t('journalTitle')}
      subtitle={trip ? t('journalSubtitle', { destination: trip.destination }) : undefined}
      onClose={onClose}
    >
      <VStack className="gap-3">
        {entries.length ? (
          entries.map((entry) => (
            <Box key={entry.id} className="rounded-2xl border border-[#EEF2FF] bg-[#FAFAFF] px-4 py-3">
              {entry.title ? (
                <Text className="text-[15px] font-black text-foreground">{entry.title}</Text>
              ) : null}
              <Text className={`text-[14px] font-semibold leading-6 text-foreground ${entry.title ? 'mt-1' : ''}`}>
                {entry.body}
              </Text>
              <Text className="mt-2 text-[11px] font-bold text-muted-foreground">
                {entry.user?.name ? `${entry.user.name} · ` : ''}
                {formatAppDateTime(entry.createdAt)}
              </Text>
            </Box>
          ))
        ) : (
          <Box className="rounded-2xl border border-dashed border-[#E5E7EB] bg-[#FAFAFF] px-4 py-6">
            <Text className="text-center text-[14px] font-semibold text-muted-foreground">
              {t('journalEmpty')}
            </Text>
          </Box>
        )}

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('notesOptional')}
          placeholderTextColor={colors.muted}
          style={inputStyle}
        />
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={t('journalEmpty')}
          placeholderTextColor={colors.muted}
          multiline
          textAlignVertical="top"
          style={{ ...inputStyle, minHeight: 96 }}
        />
        <Pressable
          onPress={() => void handleAdd()}
          disabled={saving || !body.trim()}
          className="h-14 items-center justify-center rounded-full bg-primary"
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-[16px] font-black text-white">{t('publish')}</Text>
          )}
        </Pressable>
      </VStack>
    </SheetShell>
  )
}

const inputStyle = {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 16,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 16,
  fontWeight: '600' as const,
  color: colors.ink
}
