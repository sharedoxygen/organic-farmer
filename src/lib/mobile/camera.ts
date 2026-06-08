import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { isNativePlatform } from './platform'

export interface PlantPhoto {
  dataUrl: string
  format: string
}

/** Capture or pick a plant photo — native camera on mobile, file input on web. */
export async function capturePlantPhoto(): Promise<PlantPhoto> {
  if (isNativePlatform()) {
    const photo = await Camera.getPhoto({
      quality: 88,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
      correctOrientation: true,
      saveToGallery: false,
      width: 1600,
    })

    if (!photo.dataUrl) {
      throw new Error('No photo captured')
    }

    return {
      dataUrl: photo.dataUrl,
      format: photo.format,
    }
  }

  return pickPhotoFromFileInput()
}

function pickPhotoFromFileInput(): Promise<PlantPhoto> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'

    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        resolve({
          dataUrl: String(reader.result),
          format: file.type.split('/')[1] || 'jpeg',
        })
      }
      reader.onerror = () => reject(new Error('Failed to read image'))
      reader.readAsDataURL(file)
    }

    input.click()
  })
}
