export const colors = {
  primary: '#7B4DFF',
  primaryDark: '#5E35D9',
  primaryLight: '#A78BFA',
  sky: '#0EA5E9',
  skySoft: '#E0F2FE',
  mint: '#10B981',
  mintSoft: '#D1FAE5',
  orange: '#F97316',
  orangeSoft: '#FFEDD5',
  ink: '#111827',
  inkSoft: '#1F2937',
  muted: '#64748B',
  mutedLight: '#94A3B8',
  line: '#E5E7EB',
  lineSoft: '#F1F5F9',
  surface: '#FFFFFF',
  lilac: '#F4EFFF',
  lilacDeep: '#EDE9FE',
  cyanSoft: '#ECFEFF',
  background: '#F8FAFC',
  tabBar: '#111827',
  tabBarBorder: '#374151',
  danger: '#EF4444',
  white: '#FFFFFF'
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32
}

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 999
}

export const typography = {
  hero: { fontSize: 34, lineHeight: 40, fontWeight: '900' as const },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '900' as const },
  subtitle: { fontSize: 18, lineHeight: 24, fontWeight: '800' as const },
  body: { fontSize: 15, lineHeight: 23, fontWeight: '600' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '800' as const },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '800' as const }
}

export const shadow = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 4
}

export const shadowStrong = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.14,
  shadowRadius: 28,
  elevation: 8
}

export const gradients = {
  hero: ['#7B4DFF', '#6366F1', '#0EA5E9'] as const,
  heroSoft: ['#F4EFFF', '#FFFFFF', '#ECFEFF'] as const,
  fefai: ['#5E35D9', '#7B4DFF', '#818CF8'] as const,
  mint: ['#059669', '#10B981'] as const,
  sunset: ['#F97316', '#FB923C'] as const
}
