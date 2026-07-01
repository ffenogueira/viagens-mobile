import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useRef, useState } from 'react'
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable as RNPressable,
  ScrollView,
  StyleSheet,
  TextInput
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Box, HStack, Pressable, Text, VStack } from '../../components/ui'
import { BrandMark } from '../components/BrandMark'
import { SocialLoginButtons } from '../components/SocialLoginButtons'
import { colors, shadowStrong } from '../theme'
import type { AuthScreenProps } from './types'

const HORIZONTAL = 22
const absoluteFill = StyleSheet.absoluteFill
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85'

function AuthField({
  icon,
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  onFocus,
  trailing
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  placeholder: string
  value: string
  onChangeText: (value: string) => void
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address'
  autoCapitalize?: 'none' | 'words'
  onFocus?: () => void
  trailing?: React.ReactNode
}) {
  return (
    <VStack className="gap-2">
      <Text className="text-[13px] font-bold text-[#475569]">{label}</Text>
      <HStack className="h-[54px] items-center rounded-[20px] border border-[#E5E7EB] bg-[#F8FAFC] px-4">
        <Ionicons color={colors.primary} name={icon} size={19} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          className="ml-3 flex-1 text-[15px] font-semibold text-[#111827]"
        />
        {trailing}
      </HStack>
    </VStack>
  )
}

function OrDivider() {
  return (
    <HStack className="my-5 items-center gap-3">
      <Box className="h-px flex-1 bg-[#E5E7EB]" />
      <Text className="text-[12px] font-bold text-[#94A3B8]">ou continue com</Text>
      <Box className="h-px flex-1 bg-[#E5E7EB]" />
    </HStack>
  )
}

export function AuthScreen({
  mode,
  name,
  email,
  password,
  loading,
  socialLoading = false,
  socialProvider = null,
  onModeChange,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onSocialLogin
}: AuthScreenProps) {
  const insets = useSafeAreaInsets()
  const scrollRef = useRef<ScrollView>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const isLogin = mode === 'login'
  const busy = loading || socialLoading

  function scrollToForm() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    })
  }

  return (
    <Box className="flex-1 bg-[#FAF7FF]">
      <ImageBackground source={{ uri: HERO_IMAGE }} resizeMode="cover" style={{ height: 280 }}>
        <LinearGradient
          colors={['rgba(250,247,255,0.15)', 'rgba(15,23,42,0.12)', 'rgba(15,23,42,0.58)']}
          locations={[0, 0.42, 1]}
          style={absoluteFill}
        />

        <VStack
          className="flex-1 justify-between px-6"
          style={{ paddingTop: insets.top + 14, paddingBottom: 34 }}
        >
          <HStack className="items-center justify-between">
            <BrandMark variant="light" size="sm" />
            <Box className="rounded-full bg-white/18 px-3 py-2">
              <Text className="text-[12px] font-bold text-white">Antes, durante e depois</Text>
            </Box>
          </HStack>

          <VStack>
            <Text className="text-[34px] font-black leading-[39px] text-white">
              Sua viagem começa aqui.
            </Text>
            <Text className="mt-3 text-[15px] font-semibold leading-[22px] text-white/86">
              Entre para planejar em grupo, dividir gastos, usar IA e guardar fotos em qualidade
              original.
            </Text>
          </VStack>
        </VStack>
      </ImageBackground>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="-mt-8 flex-1"
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={{
            paddingHorizontal: HORIZONTAL,
            paddingBottom: insets.bottom + 24
          }}
        >
          <VStack
            className="rounded-t-[36px] bg-white px-5 pb-6 pt-5"
            style={shadowStrong}
          >
            <HStack className="mb-6 rounded-full bg-[#F1F5F9] p-1.5">
              <Pressable
                disabled={busy}
                onPress={() => onModeChange('login')}
                className={`h-[44px] flex-1 items-center justify-center rounded-full ${
                  isLogin ? 'bg-white' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-[14px] font-black ${
                    isLogin ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Entrar
                </Text>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={() => onModeChange('register')}
                className={`h-[44px] flex-1 items-center justify-center rounded-full ${
                  !isLogin ? 'bg-white' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-[14px] font-black ${
                    !isLogin ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Criar conta
                </Text>
              </Pressable>
            </HStack>

            <Text className="text-[24px] font-black leading-[30px] text-[#111827]">
              {isLogin ? 'Bem-vinda de volta' : 'Crie seu workspace de viagem'}
            </Text>
            <Text className="mt-2 text-[14px] font-semibold leading-[21px] text-[#64748B]">
              {isLogin
                ? 'Acesse seus roteiros, grupos, fotos e ferramentas inteligentes.'
                : 'Leva menos de um minuto para começar a organizar sua próxima viagem.'}
            </Text>

            <VStack className="mt-6 gap-4">
              {!isLogin && (
                <AuthField
                  icon="person-outline"
                  label="Nome"
                  placeholder="Seu nome"
                  value={name}
                  onChangeText={onNameChange}
                  autoCapitalize="words"
                  onFocus={scrollToForm}
                />
              )}

              <AuthField
                icon="mail-outline"
                label="E-mail"
                placeholder="voce@email.com"
                value={email}
                onChangeText={onEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={scrollToForm}
              />

              <AuthField
                icon="lock-closed-outline"
                label="Senha"
                placeholder="Digite sua senha"
                value={password}
                onChangeText={onPasswordChange}
                secureTextEntry={!showPassword}
                onFocus={scrollToForm}
                trailing={
                  <Pressable
                    className="h-10 w-10 items-center justify-center"
                    onPress={() => setShowPassword((current) => !current)}
                  >
                    <Ionicons
                      color="#94A3B8"
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                    />
                  </Pressable>
                }
              />
            </VStack>

            {isLogin && (
              <HStack className="mt-5 items-center justify-between">
                <RNPressable
                  onPress={() => setRememberMe((current) => !current)}
                  className="flex-row items-center gap-2.5"
                >
                  <Box
                    className={`h-[20px] w-[20px] items-center justify-center rounded-md border-2 ${
                      rememberMe ? 'border-primary bg-primary' : 'border-[#D1D5DB] bg-white'
                    }`}
                  >
                    {rememberMe && <Ionicons color="#FFFFFF" name="checkmark" size={12} />}
                  </Box>
                  <Text className="text-[13px] font-semibold text-[#64748B]">Lembrar</Text>
                </RNPressable>

                <Pressable>
                  <Text className="text-[13px] font-bold text-primary">Esqueci a senha</Text>
                </Pressable>
              </HStack>
            )}

            <Pressable
              disabled={busy}
              onPress={onSubmit}
              className="mt-6 h-[56px] overflow-hidden rounded-full active:opacity-90 data-[disabled=true]:opacity-70"
              style={shadowStrong}
            >
              <LinearGradient
                colors={[colors.primary, '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <HStack className="items-center gap-2">
                    <Text className="text-[16px] font-black text-white">
                      {isLogin ? 'Entrar no app' : 'Criar minha conta'}
                    </Text>
                    <Ionicons color={colors.white} name="arrow-forward" size={18} />
                  </HStack>
                )}
              </LinearGradient>
            </Pressable>

            <OrDivider />

            <SocialLoginButtons
              loading={socialLoading}
              loadingProvider={socialProvider}
              onPress={onSocialLogin}
            />
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  )
}
