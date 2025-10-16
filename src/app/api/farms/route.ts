import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, HttpError } from '@/lib/middleware/requestGuards';
import bcrypt from 'bcryptjs';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';

// use shared prisma from lib/db

// GET /api/farms - Get all farms (admin only)
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user || !isSystemAdmin(user)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        console.log('🏢 Fetching farms...');

        // Get all farms in the system
        const farms = await (prisma as any).farms.findMany({
            select: {
                id: true,
                farm_name: true,
                business_name: true,
                subdomain: true,
                owner_id: true,
                subscription_plan: true,
                subscription_status: true,
                settings: true,
                created_at: true,
                updated_at: true
            },
            orderBy: {
                farm_name: 'asc'
            }
        });

        console.log(`✅ Found ${farms.length} farms in system`);

        return NextResponse.json({
            success: true,
            farms: farms,
            totalFarms: farms.length
        });

    } catch (error) {
        console.error('❌ Error fetching farms:', error);
        return NextResponse.json(
            { error: 'Failed to fetch farms', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// POST /api/farms - Create new farm
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user || !isSystemAdmin(user)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        console.log('🏢 Creating new farm:', body);

        // Validate required fields
        if (!body.farm_name || !body.owner_email) {
            return NextResponse.json(
                { error: 'Farm name and owner email are required' },
                { status: 400 }
            );
        }

        // Check if farm name already exists
        const existingFarm = await (prisma as any).farms.findFirst({
            where: {
                farm_name: body.farm_name
            }
        });

        if (existingFarm) {
            return NextResponse.json(
                { error: 'Farm name already exists' },
                { status: 409 }
            );
        }

        // If parent_farm_id is provided, validate it
        if (body.parent_farm_id) {
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

        // Check if owner exists or create new owner
        let owner = await (prisma as any).users.findUnique({
            where: {
                email: body.owner_email
            }
        });

        if (!owner) {
            // Create new owner user (requires password in request)
            const ownerId = crypto.randomUUID();
            const ownerPassword: string | undefined = body.owner_password;
            const hashed = ownerPassword ? await bcrypt.hash(ownerPassword, 12) : await bcrypt.hash(crypto.randomUUID(), 12);
            owner = await (prisma as any).users.create({
                data: {
                    id: ownerId,
                    firstName: body.owner_name?.split(' ')[0] || 'Owner',
                    lastName: body.owner_name?.split(' ').slice(1).join(' ') || 'User',
                    email: body.owner_email,
                    password: hashed,
                    roles: JSON.stringify(['OWNER']),
                    phone: body.owner_phone || '',
                    isActive: true,
                    permissions: JSON.stringify(['ALL']),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
        }

        // Create farm
        const farmId = crypto.randomUUID();
        const farm = await (prisma as any).farms.create({
            data: {
                id: farmId,
                farm_name: body.farm_name,
                business_name: body.business_name || body.farm_name,
                subdomain: body.subdomain || null,
                owner_id: owner.id,
                parent_farm_id: body.parent_farm_id || null,
                subscription_plan: body.subscription_plan || 'starter',
                subscription_status: 'active',
                trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
                settings: JSON.stringify({
                    timezone: body.timezone || 'America/Los_Angeles',
                    currency: body.currency || 'USD',
                    locale: body.locale || 'en-US',
                    features: {
                        cannabis_module: body.cannabis_module || false,
                        iot_integration: true,
                        api_access: true
                    }
                }),
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        // Create farm-user association for the owner
        await (prisma as any).farm_users.create({
            data: {
                farm_id: farmId,
                user_id: owner.id,
                role: 'OWNER',
                permissions: JSON.stringify(['ALL']),
                is_active: true,
                joined_at: new Date()
            }
        });

        console.log('✅ Farm created successfully:', farm.farm_name);

        return NextResponse.json({
            success: true,
            farm: farm,
            message: 'Farm created successfully'
        });

    } catch (error) {
        console.error('❌ Error creating farm:', error);
        return NextResponse.json(
            { error: 'Failed to create farm', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// PUT /api/farms - Update farm (requires farm ID in body)
export async function PUT(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user || !isSystemAdmin(user)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        console.log('🏢 Updating farm:', body);

        if (!body.id) {
            return NextResponse.json(
                { error: 'Farm ID is required' },
                { status: 400 }
            );
        }

        // Check if farm exists
        const existingFarm = await (prisma as any).farms.findUnique({
            where: {
                id: body.id
            }
        });

        if (!existingFarm) {
            return NextResponse.json(
                { error: 'Farm not found' },
                { status: 404 }
            );
        }

        // Update farm
        const updatedFarm = await (prisma as any).farms.update({
            where: {
                id: body.id
            },
            data: {
                farm_name: body.farm_name || existingFarm.farm_name,
                business_name: body.business_name || existingFarm.business_name,
                subdomain: body.subdomain || existingFarm.subdomain,
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

// DELETE /api/farms - Delete farm (requires farm ID in query)
export async function DELETE(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user || !isSystemAdmin(user)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const farmId = searchParams.get('id');

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