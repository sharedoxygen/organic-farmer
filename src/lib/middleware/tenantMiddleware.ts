import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Farm, FarmContext } from '@/types';

const prisma = new PrismaClient();

export interface TenantRequest extends NextRequest {
    farmContext?: FarmContext;
    farmId?: string;
}

/**
 * Tenant middleware for multi-farm context management
 * Resolves farm context from subdomain, header, or session
 * Sets farm context for database query isolation
 */
export class TenantMiddleware {

    /**
     * Extract farm ID from various sources
     */
    static getFarmId(request: NextRequest): string | null {
        // 1. Try X-Farm-ID header (for API requests)
        const farmHeader = request.headers.get('X-Farm-ID');
        if (farmHeader) {
            return farmHeader;
        }

        // 2. Try subdomain (e.g., curry-island.ofms.com)
        const host = request.headers.get('host') || '';
        const subdomain = this.extractSubdomain(host);
        if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
            // Look up farm by subdomain would happen here
            // For now, return null as we'll handle this via API
            return null;
        }

        // 3. Try query parameter (for development/testing)
        const farmParam = request.nextUrl.searchParams.get('farmId');
        if (farmParam) {
            return farmParam;
        }

        // 🔒 SECURITY: No default farm - explicit farm context required
        return null;
    }

    /**
     * Extract subdomain from host
     */
    private static extractSubdomain(host: string): string | null {
        const parts = host.split('.');
        if (parts.length > 2) {
            return parts[0];
        }
        return null;
    }

    /**
     * Get farm details and validate access
     */
    static async getFarmContext(farmId: string, userId?: string): Promise<FarmContext | null> {
        try {
            const farm = await prisma.farms.findUnique({
                where: { id: farmId }
            });

            if (!farm) {
                return null;
            }

            let userRole = 'GUEST';
            let permissions = {};

            if (userId) {
                const farmUser = await prisma.farm_users.findUnique({
                    where: {
                        farm_id_user_id: {
                            farm_id: farmId,
                            user_id: userId
                        }
                    }
                });

                if (farmUser && farmUser.is_active) {
                    userRole = farmUser.role;
                    permissions = farmUser.permissions || {};
                }
            }

            return {
                farmId: farm.id,
                farm: {
                    id: farm.id,
                    farm_name: farm.farm_name,
                    business_name: farm.business_name,
                    subdomain: farm.subdomain,
                    owner_id: farm.owner_id,
                    subscription_plan: farm.subscription_plan,
                    subscription_status: farm.subscription_status,
                    trial_ends_at: farm.trial_ends_at,
                    settings: farm.settings,
                    created_at: farm.created_at,
                    updated_at: farm.updated_at
                },
                userRole,
                permissions
            };

        } catch (error) {
            console.error('Error getting farm context:', error);
            return null;
        }
    }

    /**
     * Middleware function for API routes
     */
    static async apiMiddleware(request: TenantRequest, response: NextResponse, next?: () => void) {
        const farmId = this.getFarmId(request);

        if (!farmId) {
            return NextResponse.json(
                { error: 'Farm context required' },
                { status: 400 }
            );
        }

        // Get user ID from auth header (if present)
        const authHeader = request.headers.get('Authorization');
        const userId = authHeader ? authHeader.replace('Bearer ', '') : undefined;

        const farmContext = await this.getFarmContext(farmId, userId);

        if (!farmContext) {
            return NextResponse.json(
                { error: 'Invalid farm or access denied' },
                { status: 403 }
            );
        }

        // Attach farm context to request
        request.farmContext = farmContext;
        request.farmId = farmId;

        // Set farm context for Prisma queries (would need custom Prisma extension)
        // For now, we'll pass farmId to individual queries

        return next ? next() : response;
    }

    /**
     * Helper to create farm-scoped database query options
     */
    static getFarmScope(farmId: string) {
        return {
            where: {
                farm_id: farmId
            }
        };
    }

    /**
     * Helper to add farm_id to creation data
     */
    static addFarmContext<T extends Record<string, any>>(data: T, farmId: string): T & { farm_id: string } {
        return {
            ...data,
            farm_id: farmId
        };
    }

    /**
     * Validate user has required role for farm
     */
    static hasRole(userRole: string, requiredRole: string): boolean {
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

        const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
        const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

        return userLevel >= requiredLevel;
    }

    /**
     * Check if user can access specific farm
     */
    static async canAccessFarm(userId: string, farmId: string): Promise<boolean> {
        try {
            const farmUser = await prisma.farm_users.findUnique({
                where: {
                    farm_id_user_id: {
                        farm_id: farmId,
                        user_id: userId
                    }
                }
            });

            return farmUser ? farmUser.is_active : false;
        } catch (error) {
            console.error('Error checking farm access:', error);
            return false;
        }
    }
} 