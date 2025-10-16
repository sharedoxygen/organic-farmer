import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET - Get responses for a feedback
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const feedbackId = params.id;
        const farmId = request.headers.get('X-Farm-ID');
        const isGlobalAdmin = request.headers.get('X-Global-Admin') === 'true';

        if (!farmId && !isGlobalAdmin) {
            return NextResponse.json({ error: 'Farm ID required' }, { status: 400 });
        }

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

        const responseHeaders: Record<string, string> = {};
        if (farmId) {
            responseHeaders['X-Farm-ID'] = farmId;
        }
        if (isGlobalAdmin) {
            responseHeaders['X-Global-Admin'] = 'true';
        }

        return NextResponse.json({
            success: true,
            data: responses
        }, {
            headers: responseHeaders
        });

    } catch (error) {
        console.error('❌ Error fetching responses:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// POST - Add response to feedback
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const feedbackId = params.id;
        const farmId = request.headers.get('X-Farm-ID');
        const isGlobalAdmin = request.headers.get('X-Global-Admin') === 'true';

        if (!farmId && !isGlobalAdmin) {
            return NextResponse.json({ error: 'Farm ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            message,
            is_internal = false,
            adminId // TODO: Get from authentication
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

        // TODO: Verify user is admin or owner of feedback
        // For now, allow responses

        // Create response
        const response = await (prisma as any).feedback_responses.create({
            data: {
                feedback_id: feedbackId,
                admin_id: adminId,
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
            adminId,
            isInternal: is_internal,
            messageLength: message.length
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
            message: 'Response added successfully',
            data: response
        }, {
            headers: responseHeaders
        });

    } catch (error) {
        console.error('❌ Error adding response:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
} 