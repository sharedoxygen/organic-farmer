'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Farm, TenantContextType, FarmUser } from '@/types';
import { tenantApiService } from '@/lib/api/tenantApiService';
import { useAuth } from './AuthProvider';
import { isSystemAdmin, canAccessFarm } from '@/lib/utils/systemAdmin';

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [currentFarm, setCurrentFarm] = useState<Farm | null>(null);
    const [availableFarms, setAvailableFarms] = useState<Farm[]>([]);
    const [userFarmRole, setUserFarmRole] = useState<string | null>(null);
    const [farmPermissions, setFarmPermissions] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);

    // Initialize tenant context when user authenticates
    useEffect(() => {
        if (!isAuthenticated || !user || initialized) return;

        const initializeTenant = async () => {
            try {
                setIsLoading(true);

                // ✅ CLEAN: System admin gets all farms, regular users get their farms only
                let farms: Farm[] = [];

                try {
                    if (isSystemAdmin(user)) {
                        // System admin can access all farms
                        const response = await fetch('/api/farms/all', { credentials: 'include' });
                        const data = await response.json();
                        if (data.success) {
                            farms = data.farms.map((farm: any) => ({
                                id: farm.id,
                                farm_name: farm.farm_name,
                                business_name: farm.business_name,
                                owner_id: farm.owner_id,
                                created_at: new Date(farm.created_at),
                                updated_at: new Date(farm.updated_at)
                            }));
                        }
                    } else {
                        // Regular users: Fetch ONLY farms user has access to
                        const response = await fetch(`/api/farms/user/${user.id}`, { credentials: 'include' });
                        const data = await response.json();
                        if (data.success) {
                            farms = data.farms.map((farm: any) => ({
                                id: farm.id,
                                farm_name: farm.name,
                                business_name: farm.businessName,
                                owner_id: farm.ownerId,
                                created_at: new Date(farm.createdAt),
                                updated_at: new Date(farm.updatedAt)
                            }));
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch farms:', error);
                }

                // If no farms accessible, user has no access (correct behavior)
                if (farms.length === 0) {
                    console.warn('User has no farm access');
                    setCurrentFarm(null);
                    setAvailableFarms([]);
                    setUserFarmRole(null);
                    setInitialized(true);
                    setIsLoading(false);
                    return;
                }

                setAvailableFarms(farms);

                // Set current farm from cookie or last selection or default to first
                const storedFarmId = localStorage.getItem('ofms_current_farm');
                let cookieFarmId: string | null = null;
                try {
                    const match = document.cookie.match(/(?:^|; )ofms_farm=([^;]+)/);
                    cookieFarmId = match ? decodeURIComponent(match[1]) : null;
                } catch { }
                let targetFarm = farms[0];

                if (cookieFarmId) {
                    const cookieFarm = farms.find(f => f.id === cookieFarmId);
                    if (cookieFarm) {
                        targetFarm = cookieFarm;
                    }
                } else if (storedFarmId) {
                    const storedFarm = farms.find(f => f.id === storedFarmId);
                    if (storedFarm) {
                        targetFarm = storedFarm;
                    }
                }

                // Set current farm immediately
                setCurrentFarm(targetFarm);
                // Persist choice immediately for refresh/navigation
                tenantApiService.setFarmContext(targetFarm.id);
                localStorage.setItem('ofms_current_farm', targetFarm.id);

                // ✅ CLEAN: System admin gets SYSTEM_ADMIN role, regular users get ADMIN
                const userRole = isSystemAdmin(user) ? 'SYSTEM_ADMIN' : 'ADMIN';
                setUserFarmRole(userRole);

                setInitialized(true);

            } catch (error) {
                console.error('Failed to initialize tenant context:', error);
                // Even on error, provide fallback
                const fallbackFarm = {
                    id: 'fallback-farm-id',
                    farm_name: 'Demo Farm',
                    business_name: 'Demo Farm',
                    owner_id: 'demo-owner-id',
                    created_at: new Date(),
                    updated_at: new Date()
                };
                setCurrentFarm(fallbackFarm);
                setAvailableFarms([fallbackFarm]);
                setUserFarmRole('ADMIN');
                setInitialized(true);
            } finally {
                setIsLoading(false);
            }
        };

        initializeTenant();
    }, [isAuthenticated, user, initialized]);

    // Internal farm switching logic
    const switchFarmInternal = async (farmId: string) => {
        const targetFarm = availableFarms.find(f => f.id === farmId);

        if (targetFarm) {
            setCurrentFarm(targetFarm);

            // ✅ CLEAN: System admin gets SYSTEM_ADMIN role, regular users get ADMIN
            const userRole = isSystemAdmin(user) ? 'SYSTEM_ADMIN' : 'ADMIN';
            setUserFarmRole(userRole);

            tenantApiService.setFarmContext(farmId);
            localStorage.setItem('ofms_current_farm', farmId);
            localStorage.setItem('ofms_farm_id', farmId);
            try {
                document.cookie = `ofms_farm=${encodeURIComponent(farmId)}; path=/`;
            } catch { }

            // Persist farm context server-side if needed
            try {
                await fetch('/api/tenant/select-farm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ farmId }),
                })
            } catch (err) {
                // Non-blocking
            }

            // Smooth refresh: notify app to refetch with new farm in background (no visible full reload)
            try {
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('ofms:farm:changed'));
                    // Hint to pages to re-fetch; they should listen to 'ofms:farm:changed' or useEffect on farm id
                    // Avoid full reload for seamless UX
                }
            } catch { }
        }
    };

    // Public farm switching function - PRODUCTION SIMPLIFIED
    const switchFarm = async (farmId: string): Promise<void> => {
        if (currentFarm?.id === farmId) return;

        setIsLoading(true);
        await switchFarmInternal(farmId);
        setIsLoading(false);
    };

    // Reset tenant context on logout
    useEffect(() => {
        if (!isAuthenticated) {
            setCurrentFarm(null);
            setAvailableFarms([]);
            setUserFarmRole(null);
            setFarmPermissions({});
            setInitialized(false);
            localStorage.removeItem('ofms_current_farm');
        }
    }, [isAuthenticated]);

    const contextValue: TenantContextType = {
        currentFarm,
        availableFarms,
        switchFarm,
        userFarmRole,
        farmPermissions,
        isLoading,
    };

    return (
        <TenantContext.Provider value={contextValue}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}

