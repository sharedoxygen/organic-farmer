import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Keyboard } from '@capacitor/keyboard'
import { isNativePlatform, isIOS } from './platform'

export async function initializeCapacitor(): Promise<void> {
  if (!isNativePlatform()) {
    return
  }

  document.documentElement.classList.add('capacitor-native')

  if (isIOS()) {
    document.documentElement.classList.add('capacitor-ios')
  } else {
    document.documentElement.classList.add('capacitor-android')
  }

  try {
    await StatusBar.setStyle({ style: Style.Dark })
    if (!isIOS()) {
      await StatusBar.setBackgroundColor({ color: '#22C55E' })
    }
  } catch {
    // Status bar plugin unavailable on some simulators
  }

  try {
    await Keyboard.setAccessoryBarVisible({ isVisible: true })
  } catch {
    // Keyboard plugin optional
  }

  try {
    await SplashScreen.hide()
  } catch {
    // Splash may already be hidden
  }
}

export function registerAppListeners(onBack?: () => void): () => void {
  if (!isNativePlatform()) {
    return () => undefined
  }

  const backListener = App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
      return
    }
    onBack?.()
  })

  const resumeListener = App.addListener('resume', async () => {
    try {
      await SplashScreen.hide()
    } catch {
      // ignore
    }
  })

  return () => {
    void backListener.then(l => l.remove())
    void resumeListener.then(l => l.remove())
  }
}
