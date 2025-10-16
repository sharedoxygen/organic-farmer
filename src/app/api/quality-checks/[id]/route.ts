import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// GET /api/quality-checks/[id] - Get single quality check
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    try {
        const checkId = params.id;
        const { farmId } = await ensureFarmAccess(request);

        const check = await (prisma as any).quality_checks.findFirst({
            where: {
                id: checkId,
                farm_id: farmId
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
                        lastName: true
                    }
                }
            }
        });

        if (!check) {
            return NextResponse.json(
                { error: 'Quality check not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: check
        });

    } catch (error) {
        console.error('Error fetching quality check:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quality check' },
            { status: 500 }
        );
    }
}

// PUT /api/quality-checks/[id] - Update quality check
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    try {
        const body = await request.json();
        const checkId = params.id;
        const { farmId } = await ensureFarmAccess(request);

        console.log('📋 Updating quality check:', checkId, 'for farm:', farmId);

        // Check if quality check exists and belongs to the farm
        const existingCheck = await (prisma as any).quality_checks.findFirst({
            where: {
                id: checkId,
                farm_id: farmId
            }
        });

        if (!existingCheck) {
            return NextResponse.json(
                { error: 'Quality check not found or does not belong to this farm' },
                { status: 404 }
            );
        }

        // Build update data
        const updateData: any = {
            updatedAt: new Date()
        };

        // Update fields if provided
        if (body.batchId !== undefined) updateData.batchId = body.batchId;
        if (body.checkType !== undefined) updateData.checkType = body.checkType;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.checkDate !== undefined) updateData.checkDate = new Date(body.checkDate);
        if (body.ph !== undefined) updateData.ph = body.ph;
        if (body.ecLevel !== undefined) updateData.ecLevel = body.ecLevel;
        if (body.pestsDetected !== undefined) updateData.pestsDetected = body.pestsDetected;
        if (body.diseaseDetected !== undefined) updateData.diseaseDetected = body.diseaseDetected;
        if (body.uniformityScore !== undefined) updateData.uniformityScore = body.uniformityScore;
        if (body.colorScore !== undefined) updateData.colorScore = body.colorScore;
        if (body.sizeScore !== undefined) updateData.sizeScore = body.sizeScore;
        if (body.weightPerTray !== undefined) updateData.weightPerTray = body.weightPerTray;
        if (body.notes !== undefined) updateData.notes = body.notes;

        // Update the quality check
        const updatedCheck = await (prisma as any).quality_checks.update({
            where: { id: checkId },
            data: updateData,
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
                        lastName: true
                    }
                }
            }
        });

        console.log('✅ Quality check updated successfully:', checkId);

        return NextResponse.json({
            success: true,
            data: updatedCheck
        });

    } catch (error) {
        console.error('Error updating quality check:', error);
        return NextResponse.json(
            { error: 'Failed to update quality check' },
            { status: 500 }
        );
    }
}

// DELETE /api/quality-checks/[id] - Delete quality check
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    try {
        const checkId = params.id;
        const { farmId } = await ensureFarmAccess(request);

        console.log('🗑️ Deleting quality check:', checkId, 'for farm:', farmId);

        // Check if quality check exists and belongs to the farm
        const existingCheck = await (prisma as any).quality_checks.findFirst({
            where: {
                id: checkId,
                farm_id: farmId
            }
        });

        if (!existingCheck) {
            return NextResponse.json(
                { error: 'Quality check not found or does not belong to this farm' },
                { status: 404 }
            );
        }

        // Delete the quality check
        await (prisma as any).quality_checks.delete({
            where: { id: checkId }
        });

        console.log('✅ Quality check deleted successfully:', checkId);

        return NextResponse.json({
            success: true,
            message: 'Quality check deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting quality check:', error);
        return NextResponse.json(
            { error: 'Failed to delete quality check' },
            { status: 500 }
        );
    }
} 