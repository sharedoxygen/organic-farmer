/**
 * Audit Capacitor mobile setup: env, native configs, assets, builds.
 */
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { readDotEnv, resolveEnv } from './load-dotenv'

const ROOT = path.resolve(__dirname, '..')
const checks: { name: string; ok: boolean; detail: string }[] = []

function check(name: string, ok: boolean, detail: string): void {
  checks.push({ name, ok, detail })
  const icon = ok ? '✓' : '✗'
  console.log(`${icon} ${name}: ${detail}`)
}

function readJson(relativePath: string): Record<string, unknown> | null {
  const full = path.join(ROOT, relativePath)
  if (!fs.existsSync(full)) return null
  return JSON.parse(fs.readFileSync(full, 'utf8')) as Record<string, unknown>
}

function main(): void {
  console.log('OFMS Mobile Verification\n')

  const fileEnv = readDotEnv()
  const serverUrl =
    resolveEnv('CAPACITOR_SERVER_URL', fileEnv) ||
    resolveEnv('NEXT_PUBLIC_APP_URL', fileEnv)

  check(
    'env CAPACITOR_SERVER_URL',
    Boolean(serverUrl && serverUrl !== 'http://localhost:3005'),
    serverUrl || 'missing'
  )

  const androidConfig = readJson('android/app/src/main/assets/capacitor.config.json')
  const iosConfig = readJson('ios/App/App/capacitor.config.json')
  const androidServer = (androidConfig?.server as { url?: string } | undefined)?.url
  const iosServer = (iosConfig?.server as { url?: string } | undefined)?.url

  check(
    'android capacitor.config.json',
    androidServer === serverUrl,
    `${androidServer} ${androidServer === serverUrl ? '(matches .env)' : `(expected ${serverUrl})`}`
  )
  check(
    'ios capacitor.config.json',
    iosServer === serverUrl,
    `${iosServer} ${iosServer === serverUrl ? '(matches .env)' : `(expected ${serverUrl})`}`
  )

  const requiredFiles = [
    'capacitor.config.ts',
    'www/index.html',
    'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png',
    'android/app/src/main/res/values/colors.xml',
    'android/app/src/main/res/xml/network_security_config.xml',
    'src/components/mobile/CapacitorProvider.tsx',
    'src/lib/mobile/init.ts',
    'src/lib/mobile/camera.ts',
    'src/app/mobile/plant-scan/page.tsx',
    'src/app/api/ai/plant-scan/route.ts',
    'src/lib/ai/plantVisionAnalysis.ts',
  ]

  for (const file of requiredFiles) {
    check(`file ${file}`, fs.existsSync(path.join(ROOT, file)), fs.existsSync(path.join(ROOT, file)) ? 'present' : 'MISSING')
  }

  try {
    execSync('npm run type-check', { cwd: ROOT, stdio: 'pipe' })
    check('typescript', true, 'passes')
  } catch {
    check('typescript', false, 'failed')
  }

  const failed = checks.filter((c) => !c.ok)
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`)

  if (failed.length > 0) {
    console.log('\nRun: npm run mobile:configure')
    process.exit(1)
  }
}

main()
