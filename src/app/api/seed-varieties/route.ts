import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

// 🔧 Fix Next.js static generation error
// This route uses request.headers so it must be dynamic
export const dynamic = 'force-dynamic';

interface SeedCreateRequest {
    name: string;
    scientificName?: string;
    supplier: string;
    stockQuantity?: number;
    minStockLevel?: number;
    unit?: string;
    costPerUnit?: number;
    germinationRate?: number;
    daysToGermination?: number;
    daysToHarvest?: number;
    storageTemp?: number;
    storageHumidity?: number;
    lightExposure?: string;
    lastOrderDate?: string;
}

// GET /api/seed-varieties - List all seed varieties with filtering
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // 🔒 Enforce auth + farm access
        const { farmId } = await ensureFarmAccess(request);

        console.log('🌾 SECURE: Fetching seed varieties for farm:', farmId);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const supplier = searchParams.get('supplier') || '';

        const skip = (page - 1) * limit;

        // 🔒 SECURITY FIX: Build where clause with MANDATORY farm filtering
        const where: Record<string, unknown> = {
            farm_id: farmId  // Database enforces multi-tenant isolation
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { scientificName: { contains: search, mode: 'insensitive' } },
                { supplier: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (status) {
            where.status = status;
        }

        if (supplier) {
            where.supplier = { contains: supplier, mode: 'insensitive' };
        }

        // Get total count for pagination (with farm filter)
        const total = await prisma.seed_varieties.count({ where });

        // Get seed varieties with relations (ONLY from this farm)
        const seedVarieties = await prisma.seed_varieties.findMany({
            where,
            skip,
            take: limit,
            include: {
                users_seed_varieties_createdByTousers: {
                    select: { firstName: true, lastName: true, email: true }
                },
                users_seed_varieties_updatedByTousers: {
                    select: { firstName: true, lastName: true, email: true }
                },
                batches: {
                    where: { farm_id: farmId }, // Also filter related batches by farm
                    select: { id: true, status: true, quantity: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`✅ SECURE: Found ${seedVarieties.length} seed varieties for farm ${farmId}`);

        // Calculate derived fields
        const enrichedData = seedVarieties.map((variety: Record<string, unknown>) => ({
            ...variety,
            activeBatches: Array.isArray(variety.batches) ?
                variety.batches.filter((b: Record<string, unknown>) =>
                    ['SEEDED', 'GERMINATING', 'GROWING'].includes(b.status as string)
                ).length : 0,
            totalProduced: Array.isArray(variety.batches) ?
                variety.batches.reduce((sum: number, b: Record<string, unknown>) => sum + ((b.quantity as number) || 0), 0) : 0,
            stockStatus: ((variety.stockQuantity as number) <= (variety.minStockLevel as number)) ?
                ((variety.stockQuantity as number) === 0 ? 'OUT_OF_STOCK' : 'LOW') : 'ADEQUATE'
        }));

        return NextResponse.json({
            success: true,
            data: enrichedData,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString(),
                'X-Farm-ID': farmId  // Track which farm this data belongs to
            }
        });

    } catch (error) {
        console.error('❌ Error fetching seed varieties:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch seed varieties',
                data: []
            },
            { status: 500 }
        );
    }
}

// POST /api/seed-varieties - Create new seed variety
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // 🔒 Enforce auth + farm access
        const { farmId, user } = await ensureFarmAccess(request);

        console.log('🌾 SECURE: Creating seed variety for farm:', farmId);

        const body = await request.json() as SeedCreateRequest;

        // Validate minimal required fields only; others will use safe defaults
        if (!body.name || !body.supplier) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: name, supplier' },
                { status: 400 }
            )
        }

        const seedVariety = await prisma.seed_varieties.create({
            data: {
                id: `seed-${Date.now()}`,
                farm_id: farmId,  // 🔒 Enforce farm isolation at creation
                name: body.name,
                scientificName: body.scientificName || '',
                supplier: body.supplier,
                stockQuantity: parseFloat(body.stockQuantity?.toString() || '0'),
                minStockLevel: parseFloat(body.minStockLevel?.toString() || '0'),
                unit: body.unit || 'grams',
                costPerUnit: parseFloat(body.costPerUnit?.toString() || '0'),
                germinationRate: parseFloat(body.germinationRate?.toString() || '0'),
                daysToGermination: parseInt(body.daysToGermination?.toString() || '0'),
                daysToHarvest: parseInt(body.daysToHarvest?.toString() || '0'),
                storageTemp: body.storageTemp ? parseFloat(body.storageTemp.toString()) : 4,
                storageHumidity: body.storageHumidity ? parseFloat(body.storageHumidity.toString()) : 40,
                lightExposure: body.lightExposure || 'DARK',
                lastOrderDate: body.lastOrderDate ? new Date(body.lastOrderDate) : null,
                status: (body.stockQuantity || 0) <= (body.minStockLevel || 0) ? 'LOW' : 'ADEQUATE',
                lotNumber: body.lotNumber || `LOT-${Date.now()}`,
                seedSource: body.seedSource || body.supplier,
                auditTrail: JSON.stringify([{
                    action: 'CREATED',
                    timestamp: new Date().toISOString(),
                    userId: user.id,
                    details: 'Seed variety created'
                }]),
                createdBy: user.id,
                updatedBy: user.id,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            include: {
                users_seed_varieties_createdByTousers: {
                    select: { firstName: true, lastName: true, email: true }
                }
            }
        });

        console.log('✅ SECURE: Created seed variety:', seedVariety.id, 'for farm:', farmId);

        return NextResponse.json({
            success: true,
            data: seedVariety
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString(),
                'X-Farm-ID': farmId
            }
        });

    } catch (error) {
        console.error('❌ Error creating seed variety:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create seed variety'
            },
            { status: 500 }
        );
    }
} 

