import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Modal, ScrollView, TextInput } from 'react-native'
import {
  Box,
  Button,
  ButtonText,
  HStack,
  Pressable,
  Text,
  VStack
} from '../../components/ui'
import type { PlaceSuggestion } from '../api/client'
import { BrazilianDateField } from './BrazilianDateField'
import { DestinationAutocomplete } from './DestinationAutocomplete'
import { formatDateInput, isoFromDate, toIsoDateStart } from '../lib/dates'
import { colors } from '../theme'

export type CreateTripInput = {
  destinationName?: string
  country?: string
  title?: string
  description?: string
  startsAt?: string
  endsAt?: string
  latitude?: number
  longitude?: number
  region?: string
}

type CreateTripSheetProps = {
  visible: boolean
  loading: boolean
  firstName: string
  onClose: () => void
  onSubmit: (input: CreateTripInput) => void
}

function defaultStartIso() {
  return isoFromDate(new Date())
}

function defaultEndIso() {
  const end = new Date()
  end.setDate(end.getDate() + 4)
  return isoFromDate(end)
}

export function CreateTripSheet({
  visible,
  loading,
  firstName,
  onClose,
  onSubmit
}: CreateTripSheetProps) {
  const [destination, setDestination] = useState('')
  const [country, setCountry] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(defaultStartIso())
  const [endDate, setEndDate] = useState(defaultEndIso())
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null)

  useEffect(() => {
    if (!visible) return
    setDestination('')
    setCountry('')
    setDescription('')
    setStartDate(defaultStartIso())
    setEndDate(defaultEndIso())
    setSelectedPlace(null)
  }, [visible])

  function submit() {
    const cleanDestination = (selectedPlace?.name ?? destination.trim())
    if (!cleanDestination || cleanDestination.length < 2) {
      Alert.alert('Destino obrigatório', 'Escolha a cidade ou destino da viagem.')
      return
    }
    if (!description.trim() || description.trim().length < 8) {
      Alert.alert('Descrição obrigatória', 'Conte em poucas linhas o objetivo da viagem (mínimo 8 caracteres).')
      return
    }
    const startsAt = toIsoDateStart(startDate)
    const endsAt = toIsoDateStart(endDate)
    if (!startsAt || !endsAt) {
      Alert.alert('Datas obrigatórias', 'Selecione a data de início e de fim da viagem.')
      return
    }
    if (endDate < startDate) {
      Alert.alert('Datas inválidas', 'A data de fim deve ser igual ou posterior à data de início.')
      return
    }

    onSubmit({
      destinationName: cleanDestination,
      country: (selectedPlace?.country ?? country.trim()) || undefined,
      title: `Viagem para ${cleanDestination}`,
      description: description.trim(),
      startsAt,
      endsAt,
      latitude: selectedPlace?.latitude,
      longitude: selectedPlace?.longitude,
      region: selectedPlace?.region || undefined
    })
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Box className="flex-1 justify-end bg-black/35">
        <Box className="max-h-[92%] rounded-t-[38px] bg-white px-5 pb-8 pt-3">
          <Box className="mb-5 h-1.5 w-16 self-center rounded-full bg-[#D1D5DB]" />

          <HStack className="mb-4 items-center justify-between">
            <Pressable onPress={onClose} disabled={loading}>
              <Text className="text-[16px] font-bold text-muted-foreground">Cancelar</Text>
            </Pressable>
            <Text className="text-[18px] font-black text-foreground">Nova viagem</Text>
            <Box className="w-[70px]" />
          </HStack>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <VStack className="items-center pb-2">
              <Box className="mb-4 h-[80px] w-[80px] items-center justify-center rounded-[28px] bg-viagens-lilac">
                <Ionicons color={colors.primary} name="earth" size={38} />
              </Box>
              <Text className="text-center text-[24px] font-black leading-[30px] text-foreground">
                Para onde vamos, {firstName}?
              </Text>
              <Text className="mt-2 text-center text-[14px] font-semibold leading-6 text-muted-foreground">
                Destino, datas e descrição ajudam a FEFAI a montar um roteiro melhor.
              </Text>
            </VStack>

            <VStack className="mt-5 gap-4">
              <DestinationAutocomplete
                label="Cidade ou destino"
                value={destination}
                onChangeText={(text) => {
                  setDestination(text)
                  setSelectedPlace(null)
                }}
                onSelectPlace={(place) => {
                  setSelectedPlace(place)
                  setDestination(place.name)
                  setCountry(place.country)
                }}
              />

              <VStack className="gap-2">
                <Text className="text-[13px] font-black text-foreground">Descrição da viagem</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Ex.: lua de mel, viagem em família, trabalho + folga..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  textAlignVertical="top"
                  style={{
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 22,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    minHeight: 96,
                    fontSize: 15,
                    fontWeight: '600',
                    color: colors.ink
                  }}
                />
              </VStack>

              <BrazilianDateField label="Início" value={startDate} onChange={setStartDate} />
              <BrazilianDateField
                label="Fim"
                value={endDate}
                onChange={setEndDate}
                minimumDate={startDate ? new Date(`${startDate}T12:00:00`) : undefined}
              />
            </VStack>

            <Button
              size="lg"
              className="mt-6 h-14 rounded-full bg-primary data-[active=true]:bg-primary/90"
              onPress={submit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <ButtonText className="text-[16px] font-black text-white">Criar viagem</ButtonText>
              )}
            </Button>
          </ScrollView>
        </Box>
      </Box>
    </Modal>
  )
}
