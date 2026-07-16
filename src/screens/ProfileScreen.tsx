import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useState } from 'react'
import { ScrollView } from 'react-native'
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
import type { AuthUser } from '../api/client'
import { updateUserLocale } from '../api/client'
import { LanguagePicker } from '../components/LanguagePicker'
import { UserAvatar } from '../components/UserAvatar'
import { getActiveLocale, type AppLocale } from '../i18n'
import { colors, gradients } from '../theme'

type ProfileScreenProps = {
  user: AuthUser | null
  tripCount: number
  onLogout: () => void
  onReplayTour: () => void
}

export function ProfileScreen({ user, tripCount, onLogout, onReplayTour }: ProfileScreenProps) {
  const { t } = useTranslation('profile')
  const [locale, setLocale] = useState<AppLocale>(getActiveLocale())

  const menuItems: Array<{
    icon: keyof typeof Ionicons.glyphMap
    label: string
    desc: string
    onPress?: () => void
  }> = [
    { icon: 'map-outline' as const, label: t('appTour'), desc: t('appTourDesc'), onPress: onReplayTour },
    { icon: 'notifications-outline' as const, label: t('notifications'), desc: t('notificationsDesc') },
    { icon: 'shield-checkmark-outline' as const, label: t('privacy'), desc: t('privacyDesc') },
    { icon: 'help-circle-outline' as const, label: t('help'), desc: t('helpDesc') }
  ]

  async function handleLocaleChange(next: AppLocale) {
    setLocale(next)
    try {
      await updateUserLocale(next)
    } catch {
      // Preferência local já foi salva pelo LanguagePicker
    }
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
      <Box className="mb-6 overflow-hidden rounded-3xl shadow-soft-3">
        <LinearGradient colors={[...gradients.hero]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 24, alignItems: 'center' }}>
          <UserAvatar
            name={user?.name}
            className="mb-4 h-[88px] w-[88px] border-[3px] border-white/50 bg-white/20"
            fallbackClassName="text-3xl font-black text-white"
          />

          <Text className="text-2xl font-black text-white">{user?.name || t('settings')}</Text>
          <Text className="mt-1 text-sm font-semibold text-white/80">
            {user?.email || t('connectedProfile')}
          </Text>

          <HStack className="mt-6 w-full items-center rounded-3xl bg-white/15 px-6 py-4">
            <VStack className="flex-1 items-center gap-1">
              <Text className="text-xl font-black text-white">{tripCount}</Text>
              <Text className="text-xs font-bold text-white/75">{t('trips')}</Text>
            </VStack>
            <Box className="h-8 w-px bg-white/25" />
            <VStack className="flex-1 items-center gap-1">
              <Text className="text-xl font-black text-white">{t('pro')}</Text>
              <Text className="text-xs font-bold text-white/75">{t('plan')}</Text>
            </VStack>
            <Box className="h-8 w-px bg-white/25" />
            <VStack className="flex-1 items-center gap-1">
              <Ionicons color="#FFFFFF" name="sparkles" size={20} />
              <Text className="text-xs font-bold text-white/75">FEFAI</Text>
            </VStack>
          </HStack>
        </LinearGradient>
      </Box>

      <Text className="mb-4 text-lg font-black text-foreground">{t('settings')}</Text>

      <Box className="mb-4 rounded-3xl border border-border bg-card p-4 shadow-soft-1">
        <Text className="font-black text-foreground">{t('language')}</Text>
        <Text className="mt-0.5 text-sm font-semibold text-muted-foreground">{t('languageDesc')}</Text>
        <Box className="mt-4">
          <LanguagePicker value={locale} onChange={(next) => void handleLocaleChange(next)} />
        </Box>
      </Box>

      {menuItems.map((item) => (
        <Pressable key={item.label} className="mb-3" onPress={item.onPress}>
          <HStack className="items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft-1">
            <Box className="h-11 w-11 items-center justify-center rounded-2xl bg-viagens-lilac">
              <Ionicons color={colors.primary} name={item.icon} size={22} />
            </Box>
            <VStack className="flex-1">
              <Text className="font-black text-foreground">{item.label}</Text>
              <Text className="mt-0.5 text-sm font-semibold text-muted-foreground">{item.desc}</Text>
            </VStack>
            <Ionicons color="#94A3B8" name="chevron-forward" size={18} />
          </HStack>
        </Pressable>
      ))}

      <Button className="mt-4 h-14 rounded-full bg-foreground" onPress={onLogout}>
        <ButtonText className="font-black text-white">{t('logout')}</ButtonText>
      </Button>
    </ScrollView>
  )
}
