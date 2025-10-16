import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET - Get single feedback with responses
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const feedbackId = params.id;
        const farmId = request.headers.get('X-Farm-ID');
        const isGlobalAdmin = request.headers.get('X-Global-Admin') === 'true';

        if (!farmId && !isGlobalAdmin) {
            return NextResponse.json({ error: 'Farm ID required' }, { status: 400 });
        }

        const whereClause: any = { id: feedbackId };
        if (!isGlobalAdmin) {
            whereClause.farm_id = farmId; // ✅ Essential farm scoping for regular users
        }

        const feedback = await (prisma as any).feedback_submissions.findUnique({
            where: whereClause,
            include: {
                farm: {
                    select: {
                        id: true,
                        farm_name: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                responses: {
                    include: {
                        admin: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    },
                    orderBy: { created_at: 'asc' }
                }
            }
        });

        if (!feedback) {
            return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
        }

        const responseHeaders: Record<string, string> = {};
        if (farmId) {
            responseHeaders['X-Farm-ID'] = farmId;
        }
        if (isGlobalAdmin) {
            responseHeaders['X-Global-Admin'] = 'true';
        }

        return NextResponse.json({
            success: true,
            data: feedback
        }, {
            headers: responseHeaders
        });

    } catch (error) {
        console.error('❌ Error fetching feedback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// PATCH - Update feedback (status, priority, etc.)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const feedbackId = params.id;
        const farmId = request.headers.get('X-Farm-ID');
        const isGlobalAdmin = request.headers.get('X-Global-Admin') === 'true';
        const updates = await request.json();

        if (!farmId && !isGlobalAdmin) {
            return NextResponse.json({ error: 'Farm ID required' }, { status: 400 });
        }

        // TODO: Check if user is admin or owner of feedback
        // For now, allow updates

        const whereClause: any = { id: feedbackId };
        if (!isGlobalAdmin) {
            whereClause.farm_id = farmId; // ✅ Essential farm scoping for regular users
        }

        const feedback = await (prisma as any).feedback_submissions.findUnique({
            where: whereClause
        });

        if (!feedback) {
            return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
        }

        // Validate updates
        const allowedUpdates = ['status', 'priority', 'title', 'description', 'category'];
        const validUpdates = Object.keys(updates).every(key =>
            allowedUpdates.includes(key)
        );

        if (!validUpdates) {
            return NextResponse.json({ error: 'Invalid update fields' }, { status: 400 });
        }

        const updatedFeedback = await (prisma as any).feedback_submissions.update({
            where: whereClause,
            data: updates,
            include: {
                farm: {
                    select: {
                        id: true,
                        farm_name: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        const responseHeaders: Record<string, string> = {};
        if (farmId) {
            responseHeaders['X-Farm-ID'] = farmId;
        }
        if (isGlobalAdmin) {
            responseHeaders['X-Global-Admin'] = 'true';
        }

        return NextResponse.json({
            success: true,
            data: updatedFeedback
        }, {
            headers: responseHeaders
        });

    } catch (error) {
        console.error('❌ Error updating feedback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// DELETE - Delete feedback (admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const feedbackId = params.id;
        const farmId = request.headers.get('X-Farm-ID');
        const isGlobalAdmin = request.headers.get('X-Global-Admin') === 'true';

        if (!farmId && !isGlobalAdmin) {
            return NextResponse.json({ error: 'Farm ID required' }, { status: 400 });
        }

        // TODO: Check if user is admin
        // For now, allow deletion

        const whereClause: any = { id: feedbackId };
        if (!isGlobalAdmin) {
            whereClause.farm_id = farmId; // ✅ Essential farm scoping for regular users
        }

        const feedback = await (prisma as any).feedback_submissions.findUnique({
            where: whereClause
        });

        if (!feedback) {
            return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
        }

        // Delete feedback (cascade will handle responses)
        await (prisma as any).feedback_submissions.delete({
            where: whereClause
        });

        const responseHeaders: Record<string, string> = {};
        if (farmId) {
            responseHeaders['X-Farm-ID'] = farmId;
        }
        if (isGlobalAdmin) {
            responseHeaders['X-Global-Admin'] = 'true';
        }

        return NextResponse.json({
            success: true,
            message: 'Feedback deleted successfully'
        }, {
            headers: responseHeaders
        });

    } catch (error) {
        console.error('❌ Error deleting feedback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
} 