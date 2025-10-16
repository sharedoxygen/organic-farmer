import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import { getActiveBatchStatuses } from '@/lib/utils/batchStatusUtils';

// 🔧 Fix Next.js static generation error
// This route uses request.headers so it must be dynamic
export const dynamic = 'force-dynamic';

interface DashboardData {
    totalBatches: number;
    activeBatches: number;
    readyToHarvest: number;
    totalOrders: number;
    pendingOrders: number;
    totalCustomers: number;
    totalRevenue: number;
    monthlyRevenue: number;
    qualityScore: number;
    completedTasks: number;
    recentBatches: Array<{
        id: string;
        batchNumber: string;
        status: string;
        plantDate: Date;
        seedVariety?: string;
    }>;
    recentOrders: Array<{
        id: string;
        orderNumber: string;
        total: number;
        status: string;
        createdAt: Date;
        customerName?: string;
    }>;
}

export async function GET(request: NextRequest) {
    console.log('📊 Fetching dashboard analytics data...');
    try {
        // Enforce auth + farm access
        const { farmId } = await ensureFarmAccess(request);

        console.log('🏢 Dashboard request for farm:', farmId);

        // ⚡ PERFORMANCE OPTIMIZATION: Use parallel queries instead of serial transaction
        const [
            totalBatches,
            activeBatches,
            readyToHarvest,
            totalOrders,
            pendingOrders,
            totalCustomers,
            orderStats,
            recentBatches,
            recentOrders,
            qualityChecks,
            completedTasks
        ] = await Promise.all([
            // Total batches count for this farm
            (prisma as any).batches.count({
                where: { farm_id: farmId }
            }),

            // Active batches (not harvested/sold/failed) for this farm
            // Include cannabis-specific statuses that should be considered active
            (prisma as any).batches.count({
                where: {
                    farm_id: farmId,
                    status: {
                        in: getActiveBatchStatuses()
                    }
                }
            }),

            // Count ready to harvest batches using proper logic
            (prisma as any).batches.count({
                where: {
                    farm_id: farmId,
                    OR: [
                        { status: 'READY_TO_HARVEST' },
                        {
                            AND: [
                                { expectedHarvestDate: { lte: new Date() } },
                                { actualHarvestDate: null }, // Not yet harvested
                                { status: { not: 'HARVESTED' } }
                            ]
                        }
                    ]
                }
            }),

            // Total orders count for this farm
            (prisma as any).orders.count({
                where: { farm_id: farmId }
            }),

            // Count pending orders for this farm
            (prisma as any).orders.count({
                where: {
                    farm_id: farmId,
                    status: 'PENDING'
                }
            }),

            // Total customers count for this farm
            (prisma as any).customers.count({
                where: { farm_id: farmId }
            }),

            // Revenue calculations for this farm
            (prisma as any).orders.aggregate({
                _sum: { total: true },
                where: {
                    farm_id: farmId,
                    status: {
                        in: ['COMPLETED', 'SHIPPED', 'DELIVERED']
                    }
                }
            }),

            // Recent batches with seed variety info for this farm
            (prisma as any).batches.findMany({
                take: 5,
                where: { farm_id: farmId },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    batchNumber: true,
                    status: true,
                    plantDate: true,
                    seed_varieties: {
                        select: { name: true }
                    }
                }
            }),

            // Recent orders with customer info for this farm
            (prisma as any).orders.findMany({
                take: 5,
                where: { farm_id: farmId },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    orderNumber: true,
                    total: true,
                    status: true,
                    createdAt: true,
                    customers: {
                        select: {
                            name: true,
                            businessName: true
                        }
                    }
                }
            }),

            // Quality checks for score calculation for this farm
            (prisma as any).quality_checks.findMany({
                where: {
                    farm_id: farmId,
                    checkDate: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                    }
                },
                select: {
                    status: true
                }
            }),

            // Completed tasks count for this farm
            (prisma as any).tasks.count({
                where: {
                    farm_id: farmId,
                    status: 'COMPLETED',
                    completedAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                    }
                }
            })
        ]);

        // Calculate monthly revenue (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const monthlyRevenueData = await (prisma as any).orders.aggregate({
            _sum: { total: true },
            where: {
                farm_id: farmId,
                status: {
                    in: ['COMPLETED', 'SHIPPED', 'DELIVERED']
                },
                createdAt: {
                    gte: thirtyDaysAgo
                }
            }
        });

        // Calculate quality score
        const passedChecks = qualityChecks.filter((check: any) => check.status === 'PASSED').length;
        const totalChecks = qualityChecks.length;
        const qualityScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

        const dashboardData: DashboardData = {
            totalBatches,
            activeBatches,
            readyToHarvest,
            totalOrders,
            pendingOrders,
            totalCustomers,
            totalRevenue: orderStats._sum.total || 0,
            monthlyRevenue: monthlyRevenueData._sum.total || 0,
            qualityScore,
            completedTasks,
            recentBatches: recentBatches.map((batch: any) => ({
                id: batch.id,
                batchNumber: batch.batchNumber,
                status: batch.status,
                plantDate: batch.plantDate,
                seedVariety: batch.seed_varieties?.name
            })),
            recentOrders: recentOrders.map((order: any) => ({
                id: order.id,
                orderNumber: order.orderNumber,
                total: order.total,
                status: order.status,
                createdAt: order.createdAt,
                customerName: order.customers?.businessName || order.customers?.name
            }))
        };
        console.log('✅ Successfully fetched dashboard data.');

        const responseData = {
            success: true,
            data: {
                totalBatches: totalBatches || 0,
                activeBatches: activeBatches || 0,
                readyToHarvest: readyToHarvest || 0,
                totalOrders: totalOrders || 0,
                pendingOrders: pendingOrders || 0,
                totalCustomers: totalCustomers || 0,
                totalRevenue: orderStats._sum.total || 0,
                monthlyRevenue: monthlyRevenueData._sum.total || 0,
                qualityScore: qualityScore || 0,
                completedTasks: completedTasks || 0,
                recentBatches: recentBatches || [],
                recentOrders: recentOrders || []
            }
        };

        return NextResponse.json(responseData, {
            headers: {
                // ⚡ PERFORMANCE: Add 30-second cache for dashboard data
                'Cache-Control': 'public, max-age=30, s-maxage=30',
                'X-Timestamp': new Date().toISOString(),
                'X-Farm-ID': farmId
            }
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('❌ Dashboard API Error:', {
            message: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
        });

        return new NextResponse(
            JSON.stringify({ error: 'Failed to fetch dashboard data', details: errorMessage }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
} 