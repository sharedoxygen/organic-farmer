import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards';
import { resourceOptimizationAI, FarmResourceData } from '@/lib/ai/resourceOptimizationAI';
import { loadFarmContext } from '@/lib/ai/farmContextService';

export const dynamic = 'force-dynamic';

// POST /api/ai/resource-optimization - Generate optimization plan
export async function POST(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        const body = await request.json();

        const {
            location,
            activeBatches,
            equipment,
            currentStaff,
            operatingHours,
            zones,
            planDays
        } = body;

        console.log(`📦 Generating resource optimization plan for farm ${farmId}`);

        const farmData: FarmResourceData = {
            farmId,
            location: location || 'New York, NY',
            activeBatches: activeBatches || [],
            equipment: equipment || [],
            currentStaff: currentStaff || 2,
            operatingHours: operatingHours || { start: '06:00', end: '18:00' },
            zones: zones || []
        };

        const plan = await resourceOptimizationAI.generateOptimizationPlan(
            farmData,
            planDays || 7
        );

        return NextResponse.json({
            success: true,
            plan,
            timestamp: new Date().toISOString(),
            farmId
        });
    } catch (error) {
        return errorResponse(error, 'Failed to generate optimization plan');
    }
}

// GET /api/ai/resource-optimization — Optimization summary from live farm data
export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        const { searchParams } = new URL(request.url);
        const planDays = parseInt(searchParams.get('days') || '30', 10);

        const ctx = await loadFarmContext(farmId);
        const [equipmentRows, zoneRows] = await Promise.all([
            prisma.equipment.findMany({ where: { farm_id: farmId }, take: 20 }),
            prisma.zones.findMany({ where: { farm_id: farmId, status: 'active' }, take: 15 }),
        ]);

        const equipment = equipmentRows.map((eq) => {
            const ageMonths = Math.max(
                1,
                Math.floor((Date.now() - eq.installDate.getTime()) / (30 * 86400000))
            );
            const condition =
                eq.status === 'OPERATIONAL' || eq.status === 'ACTIVE'
                    ? ('GOOD' as const)
                    : eq.status === 'MAINTENANCE'
                      ? ('FAIR' as const)
                      : ('POOR' as const);
            return {
                id: eq.id,
                name: eq.name,
                type: eq.type,
                age: ageMonths,
                condition,
                lastMaintenance: eq.lastMaintenance || eq.installDate,
                utilizationRate: eq.powerConsumption ? 0.7 : 0.55,
                energyConsumption: eq.powerConsumption || 3,
            };
        });

        const zones = zoneRows.map((z) => ({
            id: z.id,
            name: z.name,
            area: z.area || z.capacity * 10 || 500,
            cropTypes: Array.from(new Set(ctx.activeBatches.map((b) => b.cropType))),
            irrigationType: 'DRIP',
            lightingType: z.type?.includes('greenhouse') ? 'LED' : 'NATURAL',
        }));

        const farmData: FarmResourceData = {
            farmId,
            location: ctx.location,
            currentStaff: Math.max(2, Math.ceil(ctx.pendingTasks / 5)),
            operatingHours: { start: '06:00', end: '18:00' },
            activeBatches: ctx.activeBatches.map((b) => ({
                batchId: b.id,
                cropType: b.cropType,
                traysUsed: Math.max(1, Math.round(b.quantity)),
                zone: zones[0]?.name || 'Main',
                plantingDate: b.plantingDate,
                expectedHarvestDate:
                    b.expectedHarvestDate || new Date(Date.now() + 7 * 86400000),
                currentWaterUsage: Math.round(8 + b.metrics.humidity / 10),
            })),
            equipment,
            zones,
        };

        const plan = await resourceOptimizationAI.generateOptimizationPlan(farmData, planDays);

        return NextResponse.json({
            success: true,
            summary: {
                annualSavings: plan.overallSavings.totalAnnualSavings,
                waterSavingsPct: plan.water.savingsPercentage,
                laborSavingsPct: plan.labor.savingsPercentage,
                equipmentUtilization: plan.equipment.utilizationRate,
                activeBatches: ctx.activeBatches.length,
                equipmentCount: equipment.length,
                zoneCount: zones.length,
            },
            plan,
            farmId,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return errorResponse(error, 'Failed to get optimization info');
    }
}
