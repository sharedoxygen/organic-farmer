import { Capacitor } from '@capacitor/core'

export type MobilePlatform = 'ios' | 'android' | 'web'

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform()
}

export function getPlatform(): MobilePlatform {
  const platform = Capacitor.getPlatform()
  if (platform === 'ios' || platform === 'android') {
    return platform
  }
  return 'web'
}

export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios'
}

export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android'
}
