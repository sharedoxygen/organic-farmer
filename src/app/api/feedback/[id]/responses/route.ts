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

// GET - Get responses for a feedback
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const feedbackId = params.id;
        const farmId = request.headers.get('X-Farm-ID');

        if (!farmId) {
            return NextResponse.json({ error: 'Farm ID required' }, { status: 400 });
        }

        const user = await getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isGlobalAdmin = isSystemAdmin(user as any);

        // First verify the feedback exists and user has access
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

        // Get responses
        const responses = await (prisma as any).feedback_responses.findMany({
            where: {
                feedback_id: feedbackId
            },
            include: {
                admin: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {
                created_at: 'asc'
            }
        });

        return NextResponse.json({
            success: true,
            data: responses
        });

    } catch (error) {
        console.error('❌ Error fetching responses:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Add response to feedback
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const feedbackId = params.id;
        const farmId = request.headers.get('X-Farm-ID');

        if (!farmId) {
            return NextResponse.json({ error: 'Farm ID required' }, { status: 400 });
        }

        const user = await getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isGlobalAdmin = isSystemAdmin(user as any);
        if (!isGlobalAdmin) {
            const ok = await requireFarmAdmin(user.id, farmId);
            if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const {
            message,
            is_internal = false,
        } = body;

        // Validate required fields
        if (!message?.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Verify feedback exists and user has access
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

        // POST restricted to farm admins / system admins above

        // Create response
        const response = await (prisma as any).feedback_responses.create({
            data: {
                feedback_id: feedbackId,
                admin_id: user.id,
                message: message.trim(),
                is_internal
            },
            include: {
                admin: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        // Update feedback status to "In Progress" if it was "Open"
        if (feedback.status === 'OPEN') {
            await (prisma as any).feedback_submissions.update({
                where: { id: feedbackId },
                data: { status: 'IN_PROGRESS' }
            });
        }

        // Log response creation
        console.log('✅ Response added:', {
            responseId: response.id,
            feedbackId,
            adminId: user.id,
            isInternal: is_internal,
            messageLength: message.length
        });

        return NextResponse.json({
            success: true,
            message: 'Response added successfully',
            data: response
        });

    } catch (error) {
        console.error('❌ Error adding response:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}