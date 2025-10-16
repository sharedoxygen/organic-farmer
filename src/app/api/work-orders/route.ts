import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// GET /api/work-orders - List all work orders with pagination and filtering
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const status = searchParams.get('status') || '';
        const priority = searchParams.get('priority') || '';
        const type = searchParams.get('type') || '';
        const assignedTo = searchParams.get('assignedTo') || '';
        const dueDateFrom = searchParams.get('dueDateFrom') || '';
        const dueDateTo = searchParams.get('dueDateTo') || '';

        // Enforce auth + farm access
        const { farmId } = await ensureFarmAccess(request);

        console.log('📋 Fetching work orders for farm:', farmId);

        const skip = (page - 1) * limit;

        // Build where clause with farm filter
        const where: Record<string, unknown> = {
            farm_id: farmId
        };

        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (type) where.type = type;
        if (assignedTo) where.assignedTo = assignedTo;
        if (dueDateFrom && dueDateTo) {
            where.dueDate = {
                gte: new Date(dueDateFrom),
                lte: new Date(dueDateTo)
            };
        } else if (dueDateFrom) {
            where.dueDate = { gte: new Date(dueDateFrom) };
        } else if (dueDateTo) {
            where.dueDate = { lte: new Date(dueDateTo) };
        }

        // Get total count for pagination
        const total = await (prisma as any).work_orders.count({ where });

        // Get work orders with relationships
        const workOrders = await (prisma as any).work_orders.findMany({
            where,
            skip,
            take: limit,
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
            },
            orderBy: [
                { priority: 'desc' },
                { dueDate: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        console.log(`✅ Found ${workOrders.length} work orders for farm ${farmId}`);

        return NextResponse.json({
            success: true,
            data: workOrders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('❌ Error fetching work orders:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch work orders' },
            { status: 500 }
        );
    }
}

// POST /api/work-orders - Create new work order
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();

        // Enforce auth + farm access
        const { farmId, user } = await ensureFarmAccess(request);

        console.log('📋 Creating work order for farm:', farmId);

        // Validate required fields
        if (!body.title || !body.type || !body.priority || !body.dueDate) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: title, type, priority, dueDate'
                },
                { status: 400 }
            );
        }

        // Generate work order number
        const currentYear = new Date().getFullYear();
        const workOrderCount = await (prisma as any).work_orders.count({
            where: {
                farm_id: farmId,
                createdAt: {
                    gte: new Date(`${currentYear}-01-01`),
                    lte: new Date(`${currentYear}-12-31`)
                }
            }
        });
        const workOrderNumber = `WO-${currentYear}-${String(workOrderCount + 1).padStart(4, '0')}`;

        // If batch ID is provided, verify it belongs to the farm
        if (body.batchId) {
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
        }

        // If assignedTo is provided, verify user belongs to the farm
        if (body.assignedTo) {
            const assignedUser = await (prisma as any).users.findFirst({
                where: {
                    id: body.assignedTo,
                    farm_users: {
                        some: {
                            farm_id: farmId,
                            is_active: true
                        }
                    }
                }
            });

            if (!assignedUser) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Invalid assignedTo user ID or user does not belong to this farm'
                    },
                    { status: 400 }
                );
            }
        }

        const userId = user.id;

        const workOrder = await (prisma as any).work_orders.create({
            data: {
                id: `wo-${Date.now()}`,
                farm_id: farmId,
                workOrderNumber: workOrderNumber,
                title: body.title,
                description: body.description || '',
                type: body.type,
                priority: body.priority,
                status: body.status || 'PENDING',
                assignedTo: body.assignedTo || null,
                dueDate: new Date(body.dueDate),
                estimatedHours: body.estimatedHours || 2,
                actualHours: null,
                batchId: body.batchId || null,
                zoneId: body.zoneId || null,
                equipmentId: body.equipmentId || null,
                instructions: body.instructions || '',
                notes: body.notes || '',
                materialsCost: body.materialsCost || 0,
                laborCost: body.laborCost || 0,
                totalCost: body.totalCost || 0,
                completedAt: null,
                createdBy: userId,
                updatedBy: userId,
                createdAt: new Date(),
                updatedAt: new Date()
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

        console.log('✅ SECURE: Created work order:', workOrder.id, 'for farm:', farmId);

        return NextResponse.json({
            success: true,
            data: workOrder
        });

    } catch (error) {
        console.error('❌ Error creating work order:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create work order' },
            { status: 500 }
        );
    }
}

// PUT /api/work-orders - Update work order
export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();

        // Enforce auth + farm access
        const { farmId, user } = await ensureFarmAccess(request);

        if (!body.id) {
            return NextResponse.json(
                { success: false, error: 'Work order ID required' },
                { status: 400 }
            );
        }

        console.log('📋 Updating work order:', body.id, 'for farm:', farmId);

        // Check if work order exists and belongs to the farm
        const existingWorkOrder = await (prisma as any).work_orders.findFirst({
            where: {
                id: body.id,
                farm_id: farmId
            }
        });

        if (!existingWorkOrder) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Work order not found or does not belong to this farm'
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
            where: { id: body.id },
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

        console.log('✅ SECURE: Updated work order:', updatedWorkOrder.id, 'for farm:', farmId);

        return NextResponse.json({
            success: true,
            data: updatedWorkOrder
        });

    } catch (error) {
        console.error('❌ Error updating work order:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update work order' },
            { status: 500 }
        );
    }
}

// DELETE /api/work-orders - Delete work order
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const workOrderId = searchParams.get('id');

        // Enforce auth + farm access
        const { farmId } = await ensureFarmAccess(request);

        if (!workOrderId) {
            return NextResponse.json(
                { success: false, error: 'Work order ID required' },
                { status: 400 }
            );
        }

        console.log('📋 Deleting work order:', workOrderId, 'for farm:', farmId);

        // Check if work order exists and belongs to the farm
        const existingWorkOrder = await (prisma as any).work_orders.findFirst({
            where: {
                id: workOrderId,
                farm_id: farmId
            }
        });

        if (!existingWorkOrder) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Work order not found or does not belong to this farm'
                },
                { status: 404 }
            );
        }

        // Delete the work order
        await (prisma as any).work_orders.delete({
            where: { id: workOrderId }
        });

        console.log('✅ SECURE: Deleted work order:', workOrderId, 'for farm:', farmId);

        return NextResponse.json({
            success: true,
            message: 'Work order deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting work order:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete work order' },
            { status: 500 }
        );
    }
} 