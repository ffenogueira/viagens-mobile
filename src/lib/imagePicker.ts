import * as ImagePicker from 'expo-image-picker'
import { Alert } from 'react-native'

export async function pickImageFromLibrary(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (permission.status !== 'granted') {
    Alert.alert('Permita a galeria', 'Precisamos acessar suas fotos para escolher uma imagem.')
    return null
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: true,
    aspect: [4, 3]
  })

  if (result.canceled || !result.assets[0]?.uri) return null
  return result.assets[0].uri
}

export async function pickImageFromCamera(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync()
  if (permission.status !== 'granted') {
    Alert.alert('Permita a câmera', 'Precisamos da câmera para tirar uma foto.')
    return null
  }

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.85,
    allowsEditing: true,
    aspect: [4, 3]
  })

  if (result.canceled || !result.assets[0]?.uri) return null
  return result.assets[0].uri
}

export function askImageSource(onLibrary: () => void, onCamera: () => void) {
  Alert.alert('Escolher foto', 'De onde você quer pegar a imagem?', [
    { text: 'Galeria', onPress: onLibrary },
    { text: 'Câmera', onPress: onCamera },
    { text: 'Cancelar', style: 'cancel' }
  ])
}

export const DEFAULT_TRIP_COVER =
  'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1400&q=80'
