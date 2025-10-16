import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        const [
            seedTotal,
            seedOrganic,
            batchTotal,
            batchOrganic,
            complianceRecords,
            equipmentPower,
            packagingCount,
            qualityCounts,
            wasteLogs
        ] = await Promise.all([
            prisma.seed_varieties.count({ where: { farm_id: farmId } }),
            prisma.seed_varieties.count({ where: { farm_id: farmId, isOrganic: true } }),
            prisma.batches.count({ where: { farm_id: farmId } }),
            prisma.batches.count({ where: { farm_id: farmId, organicCompliant: true } }),
            prisma.organic_compliance.findMany({
                where: { farm_id: farmId },
                select: { status: true }
            }),
            prisma.equipment.aggregate({
                _sum: { powerConsumption: true },
                where: { farm_id: farmId }
            }),
            prisma.inventory_items.count({ where: { farm_id: farmId, category: 'PACKAGING' } }),
            prisma.quality_checks.findMany({
                where: { farm_id: farmId },
                select: { followUpRequired: true }
            }),
            prisma.inventory_logs.count({
                where: {
                    farm_id: farmId,
                    reason: { contains: 'waste', mode: 'insensitive' }
                }
            })
        ]);

        const complianceByStatus: Record<string, number> = {};
        for (const rec of complianceRecords) {
            const key = (rec.status || 'unknown').toLowerCase();
            complianceByStatus[key] = (complianceByStatus[key] || 0) + 1;
        }

        const totalQuality = qualityCounts.length;
        const followUps = qualityCounts.filter(q => q.followUpRequired === true).length;
        const followUpRate = totalQuality > 0 ? Math.round((followUps / totalQuality) * 100) : 0;

        const organicSeedRate = seedTotal > 0 ? Math.round((seedOrganic / seedTotal) * 100) : 0;
        const organicBatchRate = batchTotal > 0 ? Math.round((batchOrganic / batchTotal) * 100) : 0;

        return NextResponse.json({
            success: true,
            data: {
                organicSeedVarietiesPercent: organicSeedRate,
                organicBatchesPercent: organicBatchRate,
                complianceByStatus,
                totalEquipmentPowerConsumption: equipmentPower._sum.powerConsumption || 0,
                packagingItemsCount: packagingCount,
                qualityFollowUpRatePercent: followUpRate,
                wasteLogEvents: wasteLogs
            }
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Farm-ID': farmId,
                'X-Timestamp': new Date().toISOString()
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
}



