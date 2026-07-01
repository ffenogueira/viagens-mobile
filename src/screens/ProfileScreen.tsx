import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { ScrollView } from 'react-native'
import {
  Avatar,
  AvatarFallbackText,
  Box,
  Button,
  ButtonText,
  HStack,
  Pressable,
  Text,
  VStack
} from '../../components/ui'
import type { AuthUser } from '../api/client'
import { getInitials } from '../components/shared'
import { colors, gradients } from '../theme'

type ProfileScreenProps = {
  user: AuthUser | null
  tripCount: number
  onLogout: () => void
}

const menuItems = [
  { icon: 'notifications-outline' as const, label: 'Notificações', desc: 'Alertas de viagem e grupo' },
  { icon: 'shield-checkmark-outline' as const, label: 'Privacidade', desc: 'Localização e consentimentos' },
  { icon: 'help-circle-outline' as const, label: 'Ajuda', desc: 'Suporte e FAQ' }
]

export function ProfileScreen({ user, tripCount, onLogout }: ProfileScreenProps) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
      <Box className="mb-6 overflow-hidden rounded-3xl shadow-soft-3">
        <LinearGradient colors={[...gradients.hero]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 24, alignItems: 'center' }}>
          <Avatar className="mb-4 h-[88px] w-[88px] border-[3px] border-white/50 bg-white/20">
            <AvatarFallbackText className="text-3xl font-black text-white">
              {getInitials(user?.name)}
            </AvatarFallbackText>
          </Avatar>

          <Text className="text-2xl font-black text-white">{user?.name || 'Viajante'}</Text>
          <Text className="mt-1 text-sm font-semibold text-white/80">
            {user?.email || 'Perfil conectado ao workspace'}
          </Text>

          <HStack className="mt-6 w-full items-center rounded-3xl bg-white/15 px-6 py-4">
            <VStack className="flex-1 items-center gap-1">
              <Text className="text-xl font-black text-white">{tripCount}</Text>
              <Text className="text-xs font-bold text-white/75">Viagens</Text>
            </VStack>
            <Box className="h-8 w-px bg-white/25" />
            <VStack className="flex-1 items-center gap-1">
              <Text className="text-xl font-black text-white">Pro</Text>
              <Text className="text-xs font-bold text-white/75">Plano</Text>
            </VStack>
            <Box className="h-8 w-px bg-white/25" />
            <VStack className="flex-1 items-center gap-1">
              <Ionicons color="#FFFFFF" name="sparkles" size={20} />
              <Text className="text-xs font-bold text-white/75">FEFAI</Text>
            </VStack>
          </HStack>
        </LinearGradient>
      </Box>

      <Text className="mb-4 text-lg font-black text-foreground">Configurações</Text>

      {menuItems.map((item) => (
        <Pressable key={item.label} className="mb-3">
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

      <Button
        variant="outline"
        size="lg"
        className="mt-4 h-14 rounded-2xl border-red-200 bg-red-50"
        onPress={onLogout}
      >
        <ButtonText className="font-black text-destructive">Sair da conta</ButtonText>
      </Button>

      <Text className="mt-8 text-center text-xs font-semibold text-muted-foreground">
        Viagens by Up Your Idea · v0.1
      </Text>
    </ScrollView>
  )
}
