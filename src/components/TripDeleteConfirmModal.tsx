import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { ActivityIndicator, Modal, Pressable as RNPressable, View } from 'react-native'
import { Box, HStack, Pressable, Text, VStack } from '../../components/ui'
import { colors } from '../theme'

type TripDeleteConfirmModalProps = {
  visible: boolean
  destination?: string
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function TripDeleteConfirmModal({
  visible,
  destination,
  loading = false,
  onCancel,
  onConfirm
}: TripDeleteConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <RNPressable
        style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', paddingHorizontal: 24 }}
        onPress={onCancel}
      >
        <RNPressable onPress={(event) => event.stopPropagation()}>
          <View
            style={{
              borderRadius: 28,
              backgroundColor: '#FFF',
              paddingHorizontal: 22,
              paddingTop: 24,
              paddingBottom: 22
            }}
          >
            <Box className="mb-4 h-14 w-14 items-center justify-center self-center rounded-2xl bg-[#FEE2E2]">
              <Ionicons color={colors.danger} name="trash-outline" size={28} />
            </Box>

            <Text className="text-center text-[22px] font-black text-foreground">Excluir viagem?</Text>
            <Text className="mt-2 text-center text-[14px] font-semibold leading-6 text-muted-foreground">
              {destination
                ? `“${destination}” será removida permanentemente, incluindo roteiro, gastos e memórias vinculadas.`
                : 'Esta viagem será removida permanentemente, incluindo roteiro, gastos e memórias vinculadas.'}
            </Text>
            <Text className="mt-3 text-center text-[13px] font-black" style={{ color: colors.danger }}>
              Esta ação não pode ser desfeita.
            </Text>

            <VStack className="mt-6 gap-3">
              <Pressable
                onPress={onConfirm}
                disabled={loading}
                className="h-14 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.danger }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text className="text-[16px] font-black text-white">Sim, excluir viagem</Text>
                )}
              </Pressable>
              <Pressable
                onPress={onCancel}
                disabled={loading}
                className="h-14 items-center justify-center rounded-full bg-[#F1F5F9]"
              >
                <Text className="text-[16px] font-black text-foreground">Cancelar</Text>
              </Pressable>
            </VStack>
          </View>
        </RNPressable>
      </RNPressable>
    </Modal>
  )
}
