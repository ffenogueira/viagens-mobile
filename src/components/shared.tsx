import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Badge, BadgeText, Box, HStack, Pressable, Text, VStack } from '../../components/ui'

export function SectionTitle({
  kicker,
  title,
  subtitle,
  className
}: {
  kicker?: string
  title: string
  subtitle?: string
  className?: string
}) {
  return (
    <VStack className={`mb-5 ${className ?? ''}`}>
      {kicker && (
        <Text className="text-xs font-black uppercase tracking-wider text-primary">{kicker}</Text>
      )}
      <Text className="mt-1 text-xl font-black text-foreground">{title}</Text>
      {subtitle && (
        <Text className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">{subtitle}</Text>
      )}
    </VStack>
  )
}

export function MetricTile({
  color,
  icon,
  label,
  value,
  bgClass
}: {
  color: string
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: string
  bgClass: string
}) {
  return (
    <Box className={`w-[47.5%] rounded-2xl border border-border border-l-4 p-4 shadow-soft-1 ${bgClass}`} style={{ borderLeftColor: color }}>
      <Box className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}18` }}>
        <Ionicons color={color} name={icon} size={20} />
      </Box>
      <Text className="mt-3 text-3xl font-black text-foreground">{value}</Text>
      <Text className="mt-0.5 text-sm font-extrabold text-muted-foreground">{label}</Text>
    </Box>
  )
}

export function QuickAction({
  color,
  icon,
  label,
  onPress
}: {
  color: string
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress: () => void
}) {
  return (
    <Pressable className="w-[76px] items-center gap-2" onPress={onPress}>
      <Box
        className="h-14 w-14 items-center justify-center rounded-2xl shadow-soft-2"
        style={{ backgroundColor: color }}
      >
        <Ionicons color="#FFFFFF" name={icon} size={22} />
      </Box>
      <Text className="text-center text-xs font-extrabold text-foreground">{label}</Text>
    </Pressable>
  )
}

export function FeatureRow({
  icon,
  color,
  title,
  description,
  badge
}: {
  icon: keyof typeof Ionicons.glyphMap
  color: string
  title: string
  description: string
  badge?: string
}) {
  return (
    <HStack className="gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft-1">
      <Box className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${color}15` }}>
        <Ionicons color={color} name={icon} size={22} />
      </Box>
      <VStack className="flex-1">
        <HStack className="flex-wrap items-center gap-2">
          <Text className="font-black text-foreground">{title}</Text>
          {badge && (
            <Badge className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${color}20` }}>
              <BadgeText className="text-[10px] font-black uppercase" style={{ color }}>
                {badge}
              </BadgeText>
            </Badge>
          )}
        </HStack>
        <Text className="mt-1 text-sm font-semibold leading-5 text-muted-foreground">{description}</Text>
      </VStack>
    </HStack>
  )
}

export function getInitials(name?: string) {
  if (!name) return 'V'
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
