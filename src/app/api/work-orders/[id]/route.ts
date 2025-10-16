import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// GET /api/work-orders/[id] - Get individual work order
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        const workOrder = await (prisma as any).work_orders.findFirst({
            where: {
                id: params.id,
                farm_id: farmId
            },
            include: {
                batches: {
                    select: {
                        id: true,
                        batchNumber: true,
                        seed_varieties: {
                            select: { name: true }
                        }
                    }
                },
                users_work_orders_assignedToTousers: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                users_work_orders_createdByTousers: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                zones: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
                },
                equipment: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
                }
            }
        });

        if (!workOrder) {
            return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
        }

        return NextResponse.json(workOrder, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching work order:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/work-orders/[id] - Update work order
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { farmId, user } = await ensureFarmAccess(request);

        const body = await request.json();

        // Check if work order exists and belongs to farm
        const existingWorkOrder = await (prisma as any).work_orders.findFirst({
            where: {
                id: params.id,
                farm_id: farmId
            }
        });

        if (!existingWorkOrder) {
            return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
        }

        // Build update data
        const updateData: any = {
            updatedAt: new Date(),
            updatedBy: user.id
        };

        // Only update fields that are provided
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.type !== undefined) updateData.type = body.type;
        if (body.priority !== undefined) updateData.priority = body.priority;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
        if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate);
        if (body.estimatedHours !== undefined) updateData.estimatedHours = body.estimatedHours;
        if (body.actualHours !== undefined) updateData.actualHours = body.actualHours;
        if (body.batchId !== undefined) updateData.batchId = body.batchId;
        if (body.zoneId !== undefined) updateData.zoneId = body.zoneId;
        if (body.equipmentId !== undefined) updateData.equipmentId = body.equipmentId;
        if (body.instructions !== undefined) updateData.instructions = body.instructions;
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.materialsCost !== undefined) updateData.materialsCost = body.materialsCost;
        if (body.laborCost !== undefined) updateData.laborCost = body.laborCost;
        if (body.totalCost !== undefined) updateData.totalCost = body.totalCost;

        // If status is being set to COMPLETED, set completedAt
        if (body.status === 'COMPLETED' && existingWorkOrder.status !== 'COMPLETED') {
            updateData.completedAt = new Date();
        }

        // If status is being changed from COMPLETED, clear completedAt
        if (body.status !== 'COMPLETED' && existingWorkOrder.status === 'COMPLETED') {
            updateData.completedAt = null;
        }

        const updatedWorkOrder = await (prisma as any).work_orders.update({
            where: { id: params.id },
            data: updateData,
            include: {
                batches: {
                    select: {
                        id: true,
                        batchNumber: true,
                        seed_varieties: {
                            select: { name: true }
                        }
                    }
                },
                users_work_orders_assignedToTousers: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                zones: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
                },
                equipment: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
                }
            }
        });

        return NextResponse.json(updatedWorkOrder, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error updating work order:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/work-orders/[id] - Delete work order
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        // Check if work order exists and belongs to farm
        const existingWorkOrder = await (prisma as any).work_orders.findFirst({
            where: {
                id: params.id,
                farm_id: farmId
            }
        });

        if (!existingWorkOrder) {
            return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
        }

        // Delete the work order
        await (prisma as any).work_orders.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ message: 'Work order deleted successfully' }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error deleting work order:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 