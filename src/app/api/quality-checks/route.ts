import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// Interfaces removed to fix lint errors - using inline types instead

// GET /api/quality-checks - List all quality checks with relationships
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const status = searchParams.get('status') || '';
        const batchId = searchParams.get('batchId') || '';
        const checkType = searchParams.get('checkType') || '';

        // Enforce auth + farm access
        const { farmId } = await ensureFarmAccess(request);

        console.log('📋 Fetching quality checks for farm:', farmId);

        const skip = (page - 1) * limit;

        // Build where clause with farm filter
        const where: Record<string, unknown> = {
            farm_id: farmId
        };

        if (status) {
            where.status = status;
        }

        if (batchId) {
            where.batchId = batchId;
        }

        if (checkType) {
            where.checkType = checkType;
        }

        // Get total count for pagination
        const total = await (prisma as any).quality_checks.count({ where });

        // Get quality checks with relationships
        const qualityChecks = await (prisma as any).quality_checks.findMany({
            where,
            skip,
            take: limit,
            include: {
                batches: {
                    select: {
                        id: true,
                        batchNumber: true,
                        seed_varieties: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                users: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            orderBy: { checkDate: 'desc' }
        });

        console.log(`✅ Found ${qualityChecks.length} quality checks for farm ${farmId}`);

        return NextResponse.json({
            success: true,
            data: qualityChecks,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching quality checks:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch quality checks',
                data: []
            },
            { status: 500 }
        );
    }
}

// POST /api/quality-checks - Create new quality check
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();

        // Enforce auth + farm access
        const { farmId, user } = await ensureFarmAccess(request);

        console.log('📋 Creating quality check for farm:', farmId);

        // Validate required fields
        if (!body.batchId || !body.checkType || !body.checkDate) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: batchId, checkType, checkDate'
                },
                { status: 400 }
            );
        }

        // Verify batch exists and belongs to the farm
        const batch = await (prisma as any).batches.findFirst({
            where: {
                id: body.batchId,
                farm_id: farmId
            }
        });

        if (!batch) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid batch ID or batch does not belong to this farm'
                },
                { status: 400 }
            );
        }

        const userId = user.id;

        // Create quality check
        const qualityCheck = await (prisma as any).quality_checks.create({
            data: {
                id: `qc-${Date.now()}`,
                farm_id: farmId,
                batchId: body.batchId,
                checkType: body.checkType,
                checkDate: new Date(body.checkDate),
                status: body.status || 'PENDING',
                ph: body.ph ? parseFloat(body.ph) : null,
                ecLevel: body.ecLevel ? parseFloat(body.ecLevel) : null,
                pestsDetected: body.pestsDetected || false,
                diseaseDetected: body.diseaseDetected || false,
                uniformityScore: body.uniformityScore ? parseInt(body.uniformityScore) : null,
                colorScore: body.colorScore ? parseInt(body.colorScore) : null,
                sizeScore: body.sizeScore ? parseInt(body.sizeScore) : null,
                weightPerTray: body.weightPerTray ? parseFloat(body.weightPerTray) : null,
                notes: body.notes || '',
                checkedBy: userId,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            include: {
                batches: {
                    select: {
                        id: true,
                        batchNumber: true,
                        seed_varieties: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                users: {
                    select: {
                        firstName: true,
                        lastName: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: qualityCheck
        });

    } catch (error) {
        console.error('Error creating quality check:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create quality check'
            },
            { status: 500 }
        );
    }
}

// PATCH /api/quality-checks - Update quality check
export async function PATCH(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Quality check ID is required'
                },
                { status: 400 }
            );
        }

        // Check if quality check exists
        const existingCheck = await prisma.quality_checks.findUnique({
            where: { id }
        });

        if (!existingCheck) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Quality check not found'
                },
                { status: 404 }
            );
        }

        // Update quality check
        const updatedCheck = await prisma.quality_checks.update({
            where: { id },
            data: {
                ...updateData,
                updatedAt: new Date()
            },
            include: {
                batches: {
                    select: {
                        batchNumber: true,
                        seed_varieties: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                users: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: updatedCheck
        });

    } catch (error) {
        console.error('Error updating quality check:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to update quality check'
            },
            { status: 500 }
        );
    }
} 