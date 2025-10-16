import { NextRequest, NextResponse } from 'next/server';
import { ollamaService } from '@/lib/ai/ollamaService';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

// 🔧 Dynamic route - uses request headers
export const dynamic = 'force-dynamic';

// POST /api/ai/crop-analysis - Analyze crop image for diseases
export async function POST(request: NextRequest) {
    try {
        // 🔒 Enforce auth + farm access
        const { farmId } = await ensureFarmAccess(request);

        const { imageUrl, cropType, farmZone } = await request.json();

        if (!imageUrl || !cropType) {
            return NextResponse.json(
                { error: 'Image URL and crop type are required' },
                { status: 400 }
            );
        }

        console.log(`🔍 Ollama AI analyzing ${cropType} image for diseases in farm ${farmId}...`);

        const analysis = await ollamaService.detectDisease({
            imageUrl,
            cropType,
            uploadDate: new Date(),
            farmZone: farmZone || 'Unknown'
        });

        return NextResponse.json({
            success: true,
            analysis,
            timestamp: new Date().toISOString(),
            aiModel: 'Ollama Local AI (Qwen3 + DeepSeek-R1)',
            farmId  // Include farm context in response
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Farm-ID': farmId
            }
        });

    } catch (error) {
        console.error('❌ AI crop analysis error:', error);
        return NextResponse.json(
            { error: 'AI analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// GET /api/ai/crop-analysis/history - Get disease analysis history for a zone
export async function GET(request: NextRequest) {
    try {
        // 🔒 Enforce auth + farm access
        const { farmId } = await ensureFarmAccess(request);

        const { searchParams } = new URL(request.url);
        const zoneId = searchParams.get('zoneId');
        const days = parseInt(searchParams.get('days') || '30');

        if (!zoneId) {
            return NextResponse.json(
                { error: 'Zone ID is required' },
                { status: 400 }
            );
        }

        // For now, return empty history since we're using Ollama local AI
        // TODO: Implement disease history tracking with Ollama service
        const history: any[] = [];

        return NextResponse.json({
            success: true,
            history,
            timestamp: new Date().toISOString(),
            farmId
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Farm-ID': farmId
            }
        });

    } catch (error) {
        console.error('❌ AI disease history error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch disease history' },
            { status: 500 }
        );
    }
} 