import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

// 🔧 Fix Next.js static generation error
// This route uses request.headers so it must be dynamic
export const dynamic = 'force-dynamic';

// GET /api/environments - List all growing environments
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const type = searchParams.get('type') || '';
        const status = searchParams.get('status') || '';

        // Enforce auth + farm access
        const { farmId } = await ensureFarmAccess(request);

        console.log('🏠 Fetching growing environments for farm:', farmId);

        const skip = (page - 1) * limit;

        // Build where clause with farm filter
        const where: Record<string, unknown> = {
            farm_id: farmId
        };

        if (type) {
            where.type = type;
        }

        if (status) {
            where.status = status;
        }

        // Get total count for pagination
        const total = await prisma.growing_environments.count({ where });

        // Get environments
        const environments = await prisma.growing_environments.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });

        console.log(`✅ Found ${environments.length} growing environments for farm ${farmId}`);

        return NextResponse.json({
            success: true,
            environments: environments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching growing environments:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch growing environments' },
            { status: 500 }
        );
    }
}

// POST /api/environments - Create new growing environment
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Enforce auth + farm access consistently
        const { farmId, user } = await ensureFarmAccess(request);

        const body = await request.json();
        console.log('🏠 Creating growing environment for farm:', farmId, body);

        // Validate required fields
        if (!body.name || !body.type) {
            return NextResponse.json(
                { success: false, error: 'Name and type are required' },
                { status: 400 }
            );
        }

        // Create the growing environment
        const data: any = {
            id: `env-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            farm_id: farmId,
            createdBy: user.id,
            name: body.name,
            type: body.type,
            location: body.location || '',
            maxBatches: Number(body.maxBatches ?? 10),
            totalArea: Number(body.totalArea ?? 100.0),
            areaUnit: body.areaUnit || 'sqft',
            currentTemp: Number(body.currentTemp ?? 20.0),
            currentHumidity: Number(body.currentHumidity ?? 60.0),
            currentLightLevel: Number(body.currentLightLevel ?? 100.0),
            targetTempMin: Number(body.targetTempMin ?? 18.0),
            targetTempMax: Number(body.targetTempMax ?? 25.0),
            targetHumidityMin: Number(body.targetHumidityMin ?? 55.0),
            targetHumidityMax: Number(body.targetHumidityMax ?? 70.0),
            targetLightHours: Number(body.targetLightHours ?? 12.0),
            equipmentIds: body.equipmentIds || '',
            status: body.status || 'optimal',
            createdAt: new Date(),
            updatedAt: new Date()
        }
        if (body.currentCO2 != null) data.currentCO2 = Number(body.currentCO2)
        if (body.currentPH != null) data.currentPH = Number(body.currentPH)
        if (body.targetCO2 != null) data.targetCO2 = Number(body.targetCO2)
        if (body.targetPH != null) data.targetPH = Number(body.targetPH)

        const environment = await prisma.growing_environments.create({ data });

        console.log('✅ Growing environment created successfully:', environment.id);

        return NextResponse.json({
            success: true,
            environment: environment
        });

    } catch (error) {
        console.error('Error creating growing environment:', error);
        const message = error instanceof Error ? error.message : 'Failed to create growing environment'
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

// PUT /api/environments/[id] - Update growing environment
export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        const farmId = request.headers.get('X-Farm-ID');
        if (!farmId) {
            return NextResponse.json(
                { success: false, error: 'Farm ID required' },
                { status: 400 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Environment ID required' },
                { status: 400 }
            );
        }

        const body = await request.json();
        console.log('🏠 Updating growing environment:', id, body);

        // Check if environment exists and belongs to farm
        const existingEnvironment = await prisma.growing_environments.findFirst({
            where: {
                id: id,
                farm_id: farmId
            }
        });

        if (!existingEnvironment) {
            return NextResponse.json(
                { success: false, error: 'Environment not found' },
                { status: 404 }
            );
        }

        // Update the environment
        const updatedEnvironment = await prisma.growing_environments.update({
            where: { id: id },
            data: {
                ...body,
                updatedAt: new Date()
            }
        });

        console.log('✅ Growing environment updated successfully:', updatedEnvironment.id);

        return NextResponse.json({
            success: true,
            environment: updatedEnvironment
        });

    } catch (error) {
        console.error('Error updating growing environment:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update growing environment' },
            { status: 500 }
        );
    }
}

// DELETE /api/environments/[id] - Delete growing environment
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const farmId = request.headers.get('X-Farm-ID');
        if (!farmId) {
            return NextResponse.json(
                { success: false, error: 'Farm ID required' },
                { status: 400 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Environment ID required' },
                { status: 400 }
            );
        }

        console.log('🏠 Deleting growing environment:', id);

        // Check if environment exists and belongs to farm
        const existingEnvironment = await prisma.growing_environments.findFirst({
            where: {
                id: id,
                farm_id: farmId
            }
        });

        if (!existingEnvironment) {
            return NextResponse.json(
                { success: false, error: 'Environment not found' },
                { status: 404 }
            );
        }

        // Delete the environment
        await prisma.growing_environments.delete({
            where: { id: id }
        });

        console.log('✅ Growing environment deleted successfully:', id);

        return NextResponse.json({
            success: true,
            message: 'Environment deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting growing environment:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete growing environment' },
            { status: 500 }
        );
    }
} 