import { Ionicons } from '@expo/vector-icons'
import React, { useMemo } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Box, HStack, Pressable, Text } from '../../components/ui'
import { colors, shadowStrong } from '../theme'
import type { Tab } from '../types/trip'

type TabItem = {
  id: Tab
  icon: keyof typeof Ionicons.glyphMap
  labelKey: 'today' | 'utilities' | 'memories' | 'profile'
}

const leftTabs: TabItem[] = [
  { id: 'today', icon: 'compass-outline', labelKey: 'today' },
  { id: 'utilities', icon: 'grid-outline', labelKey: 'utilities' }
]

const rightTabs: TabItem[] = [
  { id: 'memories', icon: 'images-outline', labelKey: 'memories' },
  { id: 'profile', icon: 'person-outline', labelKey: 'profile' }
]

function TabButton({
  tab,
  label,
  active,
  onChange
}: {
  tab: TabItem
  label: string
  active: boolean
  onChange: (tab: Tab) => void
}) {
  return (
    <Pressable
      className={`min-w-[56px] flex-1 flex-row items-center justify-center gap-2 rounded-full py-3 ${active ? 'bg-primary px-4' : 'px-3'}`}
      onPress={() => onChange(tab.id)}
    >
      <Ionicons color={active ? '#FFFFFF' : colors.muted} name={tab.icon} size={22} />
      {active ? <Text className="text-sm font-black text-white">{label}</Text> : null}
    </Pressable>
  )
}

export function FloatingTabBar({
  active,
  onChange,
  onCreatePress
}: {
  active: Tab
  onChange: (tab: Tab) => void
  onCreatePress: () => void
}) {
  const { t } = useTranslation('tabs')

  const left = useMemo(
    () =>
      leftTabs.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          label={t(tab.labelKey)}
          active={active === tab.id}
          onChange={onChange}
        />
      )),
    [active, onChange, t]
  )

  const right = useMemo(
    () =>
      rightTabs.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          label={t(tab.labelKey)}
          active={active === tab.id}
          onChange={onChange}
        />
      )),
    [active, onChange, t]
  )

  return (
    <Box className="absolute bottom-4 left-4 right-4">
      <View style={{ position: 'relative' }}>
        <HStack
          className="items-end justify-between rounded-full border border-[#EDE9FE] bg-white/95 px-2 pb-2 pt-3"
          style={shadowStrong}
        >
          <HStack className="flex-1 items-center justify-evenly">{left}</HStack>

          <Box className="w-[72px]" />

          <HStack className="flex-1 items-center justify-evenly">{right}</HStack>
        </HStack>

        <Pressable
          onPress={onCreatePress}
          className="items-center justify-center rounded-full bg-primary"
          style={{
            position: 'absolute',
            top: -20,
            left: '50%',
            marginLeft: -29,
            width: 58,
            height: 58,
            shadowColor: colors.primary,
            shadowOpacity: 0.35,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8
          }}
        >
          <Ionicons color="#FFFFFF" name="add" size={32} />
        </Pressable>
      </View>
    </Box>
  )
}
