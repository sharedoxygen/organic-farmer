import { NextRequest, NextResponse } from 'next/server';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import { resourceOptimizationAI, FarmResourceData } from '@/lib/ai/resourceOptimizationAI';

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
    } catch (error: any) {
        console.error('❌ Resource optimization error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to generate optimization plan' },
            { status: 500 }
        );
    }
}

// GET /api/ai/resource-optimization - Get optimization summary
export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        console.log(`📦 Resource optimization summary requested for farm ${farmId}`);

        return NextResponse.json({
            success: true,
            message: 'Submit farm data via POST for full optimization plan',
            capabilities: [
                'Water usage optimization',
                'Labor scheduling',
                'Input management',
                'Equipment utilization'
            ],
            farmId
        });
    } catch (error: any) {
        console.error('❌ Resource optimization error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to get optimization info' },
            { status: 500 }
        );
    }
}
