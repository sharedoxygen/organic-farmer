import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import DataIntegrityService from '@/lib/services/dataIntegrityService';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// GET /api/batches - List all batches with relationships
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || '';
    const seedVarietyId = searchParams.get('seedVarietyId') || '';

    // Enforce farm scoping and auth
    const { farmId, user } = await ensureFarmAccess(request);

    console.log('📦 Fetching batches for farm:', farmId);

    const skip = (page - 1) * limit;

    // Build where clause with farm filter
    const where: Record<string, unknown> = {
      farm_id: farmId
    };

    if (status) {
      where.status = status;
    }

    if (seedVarietyId) {
      where.seedVarietyId = seedVarietyId;
    }

    // Get total count for pagination
    const total = await (prisma as any).batches.count({ where });

    // Get batches with relationships
    const batches = await (prisma as any).batches.findMany({
      where,
      skip,
      take: limit,
      include: {
        seed_varieties: {
          select: {
            name: true,
            scientificName: true,
            daysToHarvest: true
          }
        },
        users_batches_createdByTousers: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${batches.length} batches for farm ${farmId}`);

    return NextResponse.json({
      success: true,
      data: batches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch batches',
        data: []
      },
      { status: 500 }
    );
  }
}

// POST /api/batches - Create new batch
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Enforce farm scoping and auth
    const { farmId } = await ensureFarmAccess(request);

    console.log('📦 Creating batch for farm:', farmId);

    // Validate required fields
    if (!body.batchNumber || !body.seedVarietyId || !body.plantDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: batchNumber, seedVarietyId, plantDate'
        },
        { status: 400 }
      );
    }

    // Check if batch number already exists in this farm
    const existingBatch = await (prisma as any).batches.findFirst({
      where: {
        batchNumber: body.batchNumber,
        farm_id: farmId
      }
    });

    if (existingBatch) {
      return NextResponse.json(
        {
          success: false,
          error: 'Batch number already exists in this farm'
        },
        { status: 409 }
      );
    }

    // Integrity checks
    const integrity = DataIntegrityService.validateBatchData({
      seedWeight: body.seedWeight,
      traysUsed: body.traysUsed,
      plantingDate: body.plantDate,
      expectedHarvestDate: body.expectedHarvestDate,
      actualHarvestDate: body.actualHarvestDate,
      expectedYield: body.expectedYield,
      actualYield: body.actualYield,
      yieldEfficiency: body.yieldEfficiency,
      humidity: body.humidity,
      lightHours: body.lightHours
    });
    if (!integrity.valid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', violations: integrity.violations },
        { status: 422 }
      );
    }

    const batch = await (prisma as any).batches.create({
      data: {
        id: `batch-${Date.now()}`,
        farm_id: farmId,
        batchNumber: body.batchNumber,
        seedVarietyId: body.seedVarietyId,
        plantDate: new Date(body.plantDate),
        expectedHarvestDate: new Date(body.expectedHarvestDate || body.plantDate),
        quantity: parseFloat(body.quantity || '0'),
        unit: body.unit || 'trays',
        status: body.status || 'PLANTED',
        organicCompliant: body.organicCompliant || true,
        growingMedium: body.growingMedium || 'Organic growing medium',
        notes: body.notes || '',
        growingZone: body.growingZone || 'Zone A',
        fertilizersUsed: body.fertilizersUsed || 'None - Organic medium only',
        pestControlMethods: body.pestControlMethods || 'Preventive measures only',
        irrigationSource: body.irrigationSource || 'Filtered water',
        harvestContainers: body.harvestContainers || 'Food-grade containers',
        storageConditions: body.storageConditions || 'Cool, dry storage',
        transportationMethod: body.transportationMethod || 'Refrigerated transport',
        createdBy: user.id,
        updatedBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        seed_varieties: {
          select: {
            name: true,
            scientificName: true,
            daysToHarvest: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: batch
    });

  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create batch'
      },
      { status: 500 }
    );
  }
}
