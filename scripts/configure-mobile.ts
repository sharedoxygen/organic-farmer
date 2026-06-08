/**
 * One-shot mobile configuration: LAN IP → .env → assets → cap sync.
 */
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { readDotEnv } from './load-dotenv'

const ROOT = path.resolve(__dirname, '..')
const ENV_PATH = path.join(ROOT, '.env')
const PORT = process.env.OFMS_PORT || '3005'

function detectLanIp(): string {
  try {
    const out = execSync(
      `ifconfig | awk '/inet / && $2 != "127.0.0.1" {print $2}'`,
      { encoding: 'utf8' }
    )
    const ips = out
      .trim()
      .split('\n')
      .map((ip) => ip.trim())
      .filter(Boolean)

    const preferred = ips.find(
      (ip) => ip.startsWith('192.168.') || ip.startsWith('10.')
    )
    if (preferred) return preferred
    if (ips[0]) return ips[0]
  } catch {
    // fall through
  }

  for (const iface of ['en0', 'en1', 'en2']) {
    try {
      const ip = execSync(`ipconfig getifaddr ${iface}`, {
        encoding: 'utf8',
      }).trim()
      if (ip) return ip
    } catch {
      // try next interface
    }
  }

  return 'localhost'
}

function upsertEnv(keys: Record<string, string>): void {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : ''

  for (const [key, value] of Object.entries(keys)) {
    const line = `${key}="${value}"`
    const pattern = new RegExp(`^${key}=.*$`, 'm')

    if (pattern.test(content)) {
      content = content.replace(pattern, line)
    } else {
      if (content.length > 0 && !content.endsWith('\n')) content += '\n'
      if (!content.includes('# Mobile (Capacitor)')) {
        content += '\n# Mobile (Capacitor)\n'
      }
      content += `${line}\n`
    }
  }

  content = content.replace(/\n# Mobile \(Capacitor\)\n# Mobile \(Capacitor\)\n/g, '\n# Mobile (Capacitor)\n')
  fs.writeFileSync(ENV_PATH, content)
}

function resolveServerUrl(): string {
  const fileEnv = readDotEnv()
  const existing =
    process.env.CAPACITOR_SERVER_URL || fileEnv.CAPACITOR_SERVER_URL

  if (existing && !process.env.FORCE_MOBILE_CONFIGURE) {
    return existing.replace(/\/$/, '')
  }

  const ip = detectLanIp()
  return `http://${ip}:${PORT}`
}

function main(): void {
  const serverUrl = resolveServerUrl()

  console.log(`Configuring mobile with server URL: ${serverUrl}`)

  upsertEnv({
    CAPACITOR_SERVER_URL: serverUrl,
    NEXT_PUBLIC_APP_URL: serverUrl,
  })

  execSync('tsx scripts/generate-mobile-assets.ts', {
    cwd: ROOT,
    stdio: 'inherit',
  })

  const jdkHome =
    process.env.JAVA_HOME ||
    '/Applications/Android Studio.app/Contents/jbr/Contents/Home'

  execSync('npx cap sync', {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      CAPACITOR_SERVER_URL: serverUrl,
      NEXT_PUBLIC_APP_URL: serverUrl,
      JAVA_HOME: jdkHome,
      JAVA_OPTS: '',
      JAVA_TOOL_OPTIONS: '',
      GRADLE_OPTS: '',
    },
  })

  console.log('\nMobile configuration complete.')
  console.log(`  Server: ${serverUrl}`)
  console.log('  Next:   npm run mobile:dev')
  console.log('  iOS:    npm run mobile:open:ios')
  console.log('  Android npm run mobile:open:android')
}

main()
