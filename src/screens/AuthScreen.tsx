import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import {
  Badge,
  BadgeText,
  Box,
  Button,
  ButtonSpinner,
  ButtonText,
  Card,
  Heading,
  HStack,
  Input,
  InputField,
  Pressable,
  Text,
  VStack
} from '../../components/ui'
import type { AuthScreenProps } from './types'

const highlights = [
  { icon: 'sparkles' as const, title: 'FEFAI contextual', text: 'Roteiro, gastos e decisões com contexto real da viagem.' },
  { icon: 'scan' as const, title: 'Câmera inteligente', text: 'OCR de preço, recibo e conversão de moeda na hora.' },
  { icon: 'images' as const, title: 'Memórias vivas', text: 'Álbum original, passaporte digital e retrospectiva.' }
]

export function AuthScreen({
  mode,
  name,
  email,
  password,
  loading,
  onModeChange,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit
}: AuthScreenProps) {
  return (
    <Box className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          contentContainerClassName="px-5 pt-8 pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Badge className="self-start rounded-full border border-secondary bg-card px-4 py-2">
            <HStack className="items-center gap-2">
              <Ionicons color="#7B4DFF" name="sparkles" size={16} />
              <BadgeText className="font-extrabold text-primary">Viagens by Up Your Idea</BadgeText>
            </HStack>
          </Badge>

          <Heading size="3xl" className="mt-6 font-black leading-tight text-foreground">
            Antes, durante{'\n'}e depois da viagem.
          </Heading>

          <Text className="mt-4 text-base font-semibold leading-7 text-muted-foreground">
            Planeje com IA, use a câmera para preço e recibo, divida gastos e preserve as memórias do grupo.
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-8" contentContainerClassName="gap-3">
            {highlights.map((item) => (
              <Card key={item.title} className="w-52 rounded-3xl border border-border bg-card p-4 shadow-soft-2">
                <Box className="mb-3 h-11 w-11 items-center justify-center rounded-2xl bg-secondary">
                  <Ionicons color="#7B4DFF" name={item.icon} size={22} />
                </Box>
                <Text className="font-extrabold text-foreground">{item.title}</Text>
                <Text className="mt-2 text-sm font-semibold leading-5 text-muted-foreground">{item.text}</Text>
              </Card>
            ))}
          </ScrollView>

          <Card className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-soft-3">
            <HStack className="mb-5 rounded-2xl bg-muted p-1">
              <Pressable
                className={`flex-1 items-center rounded-xl py-3 ${mode === 'login' ? 'bg-card shadow-soft-1' : ''}`}
                onPress={() => onModeChange('login')}
              >
                <Text className={`font-extrabold ${mode === 'login' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Entrar
                </Text>
              </Pressable>
              <Pressable
                className={`flex-1 items-center rounded-xl py-3 ${mode === 'register' ? 'bg-card shadow-soft-1' : ''}`}
                onPress={() => onModeChange('register')}
              >
                <Text className={`font-extrabold ${mode === 'register' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Criar conta
                </Text>
              </Pressable>
            </HStack>

            <VStack className="gap-4">
              {mode === 'register' && (
                <VStack className="gap-2">
                  <Text className="font-extrabold text-foreground">Nome</Text>
                  <Input className="h-12 rounded-2xl border-border bg-card">
                    <InputField
                      value={name}
                      onChangeText={onNameChange}
                      autoCapitalize="words"
                      placeholder="Seu nome"
                      className="text-base"
                    />
                  </Input>
                </VStack>
              )}

              <VStack className="gap-2">
                <Text className="font-extrabold text-foreground">E-mail</Text>
                <Input className="h-12 rounded-2xl border-border bg-card">
                  <InputField
                    value={email}
                    onChangeText={onEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="voce@email.com"
                    className="text-base"
                  />
                </Input>
              </VStack>

              <VStack className="gap-2">
                <Text className="font-extrabold text-foreground">Senha</Text>
                <Input className="h-12 rounded-2xl border-border bg-card">
                  <InputField
                    value={password}
                    onChangeText={onPasswordChange}
                    secureTextEntry
                    placeholder="••••••••"
                    className="text-base"
                  />
                </Input>
              </VStack>

              <Button
                size="lg"
                className="mt-2 h-14 rounded-2xl bg-primary data-[active=true]:bg-primary/90"
                onPress={onSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ButtonSpinner color="white" />
                ) : (
                  <ButtonText className="text-base font-black text-primary-foreground">
                    {mode === 'login' ? 'Entrar no app' : 'Criar workspace'}
                  </ButtonText>
                )}
              </Button>
            </VStack>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  )
}
