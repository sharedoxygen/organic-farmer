import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// GET /api/assignments - List all team assignments with pagination and filtering
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const status = searchParams.get('status') || '';
        const priority = searchParams.get('priority') || '';
        const assignedTo = searchParams.get('assignedTo') || '';
        const teamLead = searchParams.get('teamLead') || '';
        const startDateFrom = searchParams.get('startDateFrom') || '';
        const startDateTo = searchParams.get('startDateTo') || '';
        const endDateFrom = searchParams.get('endDateFrom') || '';
        const endDateTo = searchParams.get('endDateTo') || '';

        // Enforce auth + farm access
        const { farmId } = await ensureFarmAccess(request);

        console.log('👥 Fetching team assignments for farm:', farmId);

        const skip = (page - 1) * limit;

        // Build where clause with farm filter
        const where: Record<string, unknown> = {
            farm_id: farmId
        };

        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assignedTo) where.assignedTo = assignedTo;
        if (teamLead) where.teamLead = teamLead;
        if (startDateFrom && startDateTo) {
            where.startDate = {
                gte: new Date(startDateFrom),
                lte: new Date(startDateTo)
            };
        } else if (startDateFrom) {
            where.startDate = { gte: new Date(startDateFrom) };
        } else if (startDateTo) {
            where.startDate = { lte: new Date(startDateTo) };
        }

        // Get total count for pagination
        const total = await (prisma as any).assignments.count({ where });

        // Get assignments with relationships
        const assignments = await (prisma as any).assignments.findMany({
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
                users_assignments_assignedToTousers: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        roles: true
                    }
                },
                users_assignments_teamLeadTousers: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                users_assignments_createdByTousers: {
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
                }
            },
            orderBy: [
                { priority: 'desc' },
                { startDate: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        console.log(`✅ Found ${assignments.length} team assignments for farm ${farmId}`);

        return NextResponse.json({
            success: true,
            data: assignments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('❌ Error fetching team assignments:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch team assignments' },
            { status: 500 }
        );
    }
}

// POST /api/assignments - Create new team assignment
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();

        // Get farm ID from headers
        const farmId = request.headers.get('X-Farm-ID');

        if (!farmId) {
            return NextResponse.json(
                { success: false, error: 'Farm ID required' },
                { status: 400 }
            );
        }

        console.log('👥 Creating team assignment for farm:', farmId);

        // Validate required fields
        if (!body.title || !body.assignedTo || !body.teamLead || !body.startDate || !body.endDate) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: title, assignedTo, teamLead, startDate, endDate'
                },
                { status: 400 }
            );
        }

        // Verify assignedTo users belong to the farm
        const assignedToArray = Array.isArray(body.assignedTo) ? body.assignedTo : [body.assignedTo];
        for (const userId of assignedToArray) {
            const user = await (prisma as any).users.findFirst({
                where: {
                    id: userId,
                    farm_users: {
                        some: {
                            farm_id: farmId,
                            is_active: true
                        }
                    }
                }
            });

            if (!user) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Invalid assignedTo user ID ${userId} or user does not belong to this farm`
                    },
                    { status: 400 }
                );
            }
        }

        // Verify team lead belongs to the farm
        const teamLead = await (prisma as any).users.findFirst({
            where: {
                id: body.teamLead,
                farm_users: {
                    some: {
                        farm_id: farmId,
                        is_active: true
                    }
                }
            }
        });

        if (!teamLead) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid team lead user ID or user does not belong to this farm'
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

        const userId = user.id;

        const assignment = await (prisma as any).assignments.create({
            data: {
                id: `assignment-${Date.now()}`,
                farm_id: farmId,
                title: body.title,
                description: body.description || '',
                assignedTo: assignedToArray,
                teamLead: body.teamLead,
                priority: body.priority || 'medium',
                status: body.status || 'planned',
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                estimatedHours: body.estimatedHours || 8,
                actualHours: null,
                progress: 0,
                category: body.category || 'general',
                location: body.location || 'Farm',
                batchId: body.batchId || null,
                zoneId: body.zoneId || null,
                notes: body.notes || '',
                isRecurring: body.isRecurring || false,
                recurringPattern: body.recurringPattern || null,
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
                users_assignments_assignedToTousers: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        roles: true
                    }
                },
                users_assignments_teamLeadTousers: {
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
                }
            }
        });

        console.log('✅ SECURE: Created team assignment:', assignment.id, 'for farm:', farmId);

        return NextResponse.json({
            success: true,
            data: assignment
        });

    } catch (error) {
        console.error('❌ Error creating team assignment:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create team assignment' },
            { status: 500 }
        );
    }
}

// PUT /api/assignments - Update team assignment
export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();

        // Enforce auth + farm access
        const { farmId, user } = await ensureFarmAccess(request);

        if (!body.id) {
            return NextResponse.json(
                { success: false, error: 'Assignment ID required' },
                { status: 400 }
            );
        }

        console.log('👥 Updating team assignment:', body.id, 'for farm:', farmId);

        // Check if assignment exists and belongs to the farm
        const existingAssignment = await (prisma as any).assignments.findFirst({
            where: {
                id: body.id,
                farm_id: farmId
            }
        });

        if (!existingAssignment) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Assignment not found or does not belong to this farm'
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
        if (body.assignedTo !== undefined) updateData.assignedTo = Array.isArray(body.assignedTo) ? body.assignedTo : [body.assignedTo];
        if (body.teamLead !== undefined) updateData.teamLead = body.teamLead;
        if (body.priority !== undefined) updateData.priority = body.priority;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
        if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);
        if (body.estimatedHours !== undefined) updateData.estimatedHours = body.estimatedHours;
        if (body.actualHours !== undefined) updateData.actualHours = body.actualHours;
        if (body.progress !== undefined) updateData.progress = body.progress;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.location !== undefined) updateData.location = body.location;
        if (body.batchId !== undefined) updateData.batchId = body.batchId;
        if (body.zoneId !== undefined) updateData.zoneId = body.zoneId;
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.isRecurring !== undefined) updateData.isRecurring = body.isRecurring;
        if (body.recurringPattern !== undefined) updateData.recurringPattern = body.recurringPattern;

        // If status is being set to COMPLETED, set completedAt
        if (body.status === 'completed' && existingAssignment.status !== 'completed') {
            updateData.completedAt = new Date();
            updateData.progress = 100;
        }

        // If status is being changed from COMPLETED, clear completedAt
        if (body.status !== 'completed' && existingAssignment.status === 'completed') {
            updateData.completedAt = null;
        }

        const updatedAssignment = await (prisma as any).assignments.update({
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
                users_assignments_assignedToTousers: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        roles: true
                    }
                },
                users_assignments_teamLeadTousers: {
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
                }
            }
        });

        console.log('✅ SECURE: Updated team assignment:', updatedAssignment.id, 'for farm:', farmId);

        return NextResponse.json({
            success: true,
            data: updatedAssignment
        });

    } catch (error) {
        console.error('❌ Error updating team assignment:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update team assignment' },
            { status: 500 }
        );
    }
}

// DELETE /api/assignments - Delete team assignment
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const assignmentId = searchParams.get('id');

        // Get farm ID from headers
        const farmId = request.headers.get('X-Farm-ID');

        if (!farmId) {
            return NextResponse.json(
                { success: false, error: 'Farm ID required' },
                { status: 400 }
            );
        }

        if (!assignmentId) {
            return NextResponse.json(
                { success: false, error: 'Assignment ID required' },
                { status: 400 }
            );
        }

        console.log('👥 Deleting team assignment:', assignmentId, 'for farm:', farmId);

        // Check if assignment exists and belongs to the farm
        const existingAssignment = await (prisma as any).assignments.findFirst({
            where: {
                id: assignmentId,
                farm_id: farmId
            }
        });

        if (!existingAssignment) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Assignment not found or does not belong to this farm'
                },
                { status: 404 }
            );
        }

        // Delete the assignment
        await (prisma as any).assignments.delete({
            where: { id: assignmentId }
        });

        console.log('✅ SECURE: Deleted team assignment:', assignmentId, 'for farm:', farmId);

        return NextResponse.json({
            success: true,
            message: 'Team assignment deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting team assignment:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete team assignment' },
            { status: 500 }
        );
    }
} 