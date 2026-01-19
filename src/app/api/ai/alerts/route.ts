import { NextRequest, NextResponse } from 'next/server';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import { alertEngine, BatchHealthData, ResourceData } from '@/lib/ai/alertEngine';

export const dynamic = 'force-dynamic';

// GET /api/ai/alerts - Get AI-generated alerts for the farm
export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        const { searchParams } = new URL(request.url);
        const location = searchParams.get('location') || 'New York, NY';

        console.log(`⚠️ Generating AI alerts for farm ${farmId}`);

        // In production, fetch real batch and resource data from database
        // For now, use sample data structure
        const sampleBatches: BatchHealthData[] = [];
        const sampleResources: ResourceData[] = [];

        const alerts = await alertEngine.generateFarmAlerts(
            farmId,
            sampleBatches,
            sampleResources,
            location
        );

        const stats = alertEngine.getAlertStats(alerts);

        return NextResponse.json({
            success: true,
            alerts,
            stats,
            timestamp: new Date().toISOString(),
            farmId
        });
    } catch (error: any) {
        console.error('❌ Alerts API error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to generate alerts' },
            { status: 500 }
        );
    }
}

// POST /api/ai/alerts/acknowledge - Acknowledge an alert
export async function POST(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        const { alertId, userId } = await request.json();

        if (!alertId) {
            return NextResponse.json(
                { success: false, error: 'Alert ID is required' },
                { status: 400 }
            );
        }

        console.log(`✅ Acknowledging alert ${alertId} for farm ${farmId}`);

        // In production, update alert status in database
        return NextResponse.json({
            success: true,
            alertId,
            acknowledgedAt: new Date().toISOString(),
            acknowledgedBy: userId,
            farmId
        });
    } catch (error: any) {
        console.error('❌ Alert acknowledge error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to acknowledge alert' },
            { status: 500 }
        );
    }
}
