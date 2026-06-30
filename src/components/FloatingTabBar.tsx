import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Box, HStack, Pressable, Text } from '../../components/ui'
import type { Tab } from '../types/trip'

type TabItem = {
  id: Tab
  icon: keyof typeof Ionicons.glyphMap
  label: string
}

const tabs: TabItem[] = [
  { id: 'today', icon: 'compass-outline', label: 'Viagem' },
  { id: 'tools', icon: 'sparkles-outline', label: 'IA & OCR' },
  { id: 'memories', icon: 'images-outline', label: 'Memórias' },
  { id: 'profile', icon: 'person-outline', label: 'Perfil' }
]

export function FloatingTabBar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <Box className="absolute bottom-4 left-4 right-4">
      <HStack className="items-center justify-between rounded-full border border-gray-700 bg-viagens-tab px-2 py-2 shadow-soft-4">
        {tabs.map((tab) => {
          const isActive = active === tab.id
          return (
            <Pressable
              key={tab.id}
              className={`min-w-[52px] flex-row items-center justify-center gap-2 rounded-full py-3 ${isActive ? 'bg-primary px-5' : 'px-4'}`}
              onPress={() => onChange(tab.id)}
            >
              <Ionicons color={isActive ? '#FFFFFF' : '#94A3B8'} name={tab.icon} size={22} />
              {isActive && <Text className="text-sm font-extrabold text-white">{tab.label}</Text>}
            </Pressable>
          )
        })}
      </HStack>
    </Box>
  )
}
