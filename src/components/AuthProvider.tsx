'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
    id: string
    email: string
    name: string
    role: string
}

interface AuthContextType {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (email: string, password: string) => Promise<boolean>
    logout: () => void
    quickLogin: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [initialized, setInitialized] = useState(false)

    useEffect(() => {
        if (initialized) return

        const checkAuth = () => {
            try {
                // ⚡ PERFORMANCE: Batch localStorage operations
                const oldAuthToken = localStorage.getItem('authToken')
                const oldCurrentUser = localStorage.getItem('currentUser')
                const storedUser = localStorage.getItem('ofms_user')

                // Clean up old tokens
                if (oldAuthToken || oldCurrentUser) {
                    console.log('🧹 Cleaning up old authentication tokens')
                    localStorage.removeItem('authToken')
                    localStorage.removeItem('currentUser')
                }

                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser)
                    if (parsedUser && parsedUser.id && parsedUser.email && parsedUser.name && parsedUser.role) {
                        // Prefer SYSTEM_ADMIN when multiple roles are known in cookie profile
                        const role = String(parsedUser.role).toUpperCase()
                        parsedUser.role = role
                        setUser(parsedUser)
                        console.log('✅ Authenticated user loaded:', parsedUser.name)
                    } else {
                        console.log('⚠️ Invalid stored user data, clearing')
                        localStorage.removeItem('ofms_user')
                    }
                } else {
                    // Try cookie-based session
                    fetch('/api/users/me', { method: 'GET', credentials: 'include' })
                        .then(async res => {
                            if (!res.ok) return
                            const result = await res.json()
                            if (result?.success && result.user) {
                                const primaryRole = Array.isArray(result.user.roles) && result.user.roles.length > 0 ? result.user.roles[0] : 'TEAM_MEMBER'
                                const u = {
                                    id: result.user.id,
                                    email: result.user.email,
                                    name: result.user.name,
                                    role: String(primaryRole).toUpperCase(),
                                }
                                localStorage.setItem('ofms_user', JSON.stringify(u))
                                setUser(u)
                            }
                        })
                        .catch(() => { })
                }
            } catch (error) {
                console.error('❌ Error parsing stored user:', error)
                localStorage.removeItem('ofms_user')
            }

            setIsLoading(false)
            setInitialized(true)
            console.log('✅ Authentication initialization completed')
        }

        // ⚡ PERFORMANCE: Use setTimeout to avoid blocking main thread
        if (typeof window !== 'undefined') {
            setTimeout(checkAuth, 0)
        } else {
            // Fallback for SSR
            setIsLoading(false)
            setInitialized(true)
        }
    }, [initialized])

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            console.log('🔐 Attempting login for:', email)

            // 🔒 SECURITY: Use API authentication instead of hardcoded users
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const result = await response.json();

                // Handle roles array from API response
                const roles = result.user.roles || [];
                console.log('🔍 Raw roles from API:', roles);

                // Handle cases where roles might be a string array with comma-separated values
                let processedRoles = roles;
                if (roles.length > 0 && typeof roles[0] === 'string' && roles[0].includes(',')) {
                    processedRoles = roles[0].split(',').map((role: string) => role.trim());
                    console.log('🔧 Processed comma-separated roles:', processedRoles);
                }

                // Prefer SYSTEM_ADMIN when present
                const hasSystemAdmin = processedRoles.some((r: string) => String(r).toUpperCase() === 'SYSTEM_ADMIN');
                const primaryRole = hasSystemAdmin ? 'SYSTEM_ADMIN' : (processedRoles.length > 0 ? processedRoles[0] : 'TEAM_MEMBER');

                const userData: User = {
                    id: result.user.id,
                    email: result.user.email,
                    name: `${result.user.firstName} ${result.user.lastName}`,
                    role: primaryRole
                };

                localStorage.setItem('ofms_user', JSON.stringify(userData))
                setUser(userData)
                console.log('✅ Login successful:', userData.name, 'Role:', primaryRole)
                console.log('✅ User state set, authentication should be active')
                return true
            } else {
                const error = await response.json();
                console.log('❌ Login failed:', error.error)
                return false
            }
        } catch (error) {
            console.error('❌ Login failed:', error)
            return false
        }
    }

    const quickLogin = () => {
        try {
            console.log('🚀 Quick login not available - use proper authentication')
            // Quick login removed - all authentication must go through proper channels
        } catch (error) {
            console.error('❌ Quick login failed:', error)
        }
    }

    const logout = () => {
        try {
            console.log('👋 Logging out user:', user?.name)
            setUser(null)
            localStorage.removeItem('ofms_user')
            localStorage.removeItem('ofms_current_farm')
            console.log('✅ Logout successful')
        } catch (error) {
            console.error('❌ Logout failed:', error)
        }
    }

    const contextValue: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        quickLogin,
    }

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
} 