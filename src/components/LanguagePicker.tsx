import React from 'react'
import { Alert } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { Box, HStack, Pressable, Text, VStack } from '../../components/ui'
import { changeAppLocale, type AppLocale } from '../i18n'
import { LOCALE_OPTIONS } from '../i18n/types'
import { colors } from '../theme'

export function LanguagePicker({
  value,
  onChange
}: {
  value: AppLocale
  onChange?: (locale: AppLocale) => void
}) {
  const { t } = useTranslation('profile')

  async function selectLocale(locale: AppLocale) {
    if (locale === value) return
    await changeAppLocale(locale)
    onChange?.(locale)
    Alert.alert(t('language'), t('languageUpdated'))
  }

  return (
    <VStack className="gap-2">
      {LOCALE_OPTIONS.map((option) => {
        const active = option.id === value
        return (
          <Pressable
            key={option.id}
            onPress={() => void selectLocale(option.id)}
            className={`rounded-2xl border px-4 py-3 ${
              active ? 'border-primary bg-viagens-lilac' : 'border-border bg-card'
            }`}
          >
            <HStack className="items-center justify-between">
              <VStack>
                <Text className="text-[15px] font-black text-foreground">{option.nativeLabel}</Text>
                <Text className="text-[12px] font-semibold text-muted-foreground">{option.label}</Text>
              </VStack>
              {active ? <Ionicons color={colors.primary} name="checkmark-circle" size={22} /> : null}
            </HStack>
          </Pressable>
        )
      })}
    </VStack>
  )
}
