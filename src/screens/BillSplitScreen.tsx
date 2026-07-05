import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, TextInput } from 'react-native'
import {
  Box,
  HStack,
  Text,
  VStack
} from '../../components/ui'
import { fetchExpenseBalances, fetchTrip } from '../api/client'
import { EmptyTripNotice, OverlayScreenLayout } from '../components/OverlayScreenLayout'
import { colors, shadow } from '../theme'
import type { ExpenseBalance, Trip } from '../types/trip'

export function BillSplitScreen({
  selectedTrip,
  onBack
}: {
  selectedTrip: Trip | null
  onBack: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [balances, setBalances] = useState<ExpenseBalance[]>([])
  const [members, setMembers] = useState<Record<string, string>>({})
  const [billTotal, setBillTotal] = useState('120')
  const [peopleCount, setPeopleCount] = useState('4')

  const currency = selectedTrip?.base_currency ?? 'BRL'

  useEffect(() => {
    if (!selectedTrip) return

    void (async () => {
      setLoading(true)
      try {
        const [trip, balanceRows] = await Promise.all([
          fetchTrip(selectedTrip.id),
          fetchExpenseBalances(selectedTrip.id)
        ])
        const names: Record<string, string> = {}
        for (const member of trip.members ?? []) {
          names[member.user.id] = member.user.name
        }
        setMembers(names)
        setBalances(
          balanceRows.map((row) => ({
            ...row,
            name: names[row.userId] ?? 'Viajante'
          }))
        )
        setPeopleCount(String(Math.max(trip.members?.length ?? 2, 2)))
      } finally {
        setLoading(false)
      }
    })()
  }, [selectedTrip?.id])

  const quickSplit = useMemo(() => {
    const total = Number(billTotal.replace(',', '.')) || 0
    const people = Math.max(Number(peopleCount) || 1, 1)
    return {
      total,
      people,
      each: total / people
    }
  }, [billTotal, peopleCount])

  if (!selectedTrip) {
    return <EmptyTripNotice onBack={onBack} />
  }

  return (
    <OverlayScreenLayout
      title="Dividir contas"
      subtitle="Saldo do grupo e calculadora rápida para rachar uma conta na hora"
      onBack={onBack}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} className="my-10" />
      ) : (
        <VStack className="gap-4">
          <Box className="rounded-[28px] border border-[#EEF2FF] bg-white p-5" style={shadow}>
            <Text className="text-[12px] font-black uppercase tracking-[1.4px] text-muted-foreground">
              Calculadora rápida
            </Text>
            <HStack className="mt-4 gap-3">
              <VStack className="flex-1">
                <Text className="mb-2 text-xs font-black uppercase text-muted-foreground">Total da conta</Text>
                <TextInput
                  value={billTotal}
                  onChangeText={setBillTotal}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  placeholderTextColor={colors.muted}
                  className="rounded-2xl border border-[#E5E7EB] px-4 py-3 text-[18px] font-black text-foreground"
                />
              </VStack>
              <VStack className="w-24">
                <Text className="mb-2 text-xs font-black uppercase text-muted-foreground">Pessoas</Text>
                <TextInput
                  value={peopleCount}
                  onChangeText={setPeopleCount}
                  keyboardType="number-pad"
                  placeholder="2"
                  placeholderTextColor={colors.muted}
                  className="rounded-2xl border border-[#E5E7EB] px-4 py-3 text-[18px] font-black text-foreground"
                />
              </VStack>
            </HStack>
            <Box className="mt-4 rounded-2xl bg-viagens-lilac px-4 py-4">
              <Text className="text-[12px] font-black uppercase text-primary">Cada um paga</Text>
              <Text className="mt-1 text-[28px] font-black text-primary">
                {quickSplit.each.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}{' '}
                {currency}
              </Text>
            </Box>
          </Box>

          <Text className="text-[18px] font-black text-foreground">Saldo do grupo</Text>
          {balances.length === 0 ? (
            <Text className="text-sm font-semibold text-muted-foreground">
              Registre gastos no controle de gastos para ver quem deve para quem.
            </Text>
          ) : (
            balances.map((balance) => {
              const positive = balance.amount >= 0
              return (
                <Box key={balance.userId} className="rounded-[24px] border border-[#EEF2FF] bg-white p-4" style={shadow}>
                  <HStack className="items-center justify-between">
                    <HStack className="items-center gap-3">
                      <Box className="h-11 w-11 items-center justify-center rounded-2xl bg-viagens-lilac">
                        <Ionicons color={colors.primary} name="person-outline" size={22} />
                      </Box>
                      <VStack>
                        <Text className="text-[16px] font-black text-foreground">
                          {balance.name ?? members[balance.userId] ?? 'Viajante'}
                        </Text>
                        <Text className="text-[12px] font-semibold text-muted-foreground">
                          {positive ? 'Deve receber' : 'Deve pagar'}
                        </Text>
                      </VStack>
                    </HStack>
                    <Text className={`text-[16px] font-black ${positive ? 'text-emerald-600' : 'text-red-600'}`}>
                      {Math.abs(balance.amount).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}{' '}
                      {currency}
                    </Text>
                  </HStack>
                </Box>
              )
            })
          )}

        </VStack>
      )}
    </OverlayScreenLayout>
  )
}
