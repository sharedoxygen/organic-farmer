import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess, getAuthUser, HttpError , errorResponse } from '@/lib/middleware/requestGuards';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';
import { rateLimiter } from '@/lib/rate-limiter';
import { feedbackSchema } from '@/lib/validation/feedbackSchema';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// GET - Fetch feedback based on user role and farm
export async function GET(request: NextRequest) {
    try {
        const ctx = await ensureFarmAccess(request);
        const farmId = ctx.farmId;
        const isGlobalAdmin = ctx.isSystemAdmin;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const myFeedback = searchParams.get('my') === 'true';
        const userId = searchParams.get('userId');
        const targetFarmId = searchParams.get('farmId');

        // Build where clause with farm scoping
        const where: any = {};

        // Global admin can see all farms or filter by specific farm
        if (isGlobalAdmin) {
            if (targetFarmId) {
                where.farm_id = targetFarmId;
            }
            // If no targetFarmId specified, show all farms (no farm_id filter)
        } else {
            // Regular users/admins are scoped to their farm
            where.farm_id = farmId;
        }

        // If not admin or specifically requesting own feedback, filter by user
        if (!isGlobalAdmin || myFeedback) {
            // Use authenticated user ID if 'my=true' and no userId param
            if (myFeedback) {
                where.user_id = ctx.user.id;
            } else if (userId) {
                if (userId !== ctx.user.id) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
                where.user_id = ctx.user.id;
            }
        } else if (userId) {
            // System admin can filter by arbitrary user
            where.user_id = userId;
        }

        // Add filters
        if (type && ['BUG', 'ENHANCEMENT', 'GENERAL', 'SUPPORT', 'BILLING', 'SECURITY'].includes(type)) {
            where.type = type;
        }
        if (status && ['OPEN', 'REVIEW', 'IN_PROGRESS', 'IMPLEMENTED', 'CLOSED', 'ON_HOLD'].includes(status)) {
            where.status = status;
        }
        if (priority && ['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority)) {
            where.priority = priority;
        }
        // Fetch feedback with pagination
        const [feedback, total] = await Promise.all([
            (prisma as any).feedback_submissions.findMany({
                where,
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
                        where: isGlobalAdmin ? {} : { is_internal: false }, // Hide internal notes from users
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
                    },
                    _count: {
                        select: { responses: true }
                    }
                },
                orderBy: [
                    { priority: 'desc' },
                    { created_at: 'desc' }
                ],
                skip: (page - 1) * limit,
                take: limit
            }),
            (prisma as any).feedback_submissions.count({ where })
        ]);

        return NextResponse.json({
            success: true,
            data: feedback,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('[OFMS FEEDBACK API] ❌ Error fetching feedback:', error);
        const status = error instanceof HttpError ? error.status : (error?.status || 500);
        const message = error instanceof HttpError ? error.message : (error?.message || 'Internal server error');
        return NextResponse.json({ error: message }, { status });
    }
}

// POST - Submit new feedback
const limiter = rateLimiter({
    uniqueTokenPerInterval: 5, // 5 requests
    interval: 60000, // 1 minute
});

export async function POST(request: NextRequest) {
    try {
        const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
        const limitResponse = limiter.check(ip);
        if (limitResponse) return limitResponse;
    } catch (error) {
        console.error('Rate limiter error:', error);
        // If the rate limiter fails, we'll proceed without it for now.
    }

    try {
        // 🔒 Require farm ID for multi-tenant isolation (or allow system admin)
        const farmId = request.headers.get('X-Farm-ID');
        const isSystemAdminFeedback = farmId === 'system-admin-feedback';

        if (!farmId) {
            return NextResponse.json({ error: 'Farm ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            title,
            category,
            type,
            description,
            priority = 'NORMAL',
            url,
            userAgent,
            screenshot,
            metadata,
        } = body;

        // Validate payload using Zod schema
        const validation = feedbackSchema.safeParse({
            title,
            category,
            type,
            description,
            priority,
        });
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        // Authenticate and verify access; never trust userId from client
        let userId: string;
        if (isSystemAdminFeedback) {
            const user = await getAuthUser(request);
            if (!user) {
                return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
            }
            if (!isSystemAdmin(user as any)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            userId = user.id;
        } else {
            const ctx = await ensureFarmAccess(request);
            userId = ctx.user.id;
        }

        // Auto-assign priority based on type
        let finalPriority = priority;
        if (type === 'BUG' && priority === 'NORMAL') {
            finalPriority = 'HIGH'; // Bugs are typically higher priority
        }
        if (type === 'SECURITY') {
            finalPriority = 'URGENT'; // Security issues are always urgent
        }

        // Create feedback with farm scoping (handle system admin case)
        const feedback = await (prisma as any).feedback_submissions.create({
            data: {
                farm_id: isSystemAdminFeedback ? null : farmId, // ✅ Handle system admin feedback
                user_id: userId,
                title: title.trim(),
                category: category?.trim() || (isSystemAdminFeedback ? 'System Admin' : undefined),
                type,
                description: description.trim(),
                priority: finalPriority,
                url,
                user_agent: userAgent,
                screenshot,
                metadata
            },
            include: {
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

        // Log feedback submission
        console.log('✅ Feedback submitted:', {
            feedbackId: feedback.id,
            userId: userId,
            farmId: isSystemAdminFeedback ? 'SYSTEM_ADMIN' : farmId,
            type: feedback.type,
            priority: feedback.priority,
            title: feedback.title,
            isSystemAdmin: isSystemAdminFeedback
        });

        return NextResponse.json({
            success: true,
            message: 'Feedback submitted successfully',
            data: {
                id: feedback.id,
                title: feedback.title,
                type: feedback.type,
                status: feedback.status,
                created_at: feedback.created_at
            }
        }, {
            headers: {
                'X-Farm-ID': isSystemAdminFeedback ? 'SYSTEM_ADMIN' : farmId
            }
        });

    } catch (error: any) {
        console.error('Error submitting feedback:', error);
        const status = error instanceof HttpError ? error.status : (error?.status || 500);
        const message = error instanceof HttpError ? error.message : (error?.message || 'Internal server error');
        return NextResponse.json({ error: message }, { status });
    }
}