import { Ionicons } from '@expo/vector-icons'
import * as WebBrowser from 'expo-web-browser'
import React, { useMemo } from 'react'
import { Image, Linking, Modal, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { WebView } from 'react-native-webview'
import { Box, HStack, Pressable, Text, VStack } from '../../components/ui'
import { buildLeafletMapHtml, type LeafletMapMarker } from '../lib/buildLeafletMapHtml'
import { buildGoogleMapsUrl } from '../lib/staticMap'
import { colors, shadow } from '../theme'

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
  const mapHtml = useMemo(
    () => buildLeafletMapHtml({ markers, primaryColor: colors.primary, interactive: true }),
    [markers]
  )

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
            <Box className="overflow-hidden rounded-b-[28px] bg-[#EEF2FF]">
              <WebView
                originWhitelist={['*']}
                source={{ html: mapHtml }}
                style={{ height: 390, width: '100%', backgroundColor: '#EEF2FF' }}
                javaScriptEnabled
                domStorageEnabled
                nestedScrollEnabled
                mixedContentMode="always"
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              />
            </Box>
          ) : null}

          <VStack className="gap-3 px-5 pt-4">
            <Box className="rounded-[22px] border border-[#EDE9FE] bg-white px-4 py-3" style={shadow}>
              <HStack className="items-start gap-3">
                <Box className="h-10 w-10 items-center justify-center rounded-2xl bg-viagens-lilac">
                  <Ionicons color={colors.primary} name="finger-print-outline" size={20} />
                </Box>
                <VStack className="flex-1">
                  <Text className="text-[14px] font-black text-foreground">{t('mapPinsHintTitle')}</Text>
                  <Text className="mt-1 text-[12px] font-semibold leading-5 text-muted-foreground">
                    {t('mapPinsHintBody')}
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
                className="items-center gap-3 rounded-[22px] border border-[#EEF2FF] bg-white p-3"
                style={shadow}
              >
                {marker.photoUrl ? (
                  <Image source={{ uri: marker.photoUrl }} style={{ height: 64, width: 64, borderRadius: 18 }} />
                ) : (
                  <Box className="h-16 w-16 items-center justify-center rounded-[18px] bg-viagens-lilac">
                    <Text className="text-[16px] font-black text-primary">{marker.order}</Text>
                  </Box>
                )}
                <VStack className="flex-1">
                  <Text className="text-[15px] font-black leading-5 text-foreground" numberOfLines={2}>{marker.title}</Text>
                  {marker.address ? (
                    <Text className="mt-0.5 text-[11px] font-semibold text-muted-foreground" numberOfLines={1}>
                      {marker.address}
                    </Text>
                  ) : marker.dayLabel ? (
                    <Text className="mt-0.5 text-[11px] font-semibold text-muted-foreground">{marker.dayLabel}</Text>
                  ) : null}
                  <HStack className="mt-2 flex-wrap gap-1.5">
                    {marker.timeLabel ? <MapChip label={marker.timeLabel} icon="time-outline" /> : null}
                    {marker.ratingLabel ? <MapChip label={marker.ratingLabel} icon="star-outline" /> : null}
                    {marker.distanceLabel ? <MapChip label={marker.distanceLabel} icon="navigate-outline" /> : null}
                  </HStack>
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
              <Pressable onPress={() => void openInteractiveMap()} className="mt-2 h-12 items-center justify-center rounded-full bg-[#F3E8FF]">
                <HStack className="items-center gap-2">
                  <Ionicons color={colors.primary} name="map-outline" size={17} />
                  <Text className="text-[14px] font-black text-primary">{t('openGoogleMaps')}</Text>
                </HStack>
              </Pressable>
            ) : null}
          </VStack>
        </ScrollView>
      </View>
    </Modal>
  )
}

function MapChip({
  icon,
  label
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
}) {
  return (
    <HStack className="items-center gap-1 rounded-full bg-[#F8FAFC] px-2 py-1">
      <Ionicons color={colors.primary} name={icon} size={12} />
      <Text className="text-[10px] font-black text-primary" numberOfLines={1}>
        {label}
      </Text>
    </HStack>
  )
}
