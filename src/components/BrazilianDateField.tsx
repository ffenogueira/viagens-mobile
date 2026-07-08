import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HStack, Pressable, Text, VStack } from '../../components/ui'
import { formatAppDate } from '../i18n/format'
import { colors } from '../theme'
import { BrazilianCalendarModal } from './BrazilianCalendarModal'

type BrazilianDateFieldProps = {
  label: string
  value?: string | null
  onChange: (isoDate: string) => void
  minimumDate?: Date
}

function formatSelectedDate(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return formatAppDate(date, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function BrazilianDateField({ label, value, onChange, minimumDate }: BrazilianDateFieldProps) {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const display = formatSelectedDate(value) || t('selectDate')

  return (
    <VStack className="gap-2">
      <Text className="text-[11px] font-black uppercase text-muted-foreground">{label}</Text>
      <Pressable onPress={() => setOpen(true)}>
        <HStack className="h-[52px] items-center justify-between rounded-[16px] border border-[#E5E7EB] bg-white px-4">
          <Text className={`text-[16px] font-semibold ${value ? 'text-foreground' : 'text-muted-foreground'}`}>
            {display}
          </Text>
          <Ionicons color={colors.primary} name="calendar-outline" size={20} />
        </HStack>
      </Pressable>

      <BrazilianCalendarModal
        visible={open}
        title={label}
        value={value}
        minimumDate={minimumDate}
        onClose={() => setOpen(false)}
        onSelect={onChange}
      />
    </VStack>
  )
}
