#!/usr/bin/env node
/**
 * OFMS secrets & credential leak scanner (read-only).
 * Run: npm run security:scan
 *
 * Scans tracked source files for hardcoded credentials, API keys, and
 * known leaked patterns. Does not modify files.
 */
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(import.meta.dirname, '..')

const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'coverage',
  'playwright-report',
  'test-results',
  'ios/App/Pods',
  'android/.gradle',
  'android/app/build',
  'android/build',
  'backups',
  'private',
])

const SKIP_FILE_PATTERNS = [
  /\.lock$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.webp$/,
  /\.ico$/,
  /\.pdf$/,
  /\.docx$/,
  /\.jar$/,
  /\.woff2?$/,
  /\.ttf$/,
  /\.eot$/,
  /scan-secrets\.mjs$/,
  /sanitize-for-open-source\.sh$/,
  /clean-git-history\.sh$/,
]

/** Patterns that indicate real secrets (not placeholders). */
const RULES = [
  {
    id: 'postgres-real-password',
    label: 'PostgreSQL URL with embedded password',
    re: /postgresql:\/\/[^\s'"]+:[^\s'"/@]+@[^\s'"]+/gi,
    allow: (m) =>
      /username:password|user:pass|user:password|REDACTED|<[^>]+>|\$\{|\$DB_|\$SOURCE|\$TARGET/.test(
        m
      ),
  },
  {
    id: 'openai-key',
    label: 'OpenAI API key (sk-…)',
    re: /\bsk-[a-zA-Z0-9]{20,}\b/g,
    allow: () => false,
  },
  {
    id: 'aws-key',
    label: 'AWS access key (AKIA…)',
    re: /\bAKIA[0-9A-Z]{16}\b/g,
    allow: () => false,
  },
  {
    id: 'github-pat',
    label: 'GitHub personal access token',
    re: /\bghp_[a-zA-Z0-9]{20,}\b/g,
    allow: () => false,
  },
  {
    id: 'jwt-secret-literal',
    label: 'JWT secret assigned as literal',
    re: /JWT_SECRET\s*=\s*['"][^'"]{8,}['"]/gi,
    allow: (m) => /change_me|your_|example|placeholder|your-jwt/i.test(m),
  },
  {
    id: 'known-db-password',
    label: 'Known leaked database password',
    re: /REDACTED_DB_PASSWORD/g,
    allow: () => false,
  },
  {
    id: 'known-demo-passwords',
    label: 'Known hardcoded demo password',
    re: /\b(REDACTED_TEST_PASSWORD|REDACTED_SHOWCASE_PASSWORD|REDACTED_TEST_PASSWORD|REDACTED_TEST_PASSWORD|REDACTED_TEST_PASSWORD)\b/g,
    allow: (m, file) =>
      file.includes('private/security-audits') ||
      file.includes('SANITIZATION') ||
      file.includes('SECURITY_AUDIT'),
  },
  {
    id: 'bcrypt-plaintext-password',
    label: 'Plaintext password in bcrypt.hash()',
    re: /bcrypt\.hash\(\s*['"][^'"]{6,}['"]/g,
    allow: (m) =>
      /changeme|test_password|REDACTED|process\.env/.test(m) ||
      /^\s*bcrypt\.hash\(\s*['"]changeme123['"]/.test(m),
  },
  {
    id: 'env-file-tracked',
    label: 'Environment file may be tracked by git',
    re: /^\.env$/,
    allow: () => false,
  },
]

function shouldSkipFile(rel) {
  if (SKIP_FILE_PATTERNS.some((p) => p.test(rel))) return true
  const parts = rel.split(path.sep)
  return parts.some((p) => SKIP_DIRS.has(p))
}

function listFiles(dir, base = '') {
  const out = []
  for (const name of fs.readdirSync(dir)) {
    const rel = base ? `${base}/${name}` : name
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) {
      if (SKIP_DIRS.has(name)) continue
      out.push(...listFiles(full, rel))
    } else if (!shouldSkipFile(rel)) {
      out.push(rel)
    }
  }
  return out
}

function getTrackedFiles() {
  try {
    const raw = execSync('git ls-files -z', { cwd: ROOT, encoding: 'buffer' })
    return raw
      .toString('utf8')
      .split('\0')
      .filter(Boolean)
      .filter((f) => !shouldSkipFile(f))
  } catch {
    return listFiles(ROOT)
  }
}

function scanFile(rel) {
  const full = path.join(ROOT, rel)
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) return []

  const findings = []
  let text
  try {
    text = fs.readFileSync(full, 'utf8')
  } catch {
    return []
  }

  if (rel === '.env' || rel.endsWith('/.env')) {
    findings.push({
      rule: 'env-file-tracked',
      label: 'Environment file may be tracked by git',
      file: rel,
      line: 0,
      excerpt: rel,
    })
    return findings
  }

  const lines = text.split('\n')
  for (const rule of RULES) {
    if (rule.id === 'env-file-tracked') continue
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (/REDACTED_(?:DB_PASSWORD|TEST_PASSWORD|SHOWCASE_PASSWORD)/.test(line)) {
        continue
      }
      rule.re.lastIndex = 0
      let match
      while ((match = rule.re.exec(line)) !== null) {
        const excerpt = match[0].slice(0, 80)
        if (rule.allow(excerpt, rel)) continue
        findings.push({
          rule: rule.id,
          label: rule.label,
          file: rel,
          line: i + 1,
          excerpt,
        })
      }
    }
  }
  return findings
}

function main() {
  const includeBackups = process.argv.includes('--include-backups')
  console.log('🔒 OFMS Secrets Scan\n')
  if (!includeBackups) {
    console.log('   (skipping backups/ and private/ — pass --include-backups for full tree)\n')
  } else {
    SKIP_DIRS.delete('backups')
    SKIP_DIRS.delete('private')
  }

  const files = getTrackedFiles()
  const all = []
  for (const f of files) {
    all.push(...scanFile(f))
  }

  const byFile = new Map()
  for (const f of all) {
    if (!byFile.has(f.file)) byFile.set(f.file, [])
    byFile.get(f.file).push(f)
  }

  if (all.length === 0) {
    console.log(`✅ No credential leaks detected (${files.length} files scanned)\n`)
    process.exit(0)
  }

  console.log(`⚠️  ${all.length} finding(s) in ${byFile.size} file(s):\n`)
  for (const [file, items] of [...byFile.entries()].sort()) {
    console.log(`  ${file}`)
    for (const item of items) {
      const loc = item.line > 0 ? `:${item.line}` : ''
      console.log(`    [${item.rule}] ${item.label}`)
      console.log(`      ${item.excerpt}${loc}`)
    }
    console.log('')
  }

  console.log('Remediation:')
  console.log('  1. Move secrets to .env (never commit .env)')
  console.log('  2. Use process.env.* in scripts and seeds')
  console.log('  3. Run: bash scripts/sanitize-for-open-source.sh (legacy files)')
  console.log('  4. Remove backups/pre-sanitization-* from git if present')
  console.log('  5. Rotate any exposed credentials immediately\n')

  process.exit(1)
}

main()
