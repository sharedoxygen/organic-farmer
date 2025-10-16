import type { Metadata } from 'next'
import { AuthProvider } from '@/components/AuthProvider'
import { TenantProvider } from '@/components/TenantProvider'
import { FeedbackProvider } from '@/context/FeedbackContext'
import { ConditionalLayout } from '@/components/ConditionalLayout'
import { ThemeProvider } from '@/components/ThemeProvider'
import { HelpProvider } from '@/components/HelpProvider'
import { HelpModal } from '@/components/ui/HelpModal/HelpModal'
import { TutorialOverlay } from '@/components/ui/TutorialOverlay/TutorialOverlay'

import { Toaster } from 'react-hot-toast';
import './globals.css'

export const metadata: Metadata = {
    title: 'Organic Farm Management System (OFMS)',
    description: 'Professional organic farm management with USDA compliance and end-to-end traceability',
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: '16x16 32x32' },
            { url: '/favicon.svg', type: 'image/svg+xml' },
            { url: '/logo-icon.svg', type: 'image/svg+xml', sizes: '64x64' }
        ],
        apple: [
            { url: '/apple-touch-icon.svg', type: 'image/svg+xml', sizes: '180x180' },
            { url: '/logo-icon.svg', type: 'image/svg+xml', sizes: '64x64' }
        ],
        shortcut: '/favicon.ico',
    },
    manifest: '/manifest.json',
}

export const viewport = {
    themeColor: '#22C55E',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    const stored = localStorage.getItem('ofms-theme');
                                    const theme = stored && ['light', 'dark'].includes(stored) ? stored : 'light';
                                    
                                    document.documentElement.classList.add('theme-' + theme);
                                    
                                    // Apply immediate background to prevent flash
                                    if (theme === 'dark') {
                                        document.documentElement.style.backgroundColor = '#111827';
                                        document.documentElement.style.color = '#e5e7eb';
                                    } else {
                                        document.documentElement.style.backgroundColor = '#ffffff';
                                        document.documentElement.style.color = '#374151';
                                    }
                                } catch (e) {
                                    // Fallback to light theme
                                    document.documentElement.classList.add('theme-light');
                                    document.documentElement.style.backgroundColor = '#ffffff';
                                    document.documentElement.style.color = '#374151';
                                }
                            })();
                        `,
                    }}
                />
            </head>
            <body>
                <ThemeProvider>
                    <AuthProvider>
                        <TenantProvider>
                            <FeedbackProvider>
                                <HelpProvider>
                                    <ConditionalLayout>
                                        {children}
                                    </ConditionalLayout>
                                    <HelpModal />
                                    <TutorialOverlay />
                                    <Toaster />
                                </HelpProvider>
                            </FeedbackProvider>
                        </TenantProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    )
} 