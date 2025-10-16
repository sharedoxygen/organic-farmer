import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimiter } from '@/lib/rate-limiter';
import { feedbackSchema } from '@/lib/validation/feedbackSchema';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// GET - Fetch feedback based on user role and farm
export async function GET(request: NextRequest) {
    try {
        // Debug: Log all incoming headers and query params
        const farmId = request.headers.get('X-Farm-ID');
        const authHeader = request.headers.get('Authorization');
        const isGlobalAdmin = request.headers.get('X-Global-Admin') === 'true';
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const myFeedback = searchParams.get('my') === 'true';
        const userId = searchParams.get('userId');
        const targetFarmId = searchParams.get('farmId');

        console.log('[OFMS FEEDBACK API] Incoming GET /api/feedback');
        console.log('  X-Farm-ID:', farmId);
        console.log('  Authorization:', authHeader);
        console.log('  X-Global-Admin:', isGlobalAdmin);
        console.log('  Query:', { page, limit, type, status, priority, myFeedback, userId, targetFarmId });

        // Only allow farm-less (all-farm) access if isGlobalAdmin is true
        if (!farmId && !isGlobalAdmin) {
            return NextResponse.json({ error: 'Farm ID required' }, { status: 400 });
        }

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

        // Extract user ID from Authorization header if present
        let authUserId: string | null = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            authUserId = authHeader.replace('Bearer ', '');
        }

        // If not admin or specifically requesting own feedback, filter by user
        if (!isGlobalAdmin || myFeedback) {
            // Use authenticated user ID if 'my=true' and no userId param
            if (myFeedback) {
                if (!authUserId) {
                    return NextResponse.json({ error: 'Authentication required for my feedback' }, { status: 401 });
                }
                where.user_id = authUserId;
            } else if (userId) {
                where.user_id = userId;
            }
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
        console.log('  Prisma where clause:', JSON.stringify(where));

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

        const responseHeaders: Record<string, string> = {};
        if (farmId) {
            responseHeaders['X-Farm-ID'] = farmId;
        }
        if (isGlobalAdmin) {
            responseHeaders['X-Global-Admin'] = 'true';
        }

        return NextResponse.json({
            success: true,
            data: feedback,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }, {
            headers: responseHeaders
        });

    } catch (error) {
        console.error('[OFMS FEEDBACK API] ❌ Error fetching feedback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
            userId // TODO: Get from authentication
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

        // TODO: Verify user has access to this farm
        // For now, we'll trust the userId parameter

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

    } catch (error) {
        console.error('❌ Error submitting feedback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}