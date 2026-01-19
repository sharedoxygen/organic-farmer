import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess, HttpError } from '@/lib/middleware/requestGuards';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// PUT /api/batches/[id] - Update batch
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    try {
        const body = await request.json();
        const batchId = params.id;

        const { farmId, user } = await ensureFarmAccess(request);

        console.log('📦 Updating batch:', batchId, 'for farm:', farmId);

        // Check if batch exists and belongs to the farm
        const existingBatch = await (prisma as any).batches.findFirst({
            where: {
                id: batchId,
                farm_id: farmId
            }
        });

        if (!existingBatch) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Batch not found or does not belong to this farm'
                },
                { status: 404 }
            );
        }

        // Build update data
        const updateData: any = {
            updatedAt: new Date(),
            updatedBy: user.id
        };

        // Only update fields that are provided
        if (body.status !== undefined) updateData.status = body.status;
        if (body.seedVariety !== undefined) {
            // Find seed variety by name if it's not an ID
            if (!body.seedVariety.includes('-')) {
                const seedVariety = await (prisma as any).seed_varieties.findFirst({
                    where: {
                        name: body.seedVariety,
                        farm_id: farmId
                    }
                });
                if (seedVariety) {
                    updateData.seedVarietyId = seedVariety.id;
                }
            }
        }
        if (body.quantity !== undefined) updateData.quantity = parseFloat(body.quantity);
        if (body.unit !== undefined) updateData.unit = body.unit;
        if (body.plantDate !== undefined) updateData.plantDate = new Date(body.plantDate);
        if (body.expectedHarvestDate !== undefined) updateData.expectedHarvestDate = new Date(body.expectedHarvestDate);
        if (body.actualHarvestDate !== undefined) updateData.actualHarvestDate = body.actualHarvestDate ? new Date(body.actualHarvestDate) : null;
        if (body.zone !== undefined) updateData.growingZone = body.zone;
        if (body.qualityGrade !== undefined) updateData.qualityGrade = body.qualityGrade || null;
        if (body.yieldAmount !== undefined) updateData.yieldAmount = body.yieldAmount ? parseFloat(body.yieldAmount) : null;
        if (body.notes !== undefined) updateData.notes = body.notes;

        // Update the batch
        const updatedBatch = await (prisma as any).batches.update({
            where: { id: batchId },
            data: updateData,
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
            }
        });

        console.log('✅ Batch updated successfully:', batchId);

        return NextResponse.json({
            success: true,
            data: updatedBatch
        });

    } catch (error: any) {
        console.error('Error updating batch:', error);
        if (error instanceof HttpError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.status }
            );
        }
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to update batch'
            },
            { status: 500 }
        );
    }
}

// DELETE /api/batches/[id] - Delete batch
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    try {
        const batchId = params.id;

        const { farmId } = await ensureFarmAccess(request);

        console.log('🗑️ Deleting batch:', batchId, 'for farm:', farmId);

        // Check if batch exists and belongs to the farm
        const existingBatch = await (prisma as any).batches.findFirst({
            where: {
                id: batchId,
                farm_id: farmId
            }
        });

        if (!existingBatch) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Batch not found or does not belong to this farm'
                },
                { status: 404 }
            );
        }

        // Delete the batch
        await (prisma as any).batches.delete({
            where: { id: batchId }
        });

        console.log('✅ Batch deleted successfully:', batchId);

        return NextResponse.json({
            success: true,
            message: 'Batch deleted successfully'
        });

    } catch (error: any) {
        console.error('Error deleting batch:', error);
        if (error instanceof HttpError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.status }
            );
        }
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to delete batch'
            },
            { status: 500 }
        );
    }
}