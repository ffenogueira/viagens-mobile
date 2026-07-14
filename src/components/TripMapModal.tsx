import { Ionicons } from '@expo/vector-icons'
import * as WebBrowser from 'expo-web-browser'
import React, { useMemo } from 'react'
import { Linking, Modal, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('trip')
  const insets = useSafeAreaInsets()
  const googleMapsUrl = useMemo(() => buildGoogleMapsUrl(markers), [markers])

  async function openInteractiveMap() {
    if (!googleMapsUrl) return
    try {
      await WebBrowser.openBrowserAsync(googleMapsUrl)
    } catch {
      void Linking.openURL(googleMapsUrl)
    }
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
            <Text className="text-center text-[18px] font-black text-foreground">{t('mapItineraryTitle')}</Text>
            {destination ? (
              <Text className="mt-0.5 text-center text-[12px] font-semibold text-muted-foreground">{destination}</Text>
            ) : null}
          </Box>
          <Box className="h-11 w-11" />
        </HStack>

        <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}>
          {markers.length ? (
            <Box className="overflow-hidden rounded-b-[28px]">
              <TripMapCanvas markers={markers} height={340} />
            </Box>
          ) : null}

          <VStack className="gap-3 px-5 pt-5">
            <Box className="rounded-[24px] border border-[#EDE9FE] bg-white p-4">
              <HStack className="items-start gap-3">
                <Box className="h-11 w-11 items-center justify-center rounded-2xl bg-viagens-lilac">
                  <Ionicons color={colors.primary} name="hand-left-outline" size={21} />
                </Box>
                <VStack className="flex-1">
                  <Text className="text-[15px] font-black text-foreground">Quer mexer no mapa?</Text>
                  <Text className="mt-1 text-[12px] font-semibold leading-5 text-muted-foreground">
                    Toque em “Abrir mapa interativo” para arrastar, dar zoom, ver distância e seguir a rota dentro do app.
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Text className="text-[13px] font-semibold text-muted-foreground">
              {markers.length === 1
                ? t('markedPlaceSingular', { count: markers.length })
                : t('markedPlacePlural', { count: markers.length })}
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
              <Pressable onPress={() => void openInteractiveMap()} className="mt-2 h-14 items-center justify-center rounded-full bg-primary">
                <HStack className="items-center gap-2">
                  <Ionicons color={colors.white} name="map-outline" size={18} />
                  <Text className="text-[16px] font-black text-white">Abrir mapa interativo</Text>
                </HStack>
              </Pressable>
            ) : null}
          </VStack>
        </ScrollView>
      </View>
    </Modal>
  )
}
