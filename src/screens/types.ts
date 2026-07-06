import type { SocialProvider } from '../auth/social'

export type AuthScreenProps = {
  mode: 'login' | 'register'
  name: string
  email: string
  password: string
  loading: boolean
  socialLoading?: boolean
  socialProvider?: SocialProvider | null
  invitePending?: boolean
  onModeChange: (mode: 'login' | 'register') => void
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: () => void
  onSocialLogin: (provider: SocialProvider) => void
}
