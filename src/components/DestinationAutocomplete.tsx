import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, TextInput } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Box, HStack, Pressable, Text, VStack } from '../../components/ui'
import { searchPlaces, type PlaceSuggestion } from '../api/client'
import { colors } from '../theme'

type DestinationAutocompleteProps = {
  label?: string
  value: string
  placeholder?: string
  onChangeText: (value: string) => void
  onSelectPlace: (place: PlaceSuggestion) => void
}

export function DestinationAutocomplete({
  label,
  value,
  placeholder,
  onChangeText,
  onSelectPlace
}: DestinationAutocompleteProps) {
  const { t } = useTranslation('common')
  const [results, setResults] = useState<PlaceSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  const resolvedLabel = label ?? t('destinationLabel')
  const resolvedPlaceholder = placeholder ?? t('destinationPlaceholder')

  useEffect(() => {
    const query = value.trim()
    if (query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(() => {
      void (async () => {
        setLoading(true)
        try {
          const places = await searchPlaces(query)
          setResults(places)
        } catch {
          setResults([])
        } finally {
          setLoading(false)
        }
      })()
    }, 280)

    return () => clearTimeout(timer)
  }, [value])

  const showDropdown = focused && value.trim().length >= 2 && (loading || results.length > 0)

  function handleSelect(place: PlaceSuggestion) {
    onSelectPlace(place)
    setSelectedLabel(place.label)
    setFocused(false)
    setResults([])
  }

  return (
    <VStack className="gap-2">
      <Text className="text-[13px] font-black text-foreground">{resolvedLabel}</Text>
      <HStack className="min-h-[60px] items-center rounded-[22px] border border-[#E5E7EB] bg-white px-4">
        <Ionicons color={colors.primary} name="globe-outline" size={21} />
        <TextInput
          value={value}
          onChangeText={(text) => {
            setSelectedLabel(null)
            onChangeText(text)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 180)
          }}
          placeholder={resolvedPlaceholder}
          placeholderTextColor="#94A3B8"
          autoCorrect={false}
          className="ml-3 flex-1 text-[16px] font-black text-foreground"
        />
        {loading ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Ionicons color={colors.muted} name="chevron-down" size={18} />
        )}
      </HStack>

      {selectedLabel ? (
        <Text className="text-[12px] font-semibold text-primary">{t('selectedPlace', { label: selectedLabel })}</Text>
      ) : null}

      {showDropdown ? (
        <Box className="max-h-[220px] overflow-hidden rounded-[22px] border border-[#E5E7EB] bg-white">
          {loading && !results.length ? (
            <Box className="items-center px-4 py-5">
              <ActivityIndicator color={colors.primary} />
              <Text className="mt-2 text-[13px] font-semibold text-muted-foreground">{t('searchingCities')}</Text>
            </Box>
          ) : null}
          {results.map((place, index) => (
            <Pressable
              key={`${place.id}-${place.label}`}
              onPress={() => handleSelect(place)}
              className={`px-4 py-3 ${index < results.length - 1 ? 'border-b border-[#F1F5F9]' : ''}`}
            >
              <Text className="text-[15px] font-black text-foreground">{place.name}</Text>
              <Text className="mt-0.5 text-[12px] font-semibold text-muted-foreground">
                {[place.region, place.country].filter(Boolean).join(' · ')}
              </Text>
            </Pressable>
          ))}
          {!loading && results.length === 0 ? (
            <Box className="px-4 py-4">
              <Text className="text-[13px] font-semibold text-muted-foreground">{t('noCitiesFound')}</Text>
            </Box>
          ) : null}
        </Box>
      ) : null}
    </VStack>
  )
}
