import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { HStack, Pressable, Text, VStack } from '../../components/ui'
import { formatIsoToBr } from '../lib/dates'
import { colors } from '../theme'
import { BrazilianCalendarModal } from './BrazilianCalendarModal'

type BrazilianDateFieldProps = {
  label: string
  value?: string | null
  onChange: (isoDate: string) => void
  minimumDate?: Date
}

export function BrazilianDateField({ label, value, onChange, minimumDate }: BrazilianDateFieldProps) {
  const [open, setOpen] = useState(false)
  const display = formatIsoToBr(value) || 'Selecionar data'

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
