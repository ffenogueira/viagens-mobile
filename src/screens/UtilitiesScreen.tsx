import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Linking, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  ButtonText,
  HStack,
  Pressable,
  Text,
  VStack
} from '../../components/ui'
import {
  fetchLuggageStorage,
  fetchNearbyToilets,
  type LuggageCity,
  type ToiletPlace
} from '../api/client'
import { SectionTitle } from '../components/shared'
import { colors, shadow } from '../theme'

type UtilityView = 'hub' | 'toilets' | 'luggage' | 'currency' | 'street'

const WEB_BASE = 'https://viagens.upyouridea.com.br'

export function UtilitiesScreen() {
  const { t } = useTranslation('utilities')
  const [view, setView] = useState<UtilityView>('hub')

  if (view !== 'hub') {
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
        <Pressable onPress={() => setView('hub')} className="mb-4 flex-row items-center gap-2">
          <Ionicons color={colors.primary} name="arrow-back" size={20} />
          <Text className="text-sm font-black text-primary">{t('common:back', { defaultValue: 'Voltar' })}</Text>
        </Pressable>
        {view === 'toilets' && <ToiletsPanel />}
        {view === 'luggage' && <LuggagePanel />}
        {view === 'currency' && <CurrencyPanel />}
        {view === 'street' && <StreetViewPanel />}
      </ScrollView>
    )
  }

  const cards = [
    {
      id: 'toilets' as const,
      title: t('toiletsTitle'),
      subtitle: t('toiletsSubtitle'),
      icon: 'water-outline' as const,
      color: colors.primary
    },
    {
      id: 'luggage' as const,
      title: t('luggageTitle'),
      subtitle: t('luggageSubtitle'),
      icon: 'briefcase-outline' as const,
      color: colors.sky
    },
    {
      id: 'currency' as const,
      title: t('currencyTitle'),
      subtitle: t('currencySubtitle'),
      icon: 'cash-outline' as const,
      color: colors.mint
    },
    {
      id: 'street' as const,
      title: t('streetTitle'),
      subtitle: t('streetSubtitle'),
      icon: 'navigate-outline' as const,
      color: colors.orange
    }
  ]

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
      <SectionTitle
        kicker={t('kicker')}
        title={t('title')}
        subtitle={t('subtitle')}
      />

      <VStack className="gap-3">
        {cards.map((card) => (
          <Pressable
            key={card.id}
            onPress={() => setView(card.id)}
            className="rounded-[28px] border border-[#EEF2FF] bg-white p-4"
            style={shadow}
          >
            <HStack className="items-center gap-4">
              <Box
                className="h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${card.color}18` }}
              >
                <Ionicons color={card.color} name={card.icon} size={26} />
              </Box>
              <VStack className="flex-1">
                <Text className="text-[17px] font-black text-foreground">{card.title}</Text>
                <Text className="mt-1 text-[13px] font-semibold text-muted-foreground">{card.subtitle}</Text>
              </VStack>
              <Ionicons color={colors.mutedLight} name="chevron-forward" size={20} />
            </HStack>
          </Pressable>
        ))}
      </VStack>

      <Pressable
        onPress={() => Linking.openURL(`${WEB_BASE}/utilities`)}
        className="mt-5 items-center rounded-2xl bg-viagens-lilac px-4 py-3"
      >
        <Text className="text-sm font-black text-primary">{t('openFullSite')}</Text>
      </Pressable>
    </ScrollView>
  )
}

