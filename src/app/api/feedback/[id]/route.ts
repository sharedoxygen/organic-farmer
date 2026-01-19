import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/middleware/requestGuards';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

async function requireFarmAdmin(userId: string, farmId: string): Promise<boolean> {
    const membership = await (prisma as any).farm_users.findUnique({
        where: {
            farm_id_user_id: {
                farm_id: farmId,
                user_id: userId,
            },
        },
        select: { is_active: true, role: true },
    });
    return !!membership?.is_active && ['OWNER', 'ADMIN'].includes(membership.role);
}

// GET - Get single feedback with responses
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const feedbackId = params.id;
        const farmId = request.headers.get('X-Farm-ID');
        if (!farmId) return NextResponse.json({ error: 'Farm ID required' }, { status: 400 });

        const user = await getAuthUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const isGlobalAdmin = isSystemAdmin(user as any);

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

        return NextResponse.json({
            success: true,
            data: feedback
        });

    } catch (error) {
        console.error('❌ Error fetching feedback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH - Update feedback (status, priority, etc.)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const feedbackId = params.id;
        const farmId = request.headers.get('X-Farm-ID');
        if (!farmId) return NextResponse.json({ error: 'Farm ID required' }, { status: 400 });

        const user = await getAuthUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const isGlobalAdmin = isSystemAdmin(user as any);
        const updates = await request.json();

        if (!isGlobalAdmin) {
            const ok = await requireFarmAdmin(user.id, farmId);
            if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

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

        return NextResponse.json({
            success: true,
            data: updatedFeedback
        });

    } catch (error) {
        console.error('❌ Error updating feedback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Delete feedback (admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const feedbackId = params.id;
        const farmId = request.headers.get('X-Farm-ID');
        if (!farmId) return NextResponse.json({ error: 'Farm ID required' }, { status: 400 });

        const user = await getAuthUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const isGlobalAdmin = isSystemAdmin(user as any);
        if (!isGlobalAdmin) {
            const ok = await requireFarmAdmin(user.id, farmId);
            if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

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

        return NextResponse.json({
            success: true,
            message: 'Feedback deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting feedback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}