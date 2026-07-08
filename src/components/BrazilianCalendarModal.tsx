import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable as RNPressable, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Box, HStack, Pressable, Text } from '../../components/ui'
import { formatAppDate } from '../i18n/format'
import { isoFromDate } from '../lib/dates'
import { colors } from '../theme'

type BrazilianCalendarModalProps = {
  visible: boolean
  title: string
  value?: string | null
  minimumDate?: Date
  onClose: () => void
  onSelect: (isoDate: string) => void
}

function parseIso(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function BrazilianCalendarModal({
  visible,
  title,
  value,
  minimumDate,
  onClose,
  onSelect
}: BrazilianCalendarModalProps) {
  const { t, i18n } = useTranslation('common')
  const initial = parseIso(value) ?? new Date()
  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())

  useEffect(() => {
    if (!visible) return
    const anchor = parseIso(value) ?? new Date()
    setViewYear(anchor.getFullYear())
    setViewMonth(anchor.getMonth())
  }, [visible, value])

  const selected = parseIso(value)
  const minDay = minimumDate ? startOfDay(minimumDate) : null

  const weekdays = useMemo(() => {
    // Anchor on a known Sunday so indices 0..6 map Dom..Sáb / Sun..Sat / Dom..Sáb
    const sunday = new Date(2024, 0, 7)
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(sunday)
      day.setDate(sunday.getDate() + index)
      return formatAppDate(day, { weekday: 'short' }).replace('.', '')
    })
  }, [i18n.language])

  const monthLabel = useMemo(() => {
    const anchor = new Date(viewYear, viewMonth, 1)
    return formatAppDate(anchor, { month: 'long' })
  }, [viewMonth, viewYear, i18n.language])

  const cells = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()
    const grid: Array<{ day: number | null; date?: Date }> = []

    for (let i = 0; i < firstWeekday; i += 1) {
      grid.push({ day: null })
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      grid.push({ day, date: new Date(viewYear, viewMonth, day) })
    }
    return grid
  }, [viewMonth, viewYear])

  function goMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  function handleSelect(date: Date) {
    if (minDay && startOfDay(date) < minDay) return
    onSelect(isoFromDate(date))
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <RNPressable
        style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <RNPressable onPress={(event) => event.stopPropagation()}>
          <View
            style={{
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              backgroundColor: '#FFF',
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 28
            }}
          >
            <View style={{ alignSelf: 'center', width: 48, height: 5, borderRadius: 999, backgroundColor: '#E2E8F0', marginBottom: 16 }} />
            <Text className="text-[20px] font-black text-foreground">{title}</Text>
            <Text className="mt-1 mb-4 text-[13px] font-semibold text-muted-foreground">
              {t('tapDesiredDay')}
            </Text>

            <HStack className="mb-3 items-center justify-between">
              <Pressable
                onPress={() => goMonth(-1)}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#F8FAFC]"
              >
                <Ionicons color={colors.ink} name="chevron-back" size={20} />
              </Pressable>
              <Text className="text-[17px] font-black text-foreground capitalize">
                {monthLabel} {viewYear}
              </Text>
              <Pressable
                onPress={() => goMonth(1)}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#F8FAFC]"
              >
                <Ionicons color={colors.ink} name="chevron-forward" size={20} />
              </Pressable>
            </HStack>

            <HStack className="mb-2">
              {weekdays.map((label) => (
                <Box key={label} className="flex-1 items-center py-1">
                  <Text className="text-[11px] font-black uppercase text-muted-foreground">{label}</Text>
                </Box>
              ))}
            </HStack>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {cells.map((cell, index) => {
                if (!cell.day || !cell.date) {
                  return <Box key={`empty-${index}`} className="w-[14.28%] py-2" />
                }

                const isSelected =
                  selected &&
                  cell.date.getFullYear() === selected.getFullYear() &&
                  cell.date.getMonth() === selected.getMonth() &&
                  cell.date.getDate() === selected.getDate()
                const isDisabled = minDay ? startOfDay(cell.date) < minDay : false
                const isToday =
                  cell.date.getFullYear() === new Date().getFullYear() &&
                  cell.date.getMonth() === new Date().getMonth() &&
                  cell.date.getDate() === new Date().getDate()

                return (
                  <Pressable
                    key={`${cell.date.toISOString()}-${index}`}
                    disabled={isDisabled}
                    onPress={() => handleSelect(cell.date!)}
                    className="w-[14.28%] items-center py-2"
                  >
                    <Box
                      className={`h-10 w-10 items-center justify-center rounded-full ${
                        isSelected ? 'bg-primary' : isToday ? 'bg-[#EDE9FE]' : ''
                      }`}
                      style={{ opacity: isDisabled ? 0.35 : 1 }}
                    >
                      <Text
                        className={`text-[15px] font-black ${
                          isSelected ? 'text-white' : isToday ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {cell.day}
                      </Text>
                    </Box>
                  </Pressable>
                )
              })}
            </View>

            <Pressable onPress={onClose} className="mt-4 items-center py-3">
              <Text className="text-[15px] font-bold text-muted-foreground">{t('cancel')}</Text>
            </Pressable>
          </View>
        </RNPressable>
      </RNPressable>
    </Modal>
  )
}
