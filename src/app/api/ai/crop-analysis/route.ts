import { NextRequest, NextResponse } from 'next/server';
import { analyzePlantImage } from '@/lib/ai/plantVisionAnalysis';
import { fetchCropAnalysisHistory } from '@/lib/ai/cropAnalysisHistory';
import { logPlantScanAudit, resolvePlantScanBatch } from '@/lib/ai/plantScanAudit';
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/crop-analysis — Plant Vision analysis (unified with /api/ai/plant-scan)
 * Accepts imageUrl or imageDataUrl, optional batchId for traceability linkage.
 */
export async function POST(request: NextRequest) {
    try {
        const { farmId, user } = await ensureFarmAccess(request);
        const body = await request.json();
        const imageDataUrl = body.imageUrl || body.imageDataUrl;
        const { cropType, farmZone, notes, batchId } = body;

        if (!imageDataUrl || !cropType) {
            return NextResponse.json(
                { error: 'Image (imageUrl or imageDataUrl) and crop type are required' },
                { status: 400 }
            );
        }

        if (!String(imageDataUrl).startsWith('data:image/')) {
            return NextResponse.json(
                { error: 'Image must be a base64 data URL (data:image/...)' },
                { status: 400 }
            );
        }

        const batch = batchId
            ? await resolvePlantScanBatch(farmId, String(batchId))
            : null;

        if (batchId && !batch) {
            return NextResponse.json(
                { error: 'batchId does not belong to this farm' },
                { status: 400 }
            );
        }

        const result = await analyzePlantImage({
            imageDataUrl: String(imageDataUrl),
            cropType: batch?.cropType || String(cropType),
            farmZone: farmZone ? String(farmZone) : undefined,
            notes: notes ? String(notes) : undefined,
        });

        await logPlantScanAudit({
            farmId,
            userId: user.id,
            cropType: batch?.cropType || String(cropType),
            result,
            batch,
            farmZone: farmZone ? String(farmZone) : undefined,
            source: 'crop_analysis',
        });

        return NextResponse.json({
            success: true,
            result,
            analysis: {
                diseaseType: result.summary.diagnosis,
                confidence: result.summary.confidence,
                severity: result.summary.severity,
                recommendations: result.recommendations.map((r) => r.action),
                affectedArea: result.affectedAreaPercent,
                organicTreatments: result.organicTreatments,
                aiAnalysis: result.aiModel,
            },
            batch: batch
                ? { id: batch.id, batchNumber: batch.batchNumber, cropType: batch.cropType }
                : null,
            timestamp: new Date().toISOString(),
            aiModel: result.aiModel,
            farmId,
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Farm-ID': farmId,
            },
        });
    } catch (error) {
        console.error('❌ AI crop analysis error:', error);
        return errorResponse(error, 'AI crop analysis failed');
    }
}

/**
 * GET /api/ai/crop-analysis — Deprecated; use /api/ai/crop-analysis/history
 */
export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        const { searchParams } = new URL(request.url);

        if (searchParams.get('legacy') === '1') {
            const days = parseInt(searchParams.get('days') || '30', 10);
            const batchId = searchParams.get('batchId') || undefined;
            const history = await fetchCropAnalysisHistory(farmId, { days, batchId });
            return NextResponse.json({
                success: true,
                history,
                count: history.length,
                farmId,
                deprecated: true,
            });
        }

        return NextResponse.json({
            success: false,
            error: 'Use GET /api/ai/crop-analysis/history?days=30&batchId=...',
            migration: '/api/ai/crop-analysis/history',
            farmId,
        }, { status: 410 });
    } catch (error) {
        return errorResponse(error, 'Failed to fetch disease history');
    }
}
