import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Modal } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Box, HStack, Pressable, Text, VStack } from '../../components/ui'
import type { AppLocale } from '../i18n'
import { LanguagePicker } from './LanguagePicker'
import { colors } from '../theme'

export function LanguageSheet({
  visible,
  value,
  onClose,
  onChange
}: {
  visible: boolean
  value: AppLocale
  onClose: () => void
  onChange: (locale: AppLocale) => void
}) {
  const { t } = useTranslation('profile')
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Box className="flex-1 justify-end bg-black/35">
        <Box
          className="rounded-t-[34px] bg-white px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <Box className="mb-5 h-1.5 w-14 self-center rounded-full bg-[#D1D5DB]" />
          <HStack className="mb-5 items-start justify-between gap-4">
            <VStack className="flex-1">
              <Text className="text-[24px] font-black text-foreground">{t('language')}</Text>
              <Text className="mt-1 text-[14px] font-semibold leading-5 text-muted-foreground">
                {t('languageSheetDesc')}
              </Text>
            </VStack>
            <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full bg-[#F1F5F9]">
              <Ionicons color={colors.ink} name="close" size={20} />
            </Pressable>
          </HStack>
          <LanguagePicker value={value} onChange={onChange} />
        </Box>
      </Box>
    </Modal>
  )
}
