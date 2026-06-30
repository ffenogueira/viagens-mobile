import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import {
  Avatar,
  AvatarFallbackText,
  Box,
  HStack,
  Pressable,
  Text,
  VStack
} from '../../components/ui'
import type { AuthUser } from '../api/client'
import { getInitials } from './shared'

type ScreenHeaderProps = {
  user: AuthUser | null
  destination?: string
  onLogout?: () => void
  showNotification?: boolean
}

export function ScreenHeader({ user, destination, onLogout, showNotification = true }: ScreenHeaderProps) {
  const firstName = user?.name?.split(' ')[0] || 'Viajante'

  return (
    <HStack className="items-center justify-between px-5 pb-4 pt-3">
      <HStack className="flex-1 items-center gap-3">
        <Avatar className="h-12 w-12 border-2 border-primary/30 bg-viagens-lilac">
          <AvatarFallbackText className="font-black text-primary">
            {getInitials(user?.name)}
          </AvatarFallbackText>
        </Avatar>
        <VStack className="flex-1">
          <Text className="text-lg font-black text-foreground">Olá, {firstName}</Text>
          <Text className="text-sm font-semibold text-muted-foreground" numberOfLines={1}>
            {destination || 'Seu workspace de viagens'}
          </Text>
        </VStack>
      </HStack>

      <HStack className="gap-2">
        {showNotification && (
          <Pressable className="relative h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card">
            <Ionicons color="#111827" name="notifications-outline" size={22} />
            <Box className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border border-white bg-destructive" />
          </Pressable>
        )}
        {onLogout && (
          <Pressable
            className="h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card"
            onPress={onLogout}
          >
            <Ionicons color="#111827" name="log-out-outline" size={22} />
          </Pressable>
        )}
      </HStack>
    </HStack>
  )
}
