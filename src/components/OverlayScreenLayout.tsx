import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { ScrollView } from 'react-native'
import { Box, HStack, Pressable, Text } from '../../components/ui'
import { colors } from '../theme'

type OverlayScreenLayoutProps = {
  title: string
  subtitle?: string
  onBack: () => void
  children: React.ReactNode
}

export function OverlayScreenLayout({ title, subtitle, onBack, children }: OverlayScreenLayoutProps) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
      <Pressable onPress={onBack} className="mb-4 flex-row items-center gap-2">
        <Ionicons color={colors.primary} name="arrow-back" size={20} />
        <Text className="text-sm font-black text-primary">Voltar</Text>
      </Pressable>

      <Text className="text-[28px] font-black text-foreground">{title}</Text>
      {subtitle ? (
        <Text className="mt-1 text-[14px] font-semibold leading-6 text-muted-foreground">{subtitle}</Text>
      ) : null}

      <Box className="mt-5">{children}</Box>
    </ScrollView>
  )
}

export function EmptyTripNotice({ onBack }: { onBack: () => void }) {
  return (
    <OverlayScreenLayout
      title="Selecione uma viagem"
      subtitle="Crie ou abra uma viagem na aba Viagem para usar esta ferramenta."
      onBack={onBack}
    >
      <Box className="rounded-[28px] border border-[#EEF2FF] bg-white p-6">
        <HStack className="items-center gap-3">
          <Ionicons color={colors.primary} name="airplane-outline" size={28} />
          <Text className="flex-1 text-[15px] font-semibold leading-6 text-muted-foreground">
            Volte para a home, crie sua viagem e tente novamente.
          </Text>
        </HStack>
      </Box>
    </OverlayScreenLayout>
  )
}
