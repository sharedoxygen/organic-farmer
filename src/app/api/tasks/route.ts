import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// GET /api/tasks - List all tasks with pagination and filtering
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

        console.log('📋 Fetching tasks for farm:', farmId);

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
        const total = await (prisma as any).tasks.count({ where });

        // Get tasks with available relationships
        const tasks = await (prisma as any).tasks.findMany({
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
                users: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
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

        console.log(`✅ Found ${tasks.length} tasks for farm ${farmId}`);

        return NextResponse.json({
            success: true,
            data: tasks,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('❌ Error fetching tasks:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch tasks' },
            { status: 500 }
        );
    }
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();

        // Enforce auth + farm access
        const { farmId, user } = await ensureFarmAccess(request);

        console.log('📋 Creating task for farm:', farmId);

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

        const task = await (prisma as any).tasks.create({
            data: {
                id: `task-${Date.now()}`,
                farm_id: farmId,
                title: body.title,
                description: body.description || '',
                category: body.type || body.category || 'GENERAL',
                priority: body.priority,
                status: body.status || 'PENDING',
                assignedTo: body.assignedTo || userId,
                assignedBy: userId,
                dueDate: new Date(body.dueDate),
                estimatedDuration: Math.round((body.estimatedHours || 1) * 60), // Convert hours to minutes
                actualDuration: null,
                relatedBatchId: body.batchId || null,
                relatedEquipmentId: body.equipmentId || null,
                dependencies: JSON.stringify(body.dependencies || []),
                completionNotes: body.notes || '',
                completedAt: null,
                completedBy: null,
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
                users: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
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

        console.log('✅ SECURE: Created task:', task.id, 'for farm:', farmId);

        return NextResponse.json({
            success: true,
            data: task
        });

    } catch (error) {
        console.error('❌ Error creating task:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create task' },
            { status: 500 }
        );
    }
}

// PUT /api/tasks - Update task
export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();

        // Enforce auth + farm access
        const { farmId, user } = await ensureFarmAccess(request);

        if (!body.id) {
            return NextResponse.json(
                { success: false, error: 'Task ID required' },
                { status: 400 }
            );
        }

        console.log('📋 Updating task:', body.id, 'for farm:', farmId);

        // Check if task exists and belongs to the farm
        const existingTask = await (prisma as any).tasks.findFirst({
            where: {
                id: body.id,
                farm_id: farmId
            }
        });

        if (!existingTask) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Task not found or does not belong to this farm'
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
        if (body.isRecurring !== undefined) updateData.isRecurring = body.isRecurring;
        if (body.recurringPattern !== undefined) updateData.recurringPattern = body.recurringPattern;

        // If status is being set to COMPLETED, set completedAt
        if (body.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
            updateData.completedAt = new Date();
        }

        // If status is being changed from COMPLETED, clear completedAt
        if (body.status !== 'COMPLETED' && existingTask.status === 'COMPLETED') {
            updateData.completedAt = null;
        }

        const updatedTask = await (prisma as any).tasks.update({
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
                users_tasks_assignedToTousers: {
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

        console.log('✅ SECURE: Updated task:', updatedTask.id, 'for farm:', farmId);

        return NextResponse.json({
            success: true,
            data: updatedTask
        });

    } catch (error) {
        console.error('❌ Error updating task:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update task' },
            { status: 500 }
        );
    }
}

// DELETE /api/tasks - Delete task
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const taskId = searchParams.get('id');

        // Enforce auth + farm access
        const { farmId } = await ensureFarmAccess(request);

        if (!taskId) {
            return NextResponse.json(
                { success: false, error: 'Task ID required' },
                { status: 400 }
            );
        }

        console.log('📋 Deleting task:', taskId, 'for farm:', farmId);

        // Check if task exists and belongs to the farm
        const existingTask = await (prisma as any).tasks.findFirst({
            where: {
                id: taskId,
                farm_id: farmId
            }
        });

        if (!existingTask) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Task not found or does not belong to this farm'
                },
                { status: 404 }
            );
        }

        // Delete the task
        await (prisma as any).tasks.delete({
            where: { id: taskId }
        });

        console.log('✅ SECURE: Deleted task:', taskId, 'for farm:', farmId);

        return NextResponse.json({
            success: true,
            message: 'Task deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting task:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete task' },
            { status: 500 }
        );
    }
} 