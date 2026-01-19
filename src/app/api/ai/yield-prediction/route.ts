import { NextRequest, NextResponse } from 'next/server';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import { yieldPredictionAI } from '@/lib/ai/yieldPredictionAI';
import { BatchHealthMetrics } from '@/lib/ai/batchScoringAI';

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
    } catch (error: any) {
        console.error('❌ Yield prediction error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to predict yield' },
            { status: 500 }
        );
    }
}

// GET /api/ai/yield-prediction/farm-forecast - Get farm-wide yield forecast
export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '30');
        const location = searchParams.get('location') || 'New York, NY';

        console.log(`📈 Generating farm yield forecast for ${days} days`);

        // In production, fetch active batches from database
        // For now, return structure for integration
        return NextResponse.json({
            success: true,
            message: 'Submit active batches via POST for farm forecast',
            forecastDays: days,
            location,
            farmId
        });
    } catch (error: any) {
        console.error('❌ Farm forecast error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to generate forecast' },
            { status: 500 }
        );
    }
}
