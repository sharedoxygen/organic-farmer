'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Layout from './Layout/Layout'
import { useAuth } from './AuthProvider'
import { ReactNode } from 'react'

interface ConditionalLayoutProps {
    children: ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout, isAuthenticated, isLoading } = useAuth()

    // Routes that should not have the full layout
    const noLayoutRoutes = ['/login', '/register', '/welcome', '/auth/signin', '/auth/signup']
    const publicRoutes = ['/auth/signin', '/auth/signup', '/']

    // Check if current route should have no layout
    const shouldShowLayout = !noLayoutRoutes.includes(pathname)
    const isPublicRoute = publicRoutes.includes(pathname)

    // ⚡ PERFORMANCE: Optimized authentication redirect handling
    useEffect(() => {
        if (isLoading) return // Don't redirect while loading

        // Only handle redirects for unauthenticated users on protected routes
        if (!isAuthenticated && !isPublicRoute) {
            console.log('🚪 Redirecting to signin - unauthenticated user on protected route')
            router.push('/auth/signin')
            return
        }

        // Don't redirect authenticated users from signin page - let them navigate manually
        // This prevents redirect loops during the login process
    }, [isAuthenticated, isLoading, isPublicRoute, pathname, router])

    // Show loading only during initial auth check
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: 'var(--bg-primary, #ffffff)',
                color: 'var(--text-secondary, #6b7280)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        border: '3px solid var(--primary-color, #22c55e)',
                        borderTop: '3px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }} />
                    <p>Loading authentication...</p>
                </div>
            </div>
        )
    }

    // Show layout for authenticated users on protected routes
    if (shouldShowLayout && isAuthenticated && user) {
        // Convert user to the format expected by Layout
        const authUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            roles: [user.role], // Convert single role to array format expected by Layout
            effectiveRole: user.role
        }

        return <Layout user={authUser} onLogout={logout}>{children}</Layout>
    }

    // For public routes, show content without layout
    if (isPublicRoute) {
        return <>{children}</>
    }

    // For unauthenticated users on protected routes, show minimal loading
    // (redirect should handle this, but this is a fallback)
    if (!isAuthenticated && !isPublicRoute) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: 'var(--bg-primary, #ffffff)',
                color: 'var(--text-secondary, #6b7280)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <p>Redirecting to login...</p>
                </div>
            </div>
        )
    }

    // Default: show content without layout
    return <>{children}</>
} 