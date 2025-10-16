import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        console.log('🏗️ Fetching zones for farm:', farmId);

        // Fetch zones for the farm
        const zones = await prisma.$queryRaw`
            SELECT 
                id,
                name,
                type,
                capacity,
                area,
                area_unit,
                description,
                status,
                created_at,
                updated_at
            FROM zones
            WHERE farm_id = ${farmId}
            ORDER BY name
        ` as any[];

        console.log(`✅ Found ${zones.length} zones for farm ${farmId}`);

        return NextResponse.json({
            success: true,
            data: zones,
            count: zones.length
        });

    } catch (error) {
        console.error('❌ Error fetching zones:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch zones' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { farmId, user } = await ensureFarmAccess(request);

        const body = await request.json();
        console.log('🏗️ Creating new zone for farm:', farmId);

        // Validate required fields
        if (!body.name || !body.type) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: name, type' },
                { status: 400 }
            );
        }

        // Check if zone name already exists for this farm
        const existingZone = await prisma.$queryRaw`
            SELECT id FROM zones 
            WHERE farm_id = ${farmId} AND name = ${body.name}
        ` as any[];

        if (existingZone.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Zone name already exists for this farm' },
                { status: 409 }
            );
        }

        // Create new zone
        const zoneId = `zone-${Date.now()}`;
        const userId = user.id;

        const zone = await prisma.$queryRaw`
            INSERT INTO zones (
                id, farm_id, name, type, capacity, area, area_unit, 
                description, status, created_by, updated_by, created_at, updated_at
            ) VALUES (
                ${zoneId}, ${farmId}, ${body.name}, ${body.type}, 
                ${body.capacity || 0}, ${body.area || null}, ${body.areaUnit || null},
                ${body.description || null}, ${body.status || 'active'}, 
                ${userId}, ${userId}, NOW(), NOW()
            ) RETURNING *
        ` as any[];

        console.log('✅ Zone created successfully');

        return NextResponse.json({
            success: true,
            data: zone[0]
        });

    } catch (error) {
        console.error('❌ Error creating zone:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create zone' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { farmId, user } = await ensureFarmAccess(request);

        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Zone ID required' },
                { status: 400 }
            );
        }

        console.log('🏗️ Updating zone:', id, 'for farm:', farmId);

        // Check if zone exists and belongs to this farm
        const existingZone = await prisma.$queryRaw`
            SELECT id FROM zones 
            WHERE id = ${id} AND farm_id = ${farmId}
        ` as any[];

        if (existingZone.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Zone not found or access denied' },
                { status: 404 }
            );
        }

        // Check if zone name already exists for this farm (excluding current zone)
        if (body.name) {
            const duplicateZone = await prisma.$queryRaw`
                SELECT id FROM zones 
                WHERE farm_id = ${farmId} AND name = ${body.name} AND id != ${id}
            ` as any[];

            if (duplicateZone.length > 0) {
                return NextResponse.json(
                    { success: false, error: 'Zone name already exists for this farm' },
                    { status: 409 }
                );
            }
        }

        const userId = user.id;

        // Update zone
        const updatedZone = await prisma.$queryRaw`
            UPDATE zones 
            SET 
                name = COALESCE(${body.name}, name),
                type = COALESCE(${body.type}, type),
                capacity = COALESCE(${body.capacity}, capacity),
                area = COALESCE(${body.area}, area),
                area_unit = COALESCE(${body.areaUnit}, area_unit),
                description = COALESCE(${body.description}, description),
                status = COALESCE(${body.status}, status),
                updated_by = ${userId},
                updated_at = NOW()
            WHERE id = ${id} AND farm_id = ${farmId}
            RETURNING *
        ` as any[];

        console.log('✅ Zone updated successfully');

        return NextResponse.json({
            success: true,
            data: updatedZone[0]
        });

    } catch (error) {
        console.error('❌ Error updating zone:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update zone' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Zone ID required' },
                { status: 400 }
            );
        }

        console.log('🏗️ Deleting zone:', id, 'for farm:', farmId);

        // Check if zone exists and belongs to this farm
        const existingZone = await prisma.$queryRaw`
            SELECT id FROM zones 
            WHERE id = ${id} AND farm_id = ${farmId}
        ` as any[];

        if (existingZone.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Zone not found or access denied' },
                { status: 404 }
            );
        }

        // Check if zone is being used by any crop plans
        const cropPlansUsingZone = await prisma.$queryRaw`
            SELECT id FROM crop_plans 
            WHERE zone_id = ${id} AND farm_id = ${farmId}
        ` as any[];

        if (cropPlansUsingZone.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Cannot delete zone that is being used by crop plans' },
                { status: 409 }
            );
        }

        // Delete the zone
        await prisma.$queryRaw`
            DELETE FROM zones 
            WHERE id = ${id} AND farm_id = ${farmId}
        `;

        console.log('✅ Zone deleted successfully');

        return NextResponse.json({
            success: true,
            message: 'Zone deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting zone:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete zone' },
            { status: 500 }
        );
    }
} 