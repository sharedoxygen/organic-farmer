import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';
import { getAuthUser } from '@/lib/middleware/requestGuards';

const prisma = new PrismaClient();

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

/**
 * GET /api/farms/all - Get all farms (SYSTEM ADMIN ONLY)
 * ✅ CLEAN: No hardcoded data, proper system admin check
 */
export async function GET(request: NextRequest) {
    try {
        // Authenticate via cookie-based session
        const user = await getAuthUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }
        if (!(user as any).isActive) {
            return NextResponse.json(
                { error: 'User not found or inactive' },
                { status: 403 }
            );
        }

        // ✅ CLEAN: Check if user is system admin (NO HARDCODED DATA)
        if (!isSystemAdmin(user as any)) {
            return NextResponse.json(
                { error: 'Access denied. System admin privileges required.' },
                { status: 403 }
            );
        }

        // Get all farms for system admin
        const farms = await prisma.farms.findMany({
            orderBy: { created_at: 'desc' },
            include: {
                farm_users: {
                    select: {
                        user_id: true,
                        role: true,
                        is_active: true
                    },
                    where: { is_active: true }
                }
            }
        });

        const farmsWithStats = farms.map(farm => ({
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
            updated_at: farm.updated_at,
            user_count: farm.farm_users.length
        }));

        return NextResponse.json({
            success: true,
            farms: farmsWithStats,
            total: farmsWithStats.length
        });

    } catch (error) {
        console.error('Error fetching all farms:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    } finally {
        // Let global client handle connection lifecycle; avoid disconnect thrash under Next.js
    }
} 