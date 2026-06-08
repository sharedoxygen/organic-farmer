import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(__dirname, '..')

/** Parse .env into a map (does not mutate process.env). */
export function readDotEnv(envPath = path.join(ROOT, '.env')): Record<string, string> {
  if (!fs.existsSync(envPath)) return {}

  const result: Record<string, string> = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eq = trimmed.indexOf('=')
    if (eq === -1) continue

    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }

  return result
}

/** Resolve a value from process.env first, then .env file. */
export function resolveEnv(
  key: string,
  fileEnv: Record<string, string> = readDotEnv()
): string | undefined {
  return process.env[key] || fileEnv[key]
}
