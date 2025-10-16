import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/farms/[farmId]/users - Get farm users
export async function GET(
    request: NextRequest,
    { params }: { params: { farmId: string } }
) {
    try {
        const farmId = params.farmId;

        if (!farmId) {
            return NextResponse.json(
                { error: 'Farm ID is required' },
                { status: 400 }
            );
        }

        console.log('👥 Fetching farm users for:', farmId);

        // Get farm users with their details
        const farmUsers = await (prisma as any).farm_users.findMany({
            where: {
                farm_id: farmId
            },
            include: {
                users: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            },
            orderBy: {
                joined_at: 'desc'
            }
        });

        console.log(`✅ Found ${farmUsers.length} users for farm:`, farmId);

        return NextResponse.json({
            success: true,
            users: farmUsers,
            totalUsers: farmUsers.length
        });

    } catch (error) {
        console.error('❌ Error fetching farm users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch farm users', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// POST /api/farms/[farmId]/users - Add user to farm
export async function POST(
    request: NextRequest,
    { params }: { params: { farmId: string } }
) {
    try {
        const farmId = params.farmId;
        const body = await request.json();

        if (!farmId) {
            return NextResponse.json(
                { error: 'Farm ID is required' },
                { status: 400 }
            );
        }

        if (!body.user_id || !body.role) {
            return NextResponse.json(
                { error: 'User ID and role are required' },
                { status: 400 }
            );
        }

        console.log('👥 Adding user to farm:', farmId, body);

        // Check if user is already in the farm
        const existingFarmUser = await (prisma as any).farm_users.findFirst({
            where: {
                farm_id: farmId,
                user_id: body.user_id
            }
        });

        if (existingFarmUser) {
            return NextResponse.json(
                { error: 'User is already a member of this farm' },
                { status: 409 }
            );
        }

        // Add user to farm
        const farmUser = await (prisma as any).farm_users.create({
            data: {
                farm_id: farmId,
                user_id: body.user_id,
                role: body.role,
                permissions: JSON.stringify(body.permissions || []),
                is_active: true,
                joined_at: new Date()
            }
        });

        console.log('✅ User added to farm successfully');

        return NextResponse.json({
            success: true,
            farmUser: farmUser,
            message: 'User added to farm successfully'
        });

    } catch (error) {
        console.error('❌ Error adding user to farm:', error);
        return NextResponse.json(
            { error: 'Failed to add user to farm', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
} 