import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import type { OperationCheck } from './types'

const ROOT = path.resolve(process.cwd())

function readJson(relativePath: string): Record<string, unknown> | null {
  const full = path.join(ROOT, relativePath)
  if (!fs.existsSync(full)) return null
  return JSON.parse(fs.readFileSync(full, 'utf8')) as Record<string, unknown>
}

function readDotEnv(): Record<string, string> {
  const envPath = path.join(ROOT, '.env')
  if (!fs.existsSync(envPath)) return {}
  const out: Record<string, string> = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 1) continue
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}

/** Portable mobile verification (from scripts/verify-mobile.ts) */
export function runMobileVerification(): OperationCheck[] {
  const checks: OperationCheck[] = []
  const fileEnv = readDotEnv()
  const serverUrl =
    process.env.CAPACITOR_SERVER_URL ||
    fileEnv.CAPACITOR_SERVER_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    fileEnv.NEXT_PUBLIC_APP_URL

  const push = (name: string, ok: boolean, detail: string) =>
    checks.push({ name, ok, detail })

  push(
    'env CAPACITOR_SERVER_URL',
    Boolean(serverUrl && serverUrl !== 'http://localhost:3005'),
    serverUrl || 'missing'
  )

  const androidConfig = readJson('android/app/src/main/assets/capacitor.config.json')
  const iosConfig = readJson('ios/App/App/capacitor.config.json')
  const androidServer = (androidConfig?.server as { url?: string } | undefined)?.url
  const iosServer = (iosConfig?.server as { url?: string } | undefined)?.url

  push(
    'android capacitor.config.json',
    androidServer === serverUrl,
    `${androidServer ?? 'missing'}`
  )
  push(
    'ios capacitor.config.json',
    iosServer === serverUrl,
    `${iosServer ?? 'missing'}`
  )

  const requiredFiles = [
    'capacitor.config.ts',
    'www/index.html',
    'src/components/mobile/CapacitorProvider.tsx',
    'src/app/mobile/plant-scan/page.tsx',
    'src/app/api/ai/plant-scan/route.ts',
  ]

  for (const file of requiredFiles) {
    const exists = fs.existsSync(path.join(ROOT, file))
    push(`file ${file}`, exists, exists ? 'present' : 'MISSING')
  }

  try {
    execSync('npm run type-check', { cwd: ROOT, stdio: 'pipe', timeout: 120000 })
    push('typescript', true, 'passes')
  } catch {
    push('typescript', false, 'failed')
  }

  return checks
}
