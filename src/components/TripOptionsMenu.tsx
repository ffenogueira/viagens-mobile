import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Modal, Pressable as RNPressable, View } from 'react-native'
import { Box, HStack, Pressable, Text, VStack } from '../../components/ui'
import { colors, shadowStrong } from '../theme'

type TripOptionsMenuProps = {
  visible: boolean
  onClose: () => void
  onEditTrip: () => void
  onChangeCover: () => void
  onDeleteTrip: () => void
}

type MenuOption = {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  detail: string
  tone?: 'default' | 'danger'
  onPress: () => void
}

export function TripOptionsMenu({
  visible,
  onClose,
  onEditTrip,
  onChangeCover,
  onDeleteTrip
}: TripOptionsMenuProps) {
  const options: MenuOption[] = [
    {
      icon: 'create-outline',
      label: 'Editar viagem',
      detail: 'Destino, datas e detalhes',
      onPress: () => {
        onClose()
        onEditTrip()
      }
    },
    {
      icon: 'camera-outline',
      label: 'Trocar foto de capa',
      detail: 'Galeria ou câmera',
      onPress: () => {
        onClose()
        onChangeCover()
      }
    },
    {
      icon: 'trash-outline',
      label: 'Excluir viagem',
      detail: 'Remove roteiro e dados da viagem',
      tone: 'danger',
      onPress: () => {
        onClose()
        onDeleteTrip()
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
            <Text className="text-[20px] font-black text-foreground">Opções da viagem</Text>
            <Text className="mt-1 mb-4 text-[13px] font-semibold text-muted-foreground">
              Escolha o que deseja fazer
            </Text>

            <VStack className="gap-3">
              {options.map((option) => (
                <Pressable
                  key={option.label}
                  onPress={option.onPress}
                  className={`rounded-[20px] border px-4 py-4 ${
                    option.tone === 'danger' ? 'border-[#FECACA] bg-[#FEF2F2]' : 'border-[#EEF2FF] bg-[#FAFAFF]'
                  }`}
                  style={shadowStrong}
                >
                  <HStack className="items-center gap-3">
                    <Box
                      className={`h-11 w-11 items-center justify-center rounded-2xl ${
                        option.tone === 'danger' ? 'bg-white' : 'bg-white'
                      }`}
                    >
                      <Ionicons
                        color={option.tone === 'danger' ? colors.danger : colors.primary}
                        name={option.icon}
                        size={22}
                      />
                    </Box>
                    <VStack className="flex-1">
                      <Text
                        className="text-[16px] font-black"
                        style={option.tone === 'danger' ? { color: colors.danger } : undefined}
                      >
                        {option.label}
                      </Text>
                      <Text className="text-[12px] font-semibold text-muted-foreground">{option.detail}</Text>
                    </VStack>
                    <Ionicons color={colors.muted} name="chevron-forward" size={18} />
                  </HStack>
                </Pressable>
              ))}
            </VStack>

            <Pressable onPress={onClose} className="mt-5 items-center rounded-full bg-[#F1F5F9] py-4">
              <Text className="text-[15px] font-black text-foreground">Cancelar</Text>
            </Pressable>
          </View>
        </RNPressable>
      </RNPressable>
    </Modal>
  )
}
