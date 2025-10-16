import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/farms/[farmId]/stats - Get farm statistics
export async function GET(
    request: NextRequest,
    { params }: { params: { farmId: string } }
) {
    try {
        const farmId = params.farmId;

        if (!farmId) {
            return NextResponse.json(
                { error: 'Farm ID is required' },
                { status: 400 }
            );
        }

        console.log('📊 Fetching farm statistics for:', farmId);

        // Get user statistics
        const userStats = await (prisma as any).farm_users.aggregate({
            where: {
                farm_id: farmId
            },
            _count: {
                user_id: true
            }
        });

        const activeUserStats = await (prisma as any).farm_users.aggregate({
            where: {
                farm_id: farmId,
                is_active: true
            },
            _count: {
                user_id: true
            }
        });

        // Get batch statistics
        const batchStats = await (prisma as any).batches.aggregate({
            where: {
                farm_id: farmId
            },
            _count: {
                id: true
            }
        });

        const activeBatchStats = await (prisma as any).batches.aggregate({
            where: {
                farm_id: farmId,
                status: 'active'
            },
            _count: {
                id: true
            }
        });

        // Get order statistics
        const orderStats = await (prisma as any).orders.aggregate({
            where: {
                farm_id: farmId
            },
            _count: {
                id: true
            },
            _sum: {
                total_amount: true
            }
        });

        // Get latest activity (most recent batch or order)
        const latestBatch = await (prisma as any).batches.findFirst({
            where: {
                farm_id: farmId
            },
            orderBy: {
                created_at: 'desc'
            },
            select: {
                created_at: true
            }
        });

        const latestOrder = await (prisma as any).orders.findFirst({
            where: {
                farm_id: farmId
            },
            orderBy: {
                created_at: 'desc'
            },
            select: {
                created_at: true
            }
        });

        // Determine the most recent activity
        let lastActivity = null;
        if (latestBatch && latestOrder) {
            lastActivity = latestBatch.created_at > latestOrder.created_at ?
                latestBatch.created_at : latestOrder.created_at;
        } else if (latestBatch) {
            lastActivity = latestBatch.created_at;
        } else if (latestOrder) {
            lastActivity = latestOrder.created_at;
        }

        const stats = {
            totalUsers: userStats._count.user_id || 0,
            activeUsers: activeUserStats._count.user_id || 0,
            totalBatches: batchStats._count.id || 0,
            activeBatches: activeBatchStats._count.id || 0,
            totalOrders: orderStats._count.id || 0,
            totalRevenue: orderStats._sum.total_amount || 0,
            lastActivity: lastActivity ? lastActivity.toISOString() : null
        };

        console.log('✅ Farm statistics retrieved:', stats);

        return NextResponse.json({
            success: true,
            stats: stats
        });

    } catch (error) {
        console.error('❌ Error fetching farm statistics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch farm statistics', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
} 