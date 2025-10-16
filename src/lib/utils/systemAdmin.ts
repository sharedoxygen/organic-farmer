/**
 * System Admin Utilities - ZERO HARDCODED DATA
 * Clean detection logic based on database fields only
 */

// User interface for system admin detection
interface SystemAdminUser {
    id: string;
    email: string;
    is_system_admin?: boolean;
    system_role?: string | null;
    roles?: string; // JSON string of farm-level roles
}

/**
 * ✅ CLEAN: Check if user is system administrator
 * NO HARDCODED EMAILS - uses database fields only
 */
export function isSystemAdmin(user: SystemAdminUser | null | undefined): boolean {
    if (!user) return false;

    // Primary check: is_system_admin flag
    if ((user as any).is_system_admin === true) {
        return true;
    }

    // Secondary check: system_role field
    if ((user as any).system_role) {
        const systemRoles = ['SYSTEM_ADMIN', 'PLATFORM_ADMIN', 'SUPER_ADMIN'];
        const sr = String((user as any).system_role).toUpperCase();
        if (systemRoles.includes(sr)) return true;
    }

    // Fallbacks for contexts where only a single role string is available (e.g., AuthProvider)
    const singleRole = (user as any).role;
    if (typeof singleRole === 'string' && singleRole.toUpperCase() === 'SYSTEM_ADMIN') {
        return true;
    }

    // Fallback for contexts where roles may be a JSON string or an array
    const rolesRaw: any = (user as any).roles;
    try {
        if (Array.isArray(rolesRaw)) {
            if (rolesRaw.map((r: any) => String(r).toUpperCase()).includes('SYSTEM_ADMIN')) return true;
        } else if (typeof rolesRaw === 'string' && rolesRaw.length > 0) {
            // Attempt to parse JSON array; if it fails, treat as comma-separated string
            try {
                const parsed = JSON.parse(rolesRaw);
                if (Array.isArray(parsed) && parsed.map((r: any) => String(r).toUpperCase()).includes('SYSTEM_ADMIN')) return true;
            } catch {
                const parts = rolesRaw.split(',').map(s => s.trim().toUpperCase());
                if (parts.includes('SYSTEM_ADMIN')) return true;
            }
        }
    } catch {
        // ignore
    }

    return false;
}

/**
 * ✅ CLEAN: Get system admin capabilities
 */
export function getSystemAdminCapabilities(user: SystemAdminUser | null | undefined) {
    const isAdmin = isSystemAdmin(user);

    return {
        canAccessAllFarms: isAdmin,
        canCreateFarms: isAdmin,
        canDeleteFarms: isAdmin,
        canManageAllUsers: isAdmin,
        canViewCrossFarmAnalytics: isAdmin,
        bypassesFarmRestrictions: isAdmin,
        canManageSystemSettings: isAdmin,
        canViewSystemAuditLogs: isAdmin,
        canManageBillingAcrossAllFarms: isAdmin,
        canImpersonateAnyUser: isAdmin,
    };
}

/**
 * ✅ CLEAN: Check if user can access specific farm
 * System admins bypass all farm restrictions
 */
export function canAccessFarm(user: SystemAdminUser | null | undefined, farmId: string): boolean {
    if (!user) return false;

    // System admins can access any farm
    if (isSystemAdmin(user)) {
        return true;
    }

    // Regular users must be checked via farm_users table
    // (This check happens in the calling code)
    return false;
}

/**
 * ✅ CLEAN: Get effective role for user
 * System admins have highest priority
 */
export function getEffectiveRole(user: SystemAdminUser | null | undefined): string {
    if (!user) return 'GUEST';

    // System admin overrides all other roles
    if (isSystemAdmin(user)) {
        return 'SYSTEM_ADMIN';
    }

    // Parse farm-level roles
    try {
        const farmRoles = JSON.parse(user.roles || '[]');
        if (farmRoles.length > 0) {
            // Return highest farm-level role
            const roleHierarchy = {
                'OWNER': 9,
                'ADMIN': 8,
                'FARM_MANAGER': 7,
                'OPERATIONS_MANAGER': 6,
                'PRODUCTION_LEAD': 5,
                'QUALITY_LEAD': 4,
                'TEAM_LEAD': 3,
                'TEAM_MEMBER': 2,
                'SPECIALIST': 1,
            };

            return farmRoles.reduce((highest: string, current: string) => {
                const currentLevel = roleHierarchy[current as keyof typeof roleHierarchy] || 0;
                const highestLevel = roleHierarchy[highest as keyof typeof roleHierarchy] || 0;
                return currentLevel > highestLevel ? current : highest;
            }, 'GUEST');
        }
    } catch (error) {
        console.error('Error parsing user roles:', error);
    }

    return 'GUEST';
}

/**
 * ✅ CLEAN: System admin logging utility
 */
export function logSystemAdminAction(
    userId: string,
    action: string,
    details: Record<string, any>,
    farmId?: string
): void {
    console.log('🔒 SYSTEM_ADMIN_ACTION:', {
        userId,
        action,
        details,
        farmId,
        timestamp: new Date().toISOString(),
    });

    // TODO: Implement proper audit logging to database
} 