// PUT /api/seed-varieties - Update seed variety by id in body
export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        const { farmId, user } = await ensureFarmAccess(request)
        const body = await request.json()
        const id = body?.id || new URL(request.url).searchParams.get('id')
        if (!id) {
            return NextResponse.json({ success: false, error: 'Seed variety id is required' }, { status: 400 })
        }

        const existing = await prisma.seed_varieties.findFirst({ where: { id, farm_id: farmId } })
        if (!existing) {
            return NextResponse.json({ success: false, error: 'Seed variety not found' }, { status: 404 })
        }

        const updatableFields = [
            'name', 'scientificName', 'supplier', 'stockQuantity', 'minStockLevel', 'unit',
            'costPerUnit', 'germinationRate', 'daysToGermination', 'daysToHarvest', 'storageTemp',
            'storageHumidity', 'lightExposure', 'lastOrderDate', 'status', 'lotNumber', 'seedSource'
        ] as const

        const data: any = { updatedAt: new Date(), updatedBy: user.id }
        for (const field of updatableFields) {
            if (body[field] !== undefined) data[field] = body[field]
        }
        if (data.stockQuantity !== undefined && data.minStockLevel !== undefined) {
            data.status = (Number(data.stockQuantity) || 0) <= (Number(data.minStockLevel) || 0) ? 'LOW' : 'ADEQUATE'
        }
        if (data.lastOrderDate) data.lastOrderDate = new Date(data.lastOrderDate)

        const updated = await prisma.seed_varieties.update({ where: { id }, data })
        return NextResponse.json({ success: true, data: updated })
    } catch (error) {
        console.error('❌ Error updating seed variety:', error)
        return NextResponse.json({ success: false, error: 'Failed to update seed variety' }, { status: 500 })
    }
}

// DELETE /api/seed-varieties - Delete seed variety by id in body
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const { farmId } = await ensureFarmAccess(request)
        const body = await request.json().catch(() => ({}))
        const id = body?.id || new URL(request.url).searchParams.get('id')
        if (!id) {
            return NextResponse.json({ success: false, error: 'Seed variety id is required' }, { status: 400 })
        }

        const existing = await prisma.seed_varieties.findFirst({ where: { id, farm_id: farmId } })
        if (!existing) {
            return NextResponse.json({ success: false, error: 'Seed variety not found' }, { status: 404 })
        }

        await prisma.seed_varieties.delete({ where: { id } })
        return NextResponse.json({ success: true, message: 'Seed variety deleted' })
    } catch (error) {
        console.error('❌ Error deleting seed variety:', error)
        return NextResponse.json({ success: false, error: 'Failed to delete seed variety' }, { status: 500 })
    }
}