/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      { protocol: 'http', hostname: '**' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Allow Capacitor WebView and LAN devices to reach the dev server
  allowedDevOrigins: ['*'],
  // App router is now default in Next.js 14, no experimental config needed
  reactStrictMode: true,
  eslint: {
    // Temporarily ignore ESLint errors during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily ignore TypeScript errors during builds
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
