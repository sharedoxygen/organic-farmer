import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // CRITICAL: Get ONLY farms the user has access to via farm_users
        const userFarms = await prisma.farm_users.findMany({
            where: {
                user_id: userId,
                is_active: true
            },
            include: {
                farms: true
            }
        });

        // Map to farm data with user's role for each farm
        const farms = userFarms.map((farmUser: any) => ({
            id: farmUser.farms.id,
            name: farmUser.farms.farm_name,
            businessName: farmUser.farms.business_name,
            subdomain: farmUser.farms.subdomain,
            plan: farmUser.farms.subscription_plan,
            status: farmUser.farms.subscription_status,
            settings: farmUser.farms.settings,
            ownerId: farmUser.farms.owner_id,
            createdAt: farmUser.farms.created_at,
            updatedAt: farmUser.farms.updated_at,
            userRole: farmUser.role,
            userPermissions: farmUser.permissions
        }));

        return NextResponse.json({
            success: true,
            farms,
            totalFarms: farms.length
        });

    } catch (error) {
        console.error('Error fetching user farms:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
} 