function ToiletsPanel() {
  const { t } = useTranslation('utilities')
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ToiletPlace[]>([])
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const permission = await Location.requestForegroundPermissionsAsync()
      if (permission.status !== 'granted') {
        setError(t('locationDenied'))
        setLoading(false)
        return
      }
      const coords = await Location.getCurrentPositionAsync({})
      const toilets = await fetchNearbyToilets(coords.coords.latitude, coords.coords.longitude)
      setItems(toilets)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('toiletsLoadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <VStack>
      <Text className="text-2xl font-black text-foreground">{t('toiletsTitle')}</Text>
      <Text className="mt-1 text-sm font-semibold text-muted-foreground">{t('toiletsRadius')}</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} className="my-8" />
      ) : error ? (
        <Text className="my-6 text-sm font-semibold text-red-600">{error}</Text>
      ) : (
        <VStack className="mt-4 gap-3">
          {items.length === 0 ? (
            <Text className="text-sm text-muted-foreground">{t('noToilets')}</Text>
          ) : (
            items.slice(0, 15).map((toilet) => (
              <Pressable
                key={toilet.id}
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps/search/?api=1&query=${toilet.lat},${toilet.lng}`
                  )
                }
                className="rounded-2xl border border-[#EEF2FF] bg-white p-4"
                style={shadow}
              >
                <Text className="font-black text-foreground">{toilet.name}</Text>
                {toilet.address ? (
                  <Text className="mt-1 text-sm text-muted-foreground">{toilet.address}</Text>
                ) : null}
                <Text className="mt-2 text-sm font-extrabold text-primary">
                  {toilet.distance_m < 1000
                    ? `${toilet.distance_m} m`
                    : `${(toilet.distance_m / 1000).toFixed(1)} km`}
                  {' · '}
                  {toilet.fee_label}
                </Text>
              </Pressable>
            ))
          )}
        </VStack>
      )}
      <Button className="mt-4 rounded-full bg-primary" onPress={load}>
        <ButtonText className="font-black text-white">{t('refresh')}</ButtonText>
      </Button>
    </VStack>
  )
}

function LuggagePanel() {
  const { t } = useTranslation('utilities')
  const [loading, setLoading] = useState(true)
  const [cities, setCities] = useState<LuggageCity[]>([])
  const [nearest, setNearest] = useState<LuggageCity | null>(null)
  const [coupon, setCoupon] = useState('UPYOURIDEA')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const permission = await Location.requestForegroundPermissionsAsync()
        let lat: number | undefined
        let lng: number | undefined
        if (permission.status === 'granted') {
          const coords = await Location.getCurrentPositionAsync({})
          lat = coords.coords.latitude
          lng = coords.coords.longitude
        }
        const data = await fetchLuggageStorage(lat, lng)
        setCities(data.cities)
        setNearest(data.nearest_city)
        setCoupon(data.radical_coupon ?? 'UPYOURIDEA')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) return <ActivityIndicator color={colors.primary} className="my-8" />

  return (
    <VStack>
      <Text className="text-2xl font-black text-foreground">{t('luggageHeading')}</Text>
      <Text className="mt-1 text-sm font-semibold text-muted-foreground">
        {t('common:partnerPayment')}
      </Text>
      <Box className="mt-3 rounded-2xl border border-[#EDE9FE] bg-viagens-lilac px-4 py-3">
        <Text className="text-[13px] font-semibold leading-5 text-primary">
          {t('radicalCoupon', { coupon })}
        </Text>
      </Box>
      {nearest ? (
        <Box className="mt-4 rounded-2xl border border-purple-200 bg-viagens-lilac p-4">
          <Text className="text-xs font-black uppercase text-primary">{t('nearestLabel')}</Text>
          <Text className="mt-1 text-xl font-black text-foreground">{nearest.name}</Text>
          <HStack className="mt-3 gap-2">
            <Button
              size="sm"
              className="rounded-xl bg-sky-500"
              onPress={() => Linking.openURL(nearest.links.radical_storage)}
            >
              <ButtonText className="text-white">{t('radicalCta', { coupon })}</ButtonText>
            </Button>
            <Button
              size="sm"
              className="rounded-xl bg-emerald-500"
              onPress={() => Linking.openURL(nearest.links.bounce)}
            >
              <ButtonText className="text-white">{t('bounceCta')}</ButtonText>
            </Button>
          </HStack>
        </Box>
      ) : null}
      <VStack className="mt-4 gap-3">
        {cities.slice(0, 8).map((city) => (
          <Box key={`${city.name}-${city.country}`} className="rounded-2xl border border-[#EEF2FF] bg-white p-4" style={shadow}>
            <Text className="font-black text-foreground">{city.name}</Text>
            <Text className="text-sm text-muted-foreground">{city.country}</Text>
            <HStack className="mt-3 gap-2">
              <Pressable onPress={() => Linking.openURL(city.links.radical_storage)}>
                <Text className="text-xs font-black text-sky-600">{t('radicalCta', { coupon })} ↗</Text>
              </Pressable>
              <Pressable onPress={() => Linking.openURL(city.links.bounce)}>
                <Text className="text-xs font-black text-emerald-600">{t('bounceCta')} ↗</Text>
              </Pressable>
            </HStack>
          </Box>
        ))}
      </VStack>
    </VStack>
  )
}

function CurrencyPanel() {
  const { t } = useTranslation('utilities')
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState('BRL')
  const [to, setTo] = useState('EUR')
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  async function convert() {
    setLoading(true)
    try {
      const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`)
      const data = await response.json()
      setRate(data.rates?.[to] ?? null)
    } catch {
      setRate(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void convert()
  }, [from, to])

  const parsed = Number(amount.replace(',', '.')) || 0
  const result = rate != null ? (parsed * rate).toFixed(2) : '—'

  const pairs = [
    ['BRL', 'EUR'],
    ['BRL', 'USD'],
    ['EUR', 'USD'],
    ['USD', 'BRL']
  ] as const

  return (
    <VStack>
      <Text className="text-2xl font-black text-foreground">{t('currencyHeading')}</Text>
      <Text className="mt-1 text-sm font-semibold text-muted-foreground">{t('currencyHint')}</Text>
      <Box className="mt-4 rounded-2xl border border-[#EEF2FF] bg-white p-4" style={shadow}>
        <Text className="text-sm font-black text-foreground">{t('value')}</Text>
        <Text className="mt-2 text-3xl font-black text-primary">{amount || '0'} {from}</Text>
        <Text className="mt-4 text-sm font-black text-foreground">{t('result')}</Text>
        <Text className="mt-1 text-2xl font-black text-foreground">
          {loading ? '...' : `${result} ${to}`}
        </Text>
        {rate ? (
          <Text className="mt-2 text-xs font-semibold text-muted-foreground">
            1 {from} = {rate.toFixed(4)} {to}
          </Text>
        ) : null}
      </Box>
      <Text className="mb-2 mt-4 text-xs font-black uppercase text-muted-foreground">{t('quickPairs')}</Text>
      <HStack className="flex-wrap gap-2">
        {pairs.map(([a, b]) => (
          <Pressable
            key={`${a}-${b}`}
            onPress={() => {
              setFrom(a)
              setTo(b)
            }}
            className={`rounded-full px-3 py-2 ${from === a && to === b ? 'bg-primary' : 'bg-viagens-lilac'}`}
          >
            <Text className={`text-xs font-black ${from === a && to === b ? 'text-white' : 'text-primary'}`}>
              {a} → {b}
            </Text>
          </Pressable>
        ))}
      </HStack>
      <Button className="mt-4 rounded-full bg-primary" onPress={convert}>
        <ButtonText className="font-black text-white">{t('updateRate')}</ButtonText>
      </Button>
    </VStack>
  )
}

function StreetViewPanel() {
  const { t } = useTranslation('utilities')
  const places = [
    { name: 'Rio de Janeiro', query: 'Copacabana, Rio de Janeiro' },
    { name: 'Lisboa', query: 'Praça do Comércio, Lisboa' },
    { name: 'Paris', query: 'Tour Eiffel, Paris' },
    { name: 'Barcelona', query: 'La Rambla, Barcelona' }
  ]

  return (
    <VStack>
      <Text className="text-2xl font-black text-foreground">{t('streetTitle')}</Text>
      <Text className="mt-1 text-sm font-semibold text-muted-foreground">
        {t('streetExploreSubtitle')}
      </Text>
      <VStack className="mt-4 gap-3">
        {places.map((place) => (
          <Pressable
            key={place.name}
            onPress={() =>
              Linking.openURL(
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.query)}&layer=c`
              )
            }
            className="rounded-2xl border border-[#EEF2FF] bg-white p-4"
            style={shadow}
          >
            <HStack className="items-center justify-between">
              <VStack>
                <Text className="font-black text-foreground">{place.name}</Text>
                <Text className="text-sm text-muted-foreground">{t('openGoogleMaps')}</Text>
              </VStack>
              <Ionicons color={colors.orange} name="navigate" size={22} />
            </HStack>
          </Pressable>
        ))}
      </VStack>
      <Pressable
        onPress={() => Linking.openURL(`${WEB_BASE}/#street-view`)}
        className="mt-4 items-center rounded-2xl bg-viagens-lilac px-4 py-3"
      >
        <Text className="text-sm font-black text-primary">{t('moreCitiesOnSite')}</Text>
      </Pressable>
    </VStack>
  )
}
