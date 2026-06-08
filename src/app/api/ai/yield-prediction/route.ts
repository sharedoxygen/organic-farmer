import { NextRequest, NextResponse } from 'next/server';
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards';
import { yieldPredictionAI } from '@/lib/ai/yieldPredictionAI';
import { BatchHealthMetrics } from '@/lib/ai/batchScoringAI';
import { loadFarmContext } from '@/lib/ai/farmContextService';

export const dynamic = 'force-dynamic';

// POST /api/ai/yield-prediction - Predict yield for a batch
export async function POST(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        const body = await request.json();

        const {
            batchId,
            batchNumber,
            cropType,
            traysUsed,
            metrics,
            location
        } = body;

        if (!batchId || !cropType || !traysUsed) {
            return NextResponse.json(
                { success: false, error: 'batchId, cropType, and traysUsed are required' },
                { status: 400 }
            );
        }

        console.log(`📈 Predicting yield for ${batchNumber} (${cropType}, ${traysUsed} trays)`);

        const healthMetrics: BatchHealthMetrics = {
            batchId,
            temperature: metrics?.temperature || 68,
            humidity: metrics?.humidity || 60,
            lightHours: metrics?.lightHours || 12,
            daysInGrowth: metrics?.daysInGrowth || 0,
            expectedDaysTotal: metrics?.expectedDaysTotal || 10,
            pestPressure: metrics?.pestPressure || 0,
            diseaseRisk: metrics?.diseaseRisk || 0
        };

        const prediction = await yieldPredictionAI.predictBatchYield(
            batchId,
            batchNumber || batchId,
            cropType,
            traysUsed,
            healthMetrics,
            undefined,
            location
        );

        return NextResponse.json({
            success: true,
            prediction,
            timestamp: new Date().toISOString(),
            farmId
        });
    } catch (error) {
        return errorResponse(error, 'Failed to predict yield');
    }
}

// GET /api/ai/yield-prediction — Farm-wide yield forecast from active batches
export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '30', 10);
        const ctx = await loadFarmContext(farmId);
        const location = searchParams.get('location') || ctx.location;

        const forecast = await yieldPredictionAI.generateFarmForecast(
            farmId,
            ctx.activeBatches.map((b) => ({
                batchId: b.id,
                batchNumber: b.batchNumber,
                cropType: b.cropType,
                traysUsed: Math.max(1, Math.round(b.quantity)),
                metrics: b.metrics,
                expectedHarvestDate:
                    b.expectedHarvestDate || new Date(Date.now() + 7 * 86400000),
            })),
            days,
            location
        );

        return NextResponse.json({
            success: true,
            forecast,
            forecastDays: days,
            location,
            activeBatches: ctx.activeBatches.length,
            farmId,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return errorResponse(error, 'Failed to generate forecast');
    }
}
