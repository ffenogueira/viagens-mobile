import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Modal, TextInput } from 'react-native'
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
import { createExpense, fetchTrip } from '../api/client'
import { EmptyTripNotice, OverlayScreenLayout } from '../components/OverlayScreenLayout'
import { colors, shadow } from '../theme'
import type { Trip, TripExpense } from '../types/trip'

type AddMode = 'manual' | 'receipt' | 'audio'

export function ExpensesScreen({
  selectedTrip,
  onBack,
  onOpenBillSplit
}: {
  selectedTrip: Trip | null
  onBack: () => void
  onOpenBillSplit?: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expenses, setExpenses] = useState<TripExpense[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [mode, setMode] = useState<AddMode>('manual')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [receiptUri, setReceiptUri] = useState<string | null>(null)

  const currency = selectedTrip?.base_currency ?? 'BRL'

  const total = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  )

  const tripDays = useMemo(() => {
    if (!selectedTrip?.start_date || !selectedTrip?.end_date) return 1
    const start = new Date(selectedTrip.start_date).getTime()
    const end = new Date(selectedTrip.end_date).getTime()
    return Math.max(1, Math.round((end - start) / 86400000) + 1)
  }, [selectedTrip?.start_date, selectedTrip?.end_date])

  async function loadExpenses() {
    if (!selectedTrip) return
    setLoading(true)
    try {
      const trip = await fetchTrip(selectedTrip.id)
      setExpenses(trip.expenses ?? [])
    } catch (error) {
      Alert.alert('Gastos indisponíveis', error instanceof Error ? error.message : 'Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadExpenses()
  }, [selectedTrip?.id])

  function openSheet(nextMode: AddMode) {
    if (nextMode === 'audio') {
      Alert.alert(
        'Gasto por voz',
        'Em breve você poderá dizer “gastei 45 euros no jantar” e o app registra sozinho. Por enquanto, escreva o valor abaixo.'
      )
      setMode('manual')
    } else {
      setMode(nextMode)
    }
    setTitle('')
    setAmount('')
    setNote('')
    setReceiptUri(null)
    setSheetOpen(true)
  }

  async function pickReceiptPhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (permission.status !== 'granted') {
      Alert.alert('Permita a câmera', 'Precisamos da câmera para fotografar o recibo.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false
    })

    if (!result.canceled && result.assets[0]?.uri) {
      setReceiptUri(result.assets[0].uri)
      if (!title.trim()) setTitle('Recibo')
      setMode('receipt')
      setSheetOpen(true)
    }
  }

  async function submitExpense() {
    if (!selectedTrip) return
    const parsedAmount = Number(amount.replace(',', '.'))
    if (!title.trim() || !parsedAmount || parsedAmount <= 0) {
      Alert.alert('Informe o gasto', 'Digite o que foi e quanto custou.')
      return
    }

    setSaving(true)
    try {
      const created = await createExpense(selectedTrip.id, {
        title: title.trim(),
        amount: parsedAmount,
        currency,
        source: mode === 'receipt' ? 'receipt' : mode === 'audio' ? 'audio' : 'manual',
        note: note.trim() || undefined,
        receiptUri: receiptUri ?? undefined,
        category: mode
      })
      setExpenses((current) => [created, ...current])
      setSheetOpen(false)
    } catch (error) {
      Alert.alert('Gasto não salvo', error instanceof Error ? error.message : 'Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (!selectedTrip) {
    return <EmptyTripNotice onBack={onBack} />
  }

  return (
    <>
      <OverlayScreenLayout
        title="Controle de gastos"
        subtitle={`${selectedTrip.destination} · acompanhe tudo e veja o relatório no final`}
        onBack={onBack}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} className="my-10" />
        ) : (
          <VStack className="gap-4">
            <Box className="rounded-[28px] bg-primary p-5">
              <Text className="text-[12px] font-black uppercase tracking-[1.4px] text-white/75">
                Relatório da viagem
              </Text>
              <Text className="mt-2 text-[34px] font-black text-white">
                {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
              </Text>
              <HStack className="mt-4 gap-4">
                <ReportStat label="Lançamentos" value={String(expenses.length)} />
                <ReportStat
                  label="Média/dia"
                  value={`${(total / tripDays).toLocaleString('pt-BR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })} ${currency}`}
                />
              </HStack>
            </Box>

            <HStack className="gap-3">
              <QuickAddButton icon="camera-outline" label="Foto do recibo" onPress={() => void pickReceiptPhoto()} />
              <QuickAddButton icon="create-outline" label="Escrever gasto" onPress={() => openSheet('manual')} />
              <QuickAddButton icon="mic-outline" label="Falar gasto" onPress={() => openSheet('audio')} />
            </HStack>

            {onOpenBillSplit ? (
              <Pressable
                onPress={onOpenBillSplit}
                className="rounded-[24px] border border-[#EEF2FF] bg-white p-4"
                style={shadow}
              >
                <HStack className="items-center justify-between">
                  <HStack className="items-center gap-3">
                    <Box className="h-11 w-11 items-center justify-center rounded-2xl bg-viagens-lilac">
                      <Ionicons color={colors.primary} name="people-outline" size={22} />
                    </Box>
                    <VStack>
                      <Text className="text-[16px] font-black text-foreground">Dividir contas</Text>
                      <Text className="text-[12px] font-semibold text-muted-foreground">
                        Veja quem deve para quem no grupo
                      </Text>
                    </VStack>
                  </HStack>
                  <Ionicons color={colors.mutedLight} name="chevron-forward" size={20} />
                </HStack>
              </Pressable>
            ) : null}

            <Text className="text-[18px] font-black text-foreground">Lançamentos</Text>
            {expenses.length === 0 ? (
              <Text className="text-sm font-semibold text-muted-foreground">
                Nenhum gasto ainda. Fotografe um recibo ou escreva quanto gastou.
              </Text>
            ) : (
              expenses.map((expense) => (
                <Box key={expense.id} className="rounded-[24px] border border-[#EEF2FF] bg-white p-4" style={shadow}>
                  <HStack className="items-start justify-between">
                    <VStack className="flex-1 pr-3">
                      <HStack className="items-center gap-2">
                        <SourceBadge source={expense.source ?? expense.category} />
                        <Text className="text-[16px] font-black text-foreground">{expense.title}</Text>
                      </HStack>
                      {expense.note ? (
                        <Text className="mt-1 text-[12px] font-semibold text-muted-foreground">{expense.note}</Text>
                      ) : null}
                    </VStack>
                    <Text className="text-[16px] font-black text-foreground">
                      {Number(expense.amount).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}{' '}
                      {expense.currency}
                    </Text>
                  </HStack>
                </Box>
              ))
            )}
          </VStack>
        )}
      </OverlayScreenLayout>

      <Modal visible={sheetOpen} animationType="slide" transparent onRequestClose={() => setSheetOpen(false)}>
        <Box className="flex-1 justify-end bg-black/35">
          <Box className="rounded-t-[32px] bg-white px-5 pb-8 pt-4">
            <Box className="mb-5 h-1.5 w-16 self-center rounded-full bg-[#D1D5DB]" />
            <Text className="text-[24px] font-black text-foreground">
              {mode === 'receipt' ? 'Gasto com recibo' : 'Registrar gasto'}
            </Text>
            <Text className="mt-1 text-[13px] font-semibold text-muted-foreground">
              {mode === 'receipt'
                ? 'Confirme o valor. A foto fica salva no seu celular por enquanto.'
                : 'Ex.: jantar, metro, ingresso, compras.'}
            </Text>

            {receiptUri ? (
              <Box className="mt-4 rounded-2xl bg-viagens-lilac px-4 py-3">
                <Text className="text-[12px] font-black text-primary">Recibo fotografado</Text>
              </Box>
            ) : null}

            <Text className="mb-2 mt-5 text-xs font-black uppercase text-muted-foreground">O que foi</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Jantar, taxi, museu..."
              placeholderTextColor={colors.muted}
              className="rounded-2xl border border-[#E5E7EB] px-4 py-3 text-[16px] font-semibold text-foreground"
            />

            <Text className="mb-2 mt-4 text-xs font-black uppercase text-muted-foreground">Quanto custou</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0,00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.muted}
              className="rounded-2xl border border-[#E5E7EB] px-4 py-3 text-[16px] font-semibold text-foreground"
            />

            <Text className="mb-2 mt-4 text-xs font-black uppercase text-muted-foreground">Observação (opcional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Dividido com Ana, pagamento em dinheiro..."
              placeholderTextColor={colors.muted}
              className="rounded-2xl border border-[#E5E7EB] px-4 py-3 text-[16px] font-semibold text-foreground"
            />

            <Button className="mt-6 h-14 rounded-full bg-primary" onPress={submitExpense} disabled={saving}>
              {saving ? <ButtonSpinner color="#FFF" /> : <ButtonText className="font-black text-white">Salvar gasto</ButtonText>}
            </Button>
            <Pressable onPress={() => setSheetOpen(false)} className="mt-4 items-center">
              <Text className="text-[14px] font-bold text-muted-foreground">Cancelar</Text>
            </Pressable>
          </Box>
        </Box>
      </Modal>
    </>
  )
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <VStack>
      <Text className="text-[11px] font-black uppercase tracking-[1px] text-white/70">{label}</Text>
      <Text className="mt-1 text-[16px] font-black text-white">{value}</Text>
    </VStack>
  )
}

function QuickAddButton({
  icon,
  label,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center rounded-[22px] border border-[#EEF2FF] bg-white py-4"
      style={[shadow, { aspectRatio: 1 }]}
    >
      <Box className="h-11 w-11 items-center justify-center rounded-2xl bg-viagens-lilac">
        <Ionicons color={colors.primary} name={icon} size={22} />
      </Box>
      <Text className="mt-2 px-1 text-center text-[11px] font-black leading-4 text-foreground" numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  )
}

function SourceBadge({ source }: { source?: string | null }) {
  const map: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    receipt: { icon: 'camera-outline', color: colors.sky },
    audio: { icon: 'mic-outline', color: colors.orange },
    manual: { icon: 'create-outline', color: colors.mint }
  }
  const meta = map[String(source)] ?? map.manual
  return (
    <Box className="h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: `${meta.color}18` }}>
      <Ionicons color={meta.color} name={meta.icon} size={14} />
    </Box>
  )
}
