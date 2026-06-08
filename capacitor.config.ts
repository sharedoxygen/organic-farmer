import type { CapacitorConfig } from '@capacitor/cli'
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard'
import { readDotEnv, resolveEnv } from './scripts/load-dotenv'

/**
 * OFMS runs as a native shell around the Next.js server (SSR + API routes).
 * Set CAPACITOR_SERVER_URL in .env to your dev machine IP or production URL.
 */
const fileEnv = readDotEnv()
const serverUrl =
  resolveEnv('CAPACITOR_SERVER_URL', fileEnv) ||
  resolveEnv('NEXT_PUBLIC_APP_URL', fileEnv) ||
  'http://localhost:3005'

const isCleartext = serverUrl.startsWith('http://')

let serverHost = 'localhost'
try {
  serverHost = new URL(serverUrl).hostname
} catch {
  // keep default
}

const config: CapacitorConfig = {
  appId: 'com.sharedoxygen.ofms',
  appName: 'OFMS',
  webDir: 'www',
  server: {
    url: serverUrl,
    cleartext: isCleartext,
    androidScheme: isCleartext ? 'http' : 'https',
    allowNavigation: Array.from(new Set([serverHost, 'localhost', '127.0.0.1'])),
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: false,
      backgroundColor: '#22C55E',
      showSpinner: true,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#22C55E',
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
    },
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
  },
}

export default config
