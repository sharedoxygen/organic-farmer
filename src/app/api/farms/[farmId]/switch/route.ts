import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/middleware/requestGuards';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// POST /api/farms/[farmId]/switch - Switch to a different farm
export async function POST(
    request: NextRequest,
    { params }: { params: { farmId: string } }
) {
    try {
        const farmId = params.farmId;

        const user = await getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        console.log('🔄 Farm switch requested:', { userId: user.id, farmId });

        const globalAdmin = isSystemAdmin(user as any);

        // Verify the user has access to this farm
        let farmData: any;
        let userRole = 'TEAM_MEMBER';
        if (globalAdmin) {
            const farm = await (prisma as any).farms.findUnique({
                where: { id: farmId },
                select: {
                    id: true,
                    farm_name: true,
                    business_name: true,
                    subdomain: true,
                    settings: true,
                },
            });

            if (!farm) {
                return NextResponse.json({ error: 'Farm not found' }, { status: 404 });
            }

            farmData = farm;
            userRole = 'SYSTEM_ADMIN';
        } else {
            const farmAccess = await (prisma as any).farm_users.findFirst({
                where: {
                    user_id: user.id,
                    farm_id: farmId,
                    is_active: true
                },
                include: {
                    farms: {
                        select: {
                            id: true,
                            farm_name: true,
                            business_name: true,
                            subdomain: true,
                            settings: true
                        }
                    }
                }
            });

            if (!farmAccess) {
                console.log('❌ Access denied - User not authorized for farm:', farmId);
                return NextResponse.json({
                    error: 'Access denied. You are not authorized to access this farm.'
                }, { status: 403 });
            }

            userRole = farmAccess.role || 'TEAM_MEMBER';
            farmData = {
                id: farmAccess.farms.id,
                farm_name: farmAccess.farms.farm_name,
                business_name: farmAccess.farms.business_name,
                subdomain: farmAccess.farms.subdomain,
                settings: farmAccess.farms.settings
            };
        }

        console.log('✅ Farm switch successful:', farmData.farm_name);

        return NextResponse.json({
            success: true,
            message: 'Farm switched successfully',
            farm: farmData,
            userRole: userRole
        });

    } catch (error) {
        console.error('❌ Error switching farms:', error);
        return NextResponse.json({
            error: 'Internal server error during farm switch'
        }, { status: 500 });
    }
}