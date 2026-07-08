import * as ImagePicker from 'expo-image-picker'
import { Alert } from 'react-native'
import { i18n } from '../i18n'

export async function pickImageFromLibrary(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (permission.status !== 'granted') {
    Alert.alert(i18n.t('allowGallery', { ns: 'common' }), i18n.t('allowGalleryBody', { ns: 'common' }))
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
    Alert.alert(i18n.t('allowCamera', { ns: 'common' }), i18n.t('allowCameraBody', { ns: 'common' }))
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
  Alert.alert(i18n.t('choosePhoto', { ns: 'common' }), i18n.t('choosePhotoBody', { ns: 'common' }), [
    { text: i18n.t('gallery', { ns: 'common' }), onPress: onLibrary },
    { text: i18n.t('camera', { ns: 'common' }), onPress: onCamera },
    { text: i18n.t('cancel', { ns: 'common' }), style: 'cancel' }
  ])
}

export const DEFAULT_TRIP_COVER =
  'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1400&q=80'
