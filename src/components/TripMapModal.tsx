import { Ionicons } from '@expo/vector-icons'
import React, { useMemo } from 'react'
import { Linking, Modal, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Box, HStack, Pressable, Text, VStack } from '../../components/ui'
import type { LeafletMapMarker } from '../lib/buildLeafletMapHtml'
import { buildGoogleMapsUrl } from '../lib/staticMap'
import { colors } from '../theme'
import { TripMapCanvas } from './TripMapCanvas'

type TripMapModalProps = {
  visible: boolean
  markers: LeafletMapMarker[]
  destination?: string
  onClose: () => void
}

export function TripMapModal({ visible, markers, destination, onClose }: TripMapModalProps) {
  const insets = useSafeAreaInsets()
  const googleMapsUrl = useMemo(() => buildGoogleMapsUrl(markers), [markers])

  function openExternalMap() {
    if (!googleMapsUrl) return
    void Linking.openURL(googleMapsUrl)
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <HStack
          className="items-center justify-between border-b border-[#EEF2FF] bg-white px-4"
          style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
        >
          <Pressable onPress={onClose} className="h-11 w-11 items-center justify-center rounded-full bg-[#F8FAFC]">
            <Ionicons color={colors.ink} name="close" size={22} />
          </Pressable>
          <Box className="flex-1 px-3">
            <Text className="text-center text-[18px] font-black text-foreground">Mapa do roteiro</Text>
            {destination ? (
              <Text className="mt-0.5 text-center text-[12px] font-semibold text-muted-foreground">{destination}</Text>
            ) : null}
          </Box>
          <Box className="h-11 w-11" />
        </HStack>

        <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}>
          {markers.length ? <TripMapCanvas markers={markers} height={260} /> : null}

          <VStack className="gap-3 px-5 pt-5">
            <Text className="text-[13px] font-semibold text-muted-foreground">
              {markers.length} {markers.length === 1 ? 'lugar marcado' : 'lugares marcados'} no roteiro
            </Text>

            {markers.map((marker) => (
              <HStack
                key={marker.id}
                className="items-center gap-3 rounded-[20px] border border-[#EEF2FF] bg-white px-4 py-3"
              >
                <Box className="h-9 w-9 items-center justify-center rounded-full bg-primary">
                  <Text className="text-[13px] font-black text-white">{marker.order}</Text>
                </Box>
                <VStack className="flex-1">
                  <Text className="text-[15px] font-black text-foreground">{marker.title}</Text>
                  {marker.dayLabel ? (
                    <Text className="text-[12px] font-semibold text-muted-foreground">{marker.dayLabel}</Text>
                  ) : null}
                </VStack>
                <Pressable
                  onPress={() => void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${marker.latitude},${marker.longitude}`)}
                  className="h-10 w-10 items-center justify-center rounded-full bg-[#F8FAFC]"
                >
                  <Ionicons color={colors.primary} name="navigate-outline" size={18} />
                </Pressable>
              </HStack>
            ))}

            {googleMapsUrl ? (
              <Pressable onPress={openExternalMap} className="mt-2 h-14 items-center justify-center rounded-full bg-primary">
                <HStack className="items-center gap-2">
                  <Ionicons color={colors.white} name="map-outline" size={18} />
                  <Text className="text-[16px] font-black text-white">Abrir rota no Google Maps</Text>
                </HStack>
              </Pressable>
            ) : null}
          </VStack>
        </ScrollView>
      </View>
    </Modal>
  )
}
