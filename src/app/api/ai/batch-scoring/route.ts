import { NextRequest, NextResponse } from 'next/server';
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards';
import { batchScoringAI, BatchHealthMetrics } from '@/lib/ai/batchScoringAI';
import { loadFarmContext } from '@/lib/ai/farmContextService';

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
    } catch (error) {
        return errorResponse(error, 'Failed to calculate batch score');
    }
}

// GET /api/ai/batch-scoring/compare - Compare active batches from live DB
export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        const { searchParams } = new URL(request.url);
        const limit = Math.min(20, parseInt(searchParams.get('limit') || '10', 10));

        const ctx = await loadFarmContext(farmId);
        const batches = ctx.activeBatches.slice(0, limit);

        const scored = await Promise.all(
            batches.map(async (b) => {
                const score = await batchScoringAI.calculateBatchScore(
                    b.id,
                    b.batchNumber,
                    b.cropType,
                    b.metrics
                );
                return {
                    batchId: b.id,
                    batchNumber: b.batchNumber,
                    cropType: b.cropType,
                    score,
                };
            })
        );

        const comparison = batchScoringAI.compareBatches(scored);
        const avgScore =
            scored.length > 0
                ? Math.round(
                      scored.reduce((s, x) => s + x.score.overallScore, 0) / scored.length
                  )
                : 0;

        return NextResponse.json({
            success: true,
            comparison,
            avgScore,
            batchCount: scored.length,
            farmId,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return errorResponse(error, 'Failed to compare batches');
    }
}
