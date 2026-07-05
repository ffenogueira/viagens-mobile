import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Modal, Pressable as RNPressable, View } from 'react-native'
import { Box, HStack, Pressable, Text, VStack } from '../../components/ui'
import { colors, shadowStrong } from '../theme'
import type { NavigationTarget, Tab } from '../types/trip'

type QuickCreateMenuProps = {
  visible: boolean
  onClose: () => void
  onCreateTrip: () => void
  onNavigate: (target: NavigationTarget) => void
  onSetTab: (tab: Tab) => void
}

type QuickAction = {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  detail: string
  onPress: () => void
}

export function QuickCreateMenu({
  visible,
  onClose,
  onCreateTrip,
  onNavigate,
  onSetTab
}: QuickCreateMenuProps) {
  const actions: QuickAction[] = [
    {
      icon: 'airplane-outline',
      label: 'Nova viagem',
      detail: 'Destino, datas e descrição',
      onPress: () => {
        onClose()
        onCreateTrip()
      }
    },
    {
      icon: 'sparkles-outline',
      label: 'FEFAI',
      detail: 'Sugestões e assistente de viagem',
      onPress: () => {
        onClose()
        onSetTab('tools')
      }
    },
    {
      icon: 'wallet-outline',
      label: 'Gastos',
      detail: 'Registrar despesas da viagem',
      onPress: () => {
        onClose()
        onNavigate('expenses')
      }
    },
    {
      icon: 'water-outline',
      label: 'Banheiros',
      detail: 'Utilidades perto de você',
      onPress: () => {
        onClose()
        onSetTab('utilities')
      }
    },
    {
      icon: 'scan-outline',
      label: 'Ler preço',
      detail: 'Câmera e OCR',
      onPress: () => {
        onClose()
        onNavigate('tools-camera')
      }
    }
  ]

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
            <Text className="text-[20px] font-black text-foreground">Criar ou acessar</Text>
            <Text className="mt-1 mb-4 text-[13px] font-semibold text-muted-foreground">
              Atalhos rápidos como no Instagram
            </Text>

            <VStack className="gap-3">
              {actions.map((action) => (
                <Pressable
                  key={action.label}
                  onPress={action.onPress}
                  className="rounded-[20px] border border-[#EEF2FF] bg-[#FAFAFF] px-4 py-4"
                  style={shadowStrong}
                >
                  <HStack className="items-center gap-3">
                    <Box className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
                      <Ionicons color={colors.primary} name={action.icon} size={22} />
                    </Box>
                    <VStack className="flex-1">
                      <Text className="text-[16px] font-black text-foreground">{action.label}</Text>
                      <Text className="text-[12px] font-semibold text-muted-foreground">{action.detail}</Text>
                    </VStack>
                    <Ionicons color={colors.muted} name="chevron-forward" size={18} />
                  </HStack>
                </Pressable>
              ))}
            </VStack>

            <Pressable onPress={onClose} className="mt-5 items-center rounded-full bg-[#F1F5F9] py-4">
              <Text className="text-[15px] font-black text-foreground">Fechar</Text>
            </Pressable>
          </View>
        </RNPressable>
      </RNPressable>
    </Modal>
  )
}
