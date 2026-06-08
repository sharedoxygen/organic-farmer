import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards';
import { qualityGradingAI, type QualityAssessment } from '@/lib/ai/qualityGradingAI';

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
    } catch (error) {
        return errorResponse(error, 'Failed to assess quality');
    }
}

function appearanceToScore(appearance: string | null): number | null {
    if (!appearance) return null;
    const lower = appearance.toLowerCase();
    if (lower.includes('excellent')) return 92;
    if (lower.includes('good')) return 85;
    if (lower.includes('fair')) return 72;
    if (lower.includes('poor')) return 55;
    return 78;
}

function qcScore(uniformity: number | null, visual: string | null, status: string): number {
    const u =
        uniformity != null
            ? Math.round(uniformity <= 1 ? uniformity * 100 : uniformity)
            : null;
    const v = appearanceToScore(visual);
    if (u != null && v != null) return Math.round((u + v) / 2);
    if (u != null) return u;
    if (v != null) return v;
    const passed = ['PASSED', 'PASS', 'APPROVED'].includes(status.toUpperCase());
    return passed ? 85 : 62;
}

function qcToAssessment(
    check: {
        batchId: string;
        checkDate: Date;
        status: string;
        uniformity: number | null;
        visualAppearance: string | null;
    },
    batch: { batchNumber: string; cropType: string }
): QualityAssessment {
    const overall = qcScore(check.uniformity, check.visualAppearance, check.status);
    const grade = overall >= 92 ? 'A+' : overall >= 88 ? 'A' : overall >= 80 ? 'B' : overall >= 70 ? 'C' : 'D';
    return {
        batchId: check.batchId,
        batchNumber: batch.batchNumber,
        cropType: batch.cropType,
        overallGrade: grade,
        gradeConfidence: 0.82,
        scores: {
            appearance: appearanceToScore(check.visualAppearance) ?? overall,
            color: appearanceToScore(check.visualAppearance) ?? overall,
            size: overall,
            uniformity: check.uniformity ?? overall,
            freshness: overall,
            texture: overall,
            aroma: overall - 5,
            overall,
        },
        defects: [],
        harvestReadiness: {
            isReady: overall >= 80,
            readinessScore: overall,
            optimalHarvestWindow: { start: new Date(), end: new Date(Date.now() + 3 * 86400000) },
            daysUntilOptimal: overall >= 80 ? 0 : 3,
            daysUntilOvermature: 7,
            indicators: [],
        },
        shelfLife: {
            estimatedDays: 7,
            confidence: 0.75,
            storageConditions: {
                temperature: { min: 32, max: 36, unit: 'F' },
                humidity: { min: 90, max: 95 },
                packaging: 'clamshell',
                specialInstructions: [],
            },
            factors: [],
            expirationDate: new Date(Date.now() + 7 * 86400000),
        },
        marketChannels: [],
        recommendations: [],
        assessmentDate: check.checkDate,
        aiAnalysis: `QC record ${check.status}`,
    };
}

// GET /api/ai/quality-grading — Quality trends from inspection history
export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '90', 10);
        const since = new Date(Date.now() - days * 86400000);

        const checks = await prisma.quality_checks.findMany({
            where: { farm_id: farmId, checkDate: { gte: since } },
            orderBy: { checkDate: 'asc' },
            include: {
                batches: {
                    select: {
                        id: true,
                        batchNumber: true,
                        seed_varieties: { select: { name: true } },
                    },
                },
            },
        });

        const passed = checks.filter((c) =>
            ['PASSED', 'PASS', 'APPROVED'].includes(c.status.toUpperCase())
        ).length;
        const passRate = checks.length > 0 ? Math.round((passed / checks.length) * 100) : 100;

        const byBatch = new Map<string, QualityAssessment[]>();
        for (const c of checks) {
            if (!c.batches) continue;
            const assessment = qcToAssessment(c, {
                batchNumber: c.batches.batchNumber,
                cropType: c.batches.seed_varieties?.name || 'Crop',
            });
            const list = byBatch.get(c.batchId) || [];
            list.push(assessment);
            byBatch.set(c.batchId, list);
        }

        const batchTrends = Array.from(byBatch.entries())
            .map(([batchId, assessments]) => ({
                batchId,
                batchNumber: assessments[0]?.batchNumber,
                cropType: assessments[0]?.cropType,
                trend: qualityGradingAI.getQualityTrend(assessments),
            }))
            .filter((t) => t.trend !== null);

        return NextResponse.json({
            success: true,
            summary: {
                inspections: checks.length,
                passRate,
                batchesTracked: byBatch.size,
                periodDays: days,
            },
            batchTrends,
            farmId,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return errorResponse(error, 'Failed to get trends');
    }
}
