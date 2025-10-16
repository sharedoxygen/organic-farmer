import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// POST /api/farms/[farmId]/switch - Switch to a different farm
export async function POST(
    request: NextRequest,
    { params }: { params: { farmId: string } }
) {
    try {
        const farmId = params.farmId;

        // Get user ID from Authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({
                error: 'Authentication required'
            }, { status: 401 });
        }

        const userId = authHeader.replace('Bearer ', '');
        console.log('🔄 Farm switch requested:', { userId, farmId });

        // Verify the user has access to this farm
        const farmAccess = await (prisma as any).farm_users.findFirst({
            where: {
                user_id: userId,
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

        // Get user's role for this farm
        const userRole = farmAccess.role || 'TEAM_MEMBER';

        // Return success with farm information
        const farmData = {
            id: farmAccess.farms.id,
            farm_name: farmAccess.farms.farm_name,
            business_name: farmAccess.farms.business_name,
            subdomain: farmAccess.farms.subdomain,
            settings: farmAccess.farms.settings
        };

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
    } finally {
        await prisma.$disconnect();
    }
} 