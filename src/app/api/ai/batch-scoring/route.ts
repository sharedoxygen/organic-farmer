import { NextRequest, NextResponse } from 'next/server';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import { batchScoringAI, BatchHealthMetrics } from '@/lib/ai/batchScoringAI';

export const dynamic = 'force-dynamic';

// POST /api/ai/batch-scoring - Calculate batch health score
export async function POST(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        const body = await request.json();

        const {
            batchId,
            batchNumber,
            cropType,
            metrics,
            historicalScores
        } = body;

        if (!batchId || !cropType || !metrics) {
            return NextResponse.json(
                { success: false, error: 'batchId, cropType, and metrics are required' },
                { status: 400 }
            );
        }

        console.log(`📊 Calculating batch score for ${batchNumber} (${cropType})`);

        const healthMetrics: BatchHealthMetrics = {
            batchId,
            temperature: metrics.temperature || 68,
            humidity: metrics.humidity || 60,
            lightHours: metrics.lightHours || 12,
            daysInGrowth: metrics.daysInGrowth || 0,
            expectedDaysTotal: metrics.expectedDaysTotal || 10,
            germinationRate: metrics.germinationRate,
            visualHealth: metrics.visualHealth,
            pestPressure: metrics.pestPressure || 0,
            diseaseRisk: metrics.diseaseRisk || 0
        };

        const score = await batchScoringAI.calculateBatchScore(
            batchId,
            batchNumber || batchId,
            cropType,
            healthMetrics,
            historicalScores
        );

        const prediction = await batchScoringAI.generateBatchPrediction(
            batchId,
            cropType,
            healthMetrics,
            score
        );

        const aiAnalysis = await batchScoringAI.getAIBatchAnalysis(
            batchId,
            cropType,
            score,
            prediction
        );

        return NextResponse.json({
            success: true,
            score,
            prediction,
            aiAnalysis,
            timestamp: new Date().toISOString(),
            farmId
        });
    } catch (error: any) {
        console.error('❌ Batch scoring error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to calculate batch score' },
            { status: 500 }
        );
    }
}

// GET /api/ai/batch-scoring/compare - Compare multiple batches
export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        console.log(`📊 Batch comparison requested for farm ${farmId}`);

        // In production, fetch batch data from database and compare
        // Return sample comparison structure
        return NextResponse.json({
            success: true,
            message: 'Use POST to submit batches for comparison',
            farmId
        });
    } catch (error: any) {
        console.error('❌ Batch comparison error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to compare batches' },
            { status: 500 }
        );
    }
}