// Helper hook for checking farm permissions
export function useFarmPermissions() {
    const { userFarmRole, farmPermissions } = useTenant();

    const hasRole = (requiredRole: string): boolean => {
        const roleHierarchy = {
            'OWNER': 5,
            'ADMIN': 4,
            'FARM_MANAGER': 3,
            'OPERATIONS_MANAGER': 3,
            'PRODUCTION_LEAD': 2,
            'QUALITY_LEAD': 2,
            'TEAM_MEMBER': 1,
            'QUALITY_SPECIALIST': 1,
            'GUEST': 0
        };

        const userLevel = roleHierarchy[userFarmRole as keyof typeof roleHierarchy] || 0;
        const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

        return userLevel >= requiredLevel;
    };

    const hasPermission = (permission: string): boolean => {
        return farmPermissions[permission] === true;
    };

    const canManageUsers = (): boolean => {
        return hasRole('FARM_MANAGER') || hasPermission('manage_users');
    };

    const canManageFarm = (): boolean => {
        return hasRole('OWNER') || hasRole('ADMIN') || hasPermission('manage_farm');
    };

    const canViewAnalytics = (): boolean => {
        return hasRole('FARM_MANAGER') || hasPermission('view_analytics');
    };

    const canManageBilling = (): boolean => {
        return hasRole('OWNER') || hasPermission('manage_billing');
    };

    return {
        hasRole,
        hasPermission,
        canManageUsers,
        canManageFarm,
        canViewAnalytics,
        canManageBilling,
        userRole: userFarmRole,
        permissions: farmPermissions,
    };
} 