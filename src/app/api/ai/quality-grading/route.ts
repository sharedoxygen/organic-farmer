import { NextRequest, NextResponse } from 'next/server';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import { qualityGradingAI } from '@/lib/ai/qualityGradingAI';

export const dynamic = 'force-dynamic';

// POST /api/ai/quality-grading - Assess quality of a batch
export async function POST(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        const body = await request.json();

        const {
            batchId,
            batchNumber,
            cropType,
            imageUrl,
            daysInGrowth,
            expectedDaysToHarvest
        } = body;

        if (!batchId || !cropType) {
            return NextResponse.json(
                { success: false, error: 'batchId and cropType are required' },
                { status: 400 }
            );
        }

        console.log(`✅ Assessing quality for ${batchNumber} (${cropType})`);

        const assessment = await qualityGradingAI.assessQuality({
            imageUrl: imageUrl || '',
            cropType,
            batchId,
            batchNumber: batchNumber || batchId,
            daysInGrowth: daysInGrowth || 0,
            expectedDaysToHarvest: expectedDaysToHarvest || 10
        });

        return NextResponse.json({
            success: true,
            assessment,
            timestamp: new Date().toISOString(),
            farmId
        });
    } catch (error: any) {
        console.error('❌ Quality grading error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to assess quality' },
            { status: 500 }
        );
    }
}

// GET /api/ai/quality-grading/trends - Get quality trends
export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        console.log(`📊 Quality trends requested for farm ${farmId}`);

        // In production, fetch historical assessments and calculate trends
        return NextResponse.json({
            success: true,
            message: 'Submit assessments via POST for trend analysis',
            farmId
        });
    } catch (error: any) {
        console.error('❌ Quality trends error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to get trends' },
            { status: 500 }
        );
    }
}
