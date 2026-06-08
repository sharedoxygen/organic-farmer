import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/middleware/requestGuards';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';

export const dynamic = 'force-dynamic';

// GET /api/farms/[farmId]/stats - Get farm statistics
export async function GET(
    request: NextRequest,
    { params }: { params: { farmId: string } }
) {
    try {
        const farmId = params.farmId;
        const user = await getAuthUser(request);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!farmId) {
            return NextResponse.json({ error: 'Farm ID is required' }, { status: 400 });
        }

        if (!isSystemAdmin(user)) {
            const membership = await prisma.farm_users.findFirst({
                where: {
                    farm_id: farmId,
                    user_id: user.id,
                    is_active: true,
                },
            });

            if (!membership) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        const [userStats, activeUserStats, batchStats, activeBatchStats, orderStats, latestBatch, latestOrder] =
            await Promise.all([
                prisma.farm_users.aggregate({
                    where: { farm_id: farmId },
                    _count: { user_id: true },
                }),
                prisma.farm_users.aggregate({
                    where: { farm_id: farmId, is_active: true },
                    _count: { user_id: true },
                }),
                prisma.batches.aggregate({
                    where: { farm_id: farmId },
                    _count: { id: true },
                }),
                prisma.batches.aggregate({
                    where: { farm_id: farmId, status: 'active' },
                    _count: { id: true },
                }),
                prisma.orders.aggregate({
                    where: { farm_id: farmId },
                    _count: { id: true },
                    _sum: { total: true },
                }),
                prisma.batches.findFirst({
                    where: { farm_id: farmId },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true },
                }),
                prisma.orders.findFirst({
                    where: { farm_id: farmId },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true },
                }),
            ]);

        let lastActivity: Date | null = null;
        if (latestBatch && latestOrder) {
            lastActivity =
                latestBatch.createdAt > latestOrder.createdAt
                    ? latestBatch.createdAt
                    : latestOrder.createdAt;
        } else if (latestBatch) {
            lastActivity = latestBatch.createdAt;
        } else if (latestOrder) {
            lastActivity = latestOrder.createdAt;
        }

        const stats = {
            totalUsers: userStats._count.user_id || 0,
            activeUsers: activeUserStats._count.user_id || 0,
            totalBatches: batchStats._count.id || 0,
            activeBatches: activeBatchStats._count.id || 0,
            totalOrders: orderStats._count?.id || 0,
            totalRevenue: orderStats._sum?.total || 0,
            lastActivity: lastActivity ? lastActivity.toISOString() : null,
        };

        return NextResponse.json({ success: true, stats });
    } catch (error) {
        console.error('Error fetching farm statistics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch farm statistics' },
            { status: 500 }
        );
    }
}
