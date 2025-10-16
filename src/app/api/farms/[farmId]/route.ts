import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthUser, HttpError } from '@/lib/middleware/requestGuards';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';

const prisma = new PrismaClient();

// GET /api/farms/[farmId] - Get individual farm details
export async function GET(
    request: NextRequest,
    { params }: { params: { farmId: string } }
) {
    try {
        const farmId = params.farmId;
        const user = await getAuthUser(request);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!farmId) {
            return NextResponse.json(
                { error: 'Farm ID is required' },
                { status: 400 }
            );
        }

        // System admin can access any farm
        if (!isSystemAdmin(user)) {
            // Check if user is a member of the farm
            const farmUser = await prisma.farm_users.findFirst({
                where: {
                    farm_id: farmId,
                    user_id: user.id,
                    is_active: true,
                },
            });

            if (!farmUser) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        console.log('🏢 Fetching farm details for:', farmId);

        // Get farm details
        const farm = await (prisma as any).farms.findUnique({
            where: {
                id: farmId
            },
            select: {
                id: true,
                farm_name: true,
                business_name: true,
                subdomain: true,
                owner_id: true,
                subscription_plan: true,
                subscription_status: true,
                trial_ends_at: true,
                settings: true,
                created_at: true,
                updated_at: true
            }
        });

        if (!farm) {
            return NextResponse.json(
                { error: 'Farm not found' },
                { status: 404 }
            );
        }

        console.log('✅ Farm details retrieved:', farm.farm_name);

        return NextResponse.json({
            success: true,
            farm: farm
        });

    } catch (error) {
        console.error('❌ Error fetching farm details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch farm details', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// PUT /api/farms/[farmId] - Update individual farm
export async function PUT(
    request: NextRequest,
    { params }: { params: { farmId: string } }
) {
    try {
        const farmId = params.farmId;
        const user = await getAuthUser(request);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const body = await request.json();

        if (!farmId) {
            return NextResponse.json(
                { error: 'Farm ID is required' },
                { status: 400 }
            );
        }

        console.log('🏢 Updating farm:', farmId, body);

        // Check if farm exists
        const existingFarm = await (prisma as any).farms.findUnique({
            where: {
                id: farmId
            }
        });

        if (!existingFarm) {
            return NextResponse.json(
                { error: 'Farm not found' },
                { status: 404 }
            );
        }

        // Auth check: system admin or farm owner/admin
        if (!isSystemAdmin(user)) {
            const farmUser = await prisma.farm_users.findFirst({
                where: {
                    farm_id: farmId,
                    user_id: user.id,
                    is_active: true,
                    role: { in: ['OWNER', 'ADMIN'] },
                },
            });

            if (!farmUser && existingFarm.owner_id !== user.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // If parent_farm_id is provided, validate it
        if (body.parent_farm_id) {
            if (body.parent_farm_id === farmId) {
                return NextResponse.json({ error: 'A farm cannot be its own parent' }, { status: 400 });
            }
            const parentFarm = await (prisma as any).farms.findUnique({
                where: { id: body.parent_farm_id },
            });
            if (!parentFarm) {
                return NextResponse.json(
                    { error: 'Parent farm not found' },
                    { status: 404 }
                );
            }
        }
        
        // Update farm
        const updatedFarm = await (prisma as any).farms.update({
            where: {
                id: farmId
            },
            data: {
                farm_name: body.farm_name || existingFarm.farm_name,
                business_name: body.business_name || existingFarm.business_name,
                subdomain: body.subdomain || existingFarm.subdomain,
                parent_farm_id: body.parent_farm_id !== undefined ? body.parent_farm_id : existingFarm.parent_farm_id,
                subscription_plan: body.subscription_plan || existingFarm.subscription_plan,
                subscription_status: body.subscription_status || existingFarm.subscription_status,
                settings: body.settings ? JSON.stringify(body.settings) : existingFarm.settings,
                updated_at: new Date()
            }
        });

        console.log('✅ Farm updated successfully:', updatedFarm.farm_name);

        return NextResponse.json({
            success: true,
            farm: updatedFarm,
            message: 'Farm updated successfully'
        });

    } catch (error) {
        console.error('❌ Error updating farm:', error);
        return NextResponse.json(
            { error: 'Failed to update farm', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// DELETE /api/farms/[farmId] - Delete individual farm
export async function DELETE(
    request: NextRequest,
    { params }: { params: { farmId: string } }
) {
    try {
        const farmId = params.farmId;
        const user = await getAuthUser(request);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!farmId) {
            return NextResponse.json(
                { error: 'Farm ID is required' },
                { status: 400 }
            );
        }

        console.log('🏢 Deleting farm:', farmId);

        // Check if farm exists
        const existingFarm = await (prisma as any).farms.findUnique({
            where: {
                id: farmId
            }
        });

        if (!existingFarm) {
            return NextResponse.json(
                { error: 'Farm not found' },
                { status: 404 }
            );
        }
        
        // Auth check: system admin or farm owner
        if (!isSystemAdmin(user) && existingFarm.owner_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden: Only the farm owner or a system admin can delete a farm.' }, { status: 403 });
        }

        // Delete farm (cascade will handle related records)
        await (prisma as any).farms.delete({
            where: {
                id: farmId
            }
        });

        console.log('✅ Farm deleted successfully');

        return NextResponse.json({
            success: true,
            message: 'Farm deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting farm:', error);
        return NextResponse.json(
            { error: 'Failed to delete farm', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
} 