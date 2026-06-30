export type AuthScreenProps = {
  mode: 'login' | 'register'
  name: string
  email: string
  password: string
  loading: boolean
  onModeChange: (mode: 'login' | 'register') => void
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: () => void
}
