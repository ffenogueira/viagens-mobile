import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Box, HStack, Text, VStack } from '../../components/ui'
import { fetchWeatherForecast } from '../api/client'
import { EmptyTripNotice, OverlayScreenLayout } from '../components/OverlayScreenLayout'
import { formatAppDate } from '../i18n/format'
import { colors, shadow } from '../theme'
import type { Trip, WeatherDay } from '../types/trip'

export function WeatherScreen({
  selectedTrip,
  onBack
}: {
  selectedTrip: Trip | null
  onBack: () => void
}) {
  const { t } = useTranslation('trip')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [place, setPlace] = useState('')
  const [days, setDays] = useState<WeatherDay[]>([])

  useEffect(() => {
    if (!selectedTrip) return

    void (async () => {
      setLoading(true)
      setError('')
      try {
        const forecast = await fetchWeatherForecast(selectedTrip.destination, selectedTrip.country)
        setPlace(forecast.place)
        setDays(forecast.days)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('weatherLoadFailed'))
      } finally {
        setLoading(false)
      }
    })()
  }, [selectedTrip, t])

  if (!selectedTrip) {
    return <EmptyTripNotice onBack={onBack} />
  }

  return (
    <OverlayScreenLayout
      title={t('weatherTitle')}
      subtitle={place || `${selectedTrip.destination}${selectedTrip.country ? `, ${selectedTrip.country}` : ''}`}
      onBack={onBack}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} className="my-10" />
      ) : error ? (
        <Text className="text-sm font-semibold text-red-600">{error}</Text>
      ) : (
        <VStack className="gap-3">
          {days.map((day) => (
            <Box key={day.date} className="rounded-[24px] border border-[#EEF2FF] bg-white p-4" style={shadow}>
              <HStack className="items-center justify-between">
                <HStack className="items-center gap-3">
                  <Box className="h-12 w-12 items-center justify-center rounded-2xl bg-viagens-sky-soft">
                    <Ionicons color={colors.sky} name={day.icon as keyof typeof Ionicons.glyphMap} size={24} />
                  </Box>
                  <VStack>
                    <Text className="text-[16px] font-black capitalize text-foreground">{day.weekday}</Text>
                    <Text className="text-[12px] font-semibold text-muted-foreground">
                      {formatAppDate(`${day.date}T12:00:00`, {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </Text>
                  </VStack>
                </HStack>
                <VStack className="items-end">
                  <Text className="text-[18px] font-black text-foreground">
                    {day.maxC}° / {day.minC}°
                  </Text>
                  <Text className="text-[12px] font-semibold text-muted-foreground">{day.label}</Text>
                </VStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </OverlayScreenLayout>
  )
}
