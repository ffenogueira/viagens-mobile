import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable as RNPressable,
  ScrollView,
  TextInput
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Box, HStack, Pressable, Text, VStack } from '../../components/ui'
import { BrandMark } from '../components/BrandMark'
import { SocialLoginButtons } from '../components/SocialLoginButtons'
import { colors, shadow } from '../theme'
import type { AuthScreenProps } from './types'

const HORIZONTAL = 24

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
    <VStack className="gap-1.5">
      <Text className="text-[12px] font-bold text-[#64748B]">{label}</Text>
      <HStack
        className="h-[46px] items-center rounded-2xl border border-[#E9EEF6] bg-[#FBFCFE] px-4"
        style={{
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.045,
          shadowRadius: 8,
          elevation: 1
        }}
      >
        <Ionicons color={colors.muted} name={icon} size={19} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          className="ml-3 flex-1 text-[14px] font-semibold text-[#111827]"
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
      <Text className="text-[13px] font-medium lowercase text-[#9CA3AF]">ou</Text>
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
  invitePending = false,
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
  const [view, setView] = useState<'auth' | 'forgot'>('auth')

  const isLogin = mode === 'login'
  const busy = loading || socialLoading

  function scrollToForm() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    })
  }

  function sendRecovery() {
    if (!email.trim()) {
      Alert.alert('Informe seu e-mail', 'Digite o e-mail da conta para continuar.')
      return
    }

    Alert.alert(
      'Recuperação preparada',
      'A tela já está pronta. O próximo passo é conectar no endpoint de recuperação de senha.'
    )
  }

  if (view === 'forgot') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: HORIZONTAL,
            paddingTop: insets.top + 14,
            paddingBottom: insets.bottom + 24
          }}
        >
          <HStack className="mb-8 items-center justify-between">
            <Pressable
              onPress={() => setView('auth')}
              className="h-11 w-11 items-center justify-center rounded-full bg-white"
              style={shadow}
            >
              <Ionicons color={colors.ink} name="arrow-back" size={21} />
            </Pressable>
            <Text className="text-[16px] font-black text-foreground">Recuperar senha</Text>
            <Box className="h-11 w-11" />
          </HStack>

          <VStack className="flex-1 justify-center">
            <Box className="mb-8 self-center rounded-[28px] bg-viagens-lilac p-6">
              <Ionicons color={colors.primary} name="mail-unread-outline" size={76} />
            </Box>

            <Text className="text-[29px] font-black leading-[35px] text-foreground">
              Bora recuperar seu acesso?
            </Text>
            <Text className="mt-2 text-[14px] font-semibold leading-6 text-muted-foreground">
              Coloque seu e-mail e vamos te levar de volta para suas viagens.
            </Text>

            <VStack className="mt-8 gap-5">
              <AuthField
                icon="mail-outline"
                label="E-mail"
                placeholder="voce@email.com"
                value={email}
                onChangeText={onEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Pressable
                onPress={sendRecovery}
                className="h-[52px] items-center justify-center rounded-2xl bg-primary"
                style={shadow}
              >
                <Text className="text-[16px] font-black text-white">Enviar</Text>
              </Pressable>
            </VStack>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: HORIZONTAL,
          paddingTop: insets.top + 14,
          paddingBottom: insets.bottom + 24
        }}
      >
        <HStack className="mb-4 items-center justify-between">
          <BrandMark variant="dark" size="sm" showTagline={false} />
          <Box className="rounded-full bg-viagens-lilac px-3 py-1.5">
            <Text className="text-[11px] font-black text-primary">App de viagem</Text>
          </Box>
        </HStack>

        {invitePending ? (
          <Box className="mb-4 rounded-[22px] border border-[#EDE9FE] bg-viagens-lilac px-4 py-3">
            <Text className="text-[13px] font-semibold leading-5 text-primary">
              Você abriu um convite de viagem. Crie sua conta ou entre para aceitar e acessar roteiro, gastos e chat do grupo.
            </Text>
          </Box>
        ) : null}

        <VStack className="pt-12">
          <Text className="text-[26px] font-black leading-[32px] text-foreground">
            {isLogin ? 'Entre no seu espaço de viagem.' : 'Crie seu espaço de viagem.'}
          </Text>
          <Text className="mt-2 text-[14px] font-semibold leading-6 text-muted-foreground">
            {isLogin
              ? 'Planeje com IA, viaje em grupo, divida gastos e guarde as memórias em qualidade original.'
              : 'Monte um workspace para roteiro, grupo, OCR, gastos, fotos e pós-viagem.'}
          </Text>

          <HStack className="mt-5 flex-wrap gap-2">
            {['FEFAI', 'OCR', 'Grupo', 'Fotos originais'].map((item) => (
              <Box key={item} className="rounded-full bg-viagens-lilac px-3 py-1.5">
                <Text className="text-[11px] font-black text-primary">{item}</Text>
              </Box>
            ))}
          </HStack>

          <VStack className="mt-6 gap-3.5">
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
                    color="#CBD5E1"
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                  />
                </Pressable>
              }
            />
          </VStack>

          {isLogin && (
            <HStack className="mt-4 items-center justify-between">
              <RNPressable
                onPress={() => setRememberMe((current) => !current)}
                className="flex-row items-center gap-2.5"
              >
                <Box
                  className={`h-[18px] w-[18px] items-center justify-center rounded-md border-2 ${
                    rememberMe ? 'border-primary bg-primary' : 'border-[#D1D5DB] bg-white'
                  }`}
                >
                  {rememberMe && <Ionicons color="#FFFFFF" name="checkmark" size={12} />}
                </Box>
                  <Text className="text-[12px] font-semibold text-[#64748B]">Manter conectado</Text>
              </RNPressable>

              <Pressable onPress={() => setView('forgot')}>
                <Text className="text-[12px] font-black text-primary">Esqueci a senha</Text>
              </Pressable>
            </HStack>
          )}

          <Pressable
            disabled={busy}
            onPress={onSubmit}
            className="mt-6 h-[48px] overflow-hidden rounded-2xl active:opacity-90 data-[disabled=true]:opacity-70"
            style={shadow}
          >
            <LinearGradient
              colors={[colors.primary, '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text className="text-[15px] font-black text-white">
                  {isLogin ? 'Continuar' : 'Criar conta'}
                </Text>
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

        <HStack className="mt-12 items-center justify-center">
          <Text className="text-[13px] font-semibold text-muted-foreground">
            {isLogin ? 'Ainda não tem conta? ' : 'Já tem conta? '}
          </Text>
          <Pressable disabled={busy} onPress={() => onModeChange(isLogin ? 'register' : 'login')}>
            <Text className="text-[13px] font-black text-foreground">
              {isLogin ? 'Criar conta' : 'Entrar'}
            </Text>
          </Pressable>
        </HStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
