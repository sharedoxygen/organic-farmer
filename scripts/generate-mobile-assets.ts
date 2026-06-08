/**
 * Generate OFMS-branded icons and splash screens for Capacitor iOS/Android.
 */
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const ROOT = path.resolve(__dirname, '..')
const LOGO = path.join(ROOT, 'public/logo-icon.svg')
const BRAND_GREEN = '#22C55E'
const ANDROID_MIPMAP_SIZES: Record<string, number> = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
}

async function renderLogo(size: number, padding = 0.15): Promise<Buffer> {
  const inner = Math.round(size * (1 - padding * 2))
  const logo = await sharp(LOGO).resize(inner, inner).png().toBuffer()
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toBuffer()
}

async function renderLauncherIcon(size: number): Promise<Buffer> {
  const logoSize = Math.round(size * 0.62)
  const logo = await sharp(LOGO).resize(logoSize, logoSize).png().toBuffer()
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BRAND_GREEN,
    },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toBuffer()
}

async function renderSplash(width: number, height: number): Promise<Buffer> {
  const logoSize = Math.round(Math.min(width, height) * 0.22)
  const logo = await sharp(LOGO).resize(logoSize, logoSize).png().toBuffer()
  const titleSvg = Buffer.from(`
    <svg width="${width}" height="80" xmlns="http://www.w3.org/2000/svg">
      <text x="50%" y="55%" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
        font-size="28" font-weight="700" fill="#ffffff">OFMS</text>
    </svg>
  `)
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BRAND_GREEN,
    },
  })
    .composite([
      { input: logo, gravity: 'centre' },
      { input: titleSvg, top: Math.round(height * 0.58), left: 0 },
    ])
    .png()
    .toBuffer()
}

async function writeAndroidIcons(): Promise<void> {
  for (const [folder, size] of Object.entries(ANDROID_MIPMAP_SIZES)) {
    const dir = path.join(ROOT, 'android/app/src/main/res', folder)
    fs.mkdirSync(dir, { recursive: true })
    const icon = await renderLauncherIcon(size)
    const foreground = await renderLogo(size, 0.2)
    for (const name of ['ic_launcher.png', 'ic_launcher_round.png']) {
      fs.writeFileSync(path.join(dir, name), icon)
    }
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), foreground)
  }
}

async function writeAndroidSplashes(): Promise<void> {
  const sizes: Record<string, [number, number]> = {
    drawable: [480, 800],
    'drawable-port-mdpi': [320, 480],
    'drawable-port-hdpi': [480, 800],
    'drawable-port-xhdpi': [720, 1280],
    'drawable-port-xxhdpi': [1080, 1920],
    'drawable-port-xxxhdpi': [1440, 2560],
    'drawable-land-mdpi': [480, 320],
    'drawable-land-hdpi': [800, 480],
    'drawable-land-xhdpi': [1280, 720],
    'drawable-land-xxhdpi': [1920, 1080],
    'drawable-land-xxxhdpi': [2560, 1440],
  }

  for (const [folder, [w, h]] of Object.entries(sizes)) {
    const dir = path.join(ROOT, 'android/app/src/main/res', folder)
    if (!fs.existsSync(dir)) continue
    const splash = await renderSplash(w, h)
    fs.writeFileSync(path.join(dir, 'splash.png'), splash)
  }
}

async function writeIosAssets(): Promise<void> {
  const appIconDir = path.join(
    ROOT,
    'ios/App/App/Assets.xcassets/AppIcon.appiconset'
  )
  const splashDir = path.join(
    ROOT,
    'ios/App/App/Assets.xcassets/Splash.imageset'
  )

  const appIcon = await renderLauncherIcon(1024)
  fs.writeFileSync(path.join(appIconDir, 'AppIcon-512@2x.png'), appIcon)

  const splash1 = await renderSplash(2732, 2732)
  fs.writeFileSync(path.join(splashDir, 'splash-2732x2732.png'), splash1)
  fs.writeFileSync(path.join(splashDir, 'splash-2732x2732-1.png'), splash1)
  fs.writeFileSync(path.join(splashDir, 'splash-2732x2732-2.png'), splash1)
}

async function main(): Promise<void> {
  console.log('Generating OFMS mobile assets from', LOGO)
  await writeAndroidIcons()
  await writeAndroidSplashes()
  await writeIosAssets()
  console.log('Mobile assets generated.')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
