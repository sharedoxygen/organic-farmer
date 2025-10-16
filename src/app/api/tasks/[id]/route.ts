import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// GET /api/tasks/[id] - Get individual task
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        
        // Handle both async and sync params for Next.js compatibility
        const resolvedParams = params instanceof Promise ? await params : params;
        const taskId = resolvedParams.id;

        console.log('📋 Fetching task details:', taskId, 'for farm:', farmId);

        const task = await (prisma as any).tasks.findFirst({
            where: {
                id: taskId,
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
                users_tasks_assignedToTousers: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                users_tasks_createdByTousers: {
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

        if (!task) {
            console.log('❌ Task not found:', taskId);
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        console.log('✅ Task found:', taskId);
        return NextResponse.json(task, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching task:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/tasks/[id] - Update task
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const { farmId, user } = await ensureFarmAccess(request);
        
        // Handle both async and sync params for Next.js compatibility
        const resolvedParams = params instanceof Promise ? await params : params;
        const taskId = resolvedParams.id;

        const body = await request.json();

        // Check if task exists and belongs to farm
        const existingTask = await (prisma as any).tasks.findFirst({
            where: {
                id: taskId,
                farm_id: farmId
            }
        });

        if (!existingTask) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
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
            where: { id: taskId },
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

        return NextResponse.json(updatedTask, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error updating task:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        
        // Handle both async and sync params for Next.js compatibility
        const resolvedParams = params instanceof Promise ? await params : params;
        const taskId = resolvedParams.id;

        // Check if task exists and belongs to farm
        const existingTask = await (prisma as any).tasks.findFirst({
            where: {
                id: taskId,
                farm_id: farmId
            }
        });

        if (!existingTask) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Delete the task
        await (prisma as any).tasks.delete({
            where: { id: taskId }
        });

        return NextResponse.json({ message: 'Task deleted successfully' }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error deleting task:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 