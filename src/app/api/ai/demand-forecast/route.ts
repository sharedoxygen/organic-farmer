import { NextRequest, NextResponse } from 'next/server';
import { ollamaService } from '@/lib/ai/ollamaService';
import { demandForecastingAI } from '@/lib/ai/demandForecastingAI'; // Keep for fallback
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

// 🔧 Dynamic route - uses request headers
export const dynamic = 'force-dynamic';

// POST /api/ai/demand-forecast - Generate AI-powered demand forecast
export async function POST(request: NextRequest) {
    try {
        // 🔒 Enforce auth + farm access
        const { farmId } = await ensureFarmAccess(request);

        const { cropType, daysAhead = 30, currentMarketData = {} } = await request.json();

        if (!cropType) {
            return NextResponse.json(
                { error: 'Crop type is required' },
                { status: 400 }
            );
        }

        console.log(`📈 Generating statistical forecast for ${cropType} in farm ${farmId}...`);

        const forecast = await demandForecastingAI.generateForecast(
            cropType,
            daysAhead,
            currentMarketData
        );

        return NextResponse.json({
            success: true,
            forecast,
            timestamp: new Date().toISOString(),
            aiModel: 'Statistical ML + Time Series Analysis',
            farmId
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Farm-ID': farmId
            }
        });

    } catch (error) {
        console.error('❌ AI demand forecast error:', error);
        return NextResponse.json(
            { error: 'AI forecasting failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// GET /api/ai/demand-forecast/insights - Get AI market insights
export async function GET(request: NextRequest) {
    try {
        // 🔒 Enforce auth + farm access
        const { farmId } = await ensureFarmAccess(request);

        const { searchParams } = new URL(request.url);
        const crop = searchParams.get('crop');

        if (!crop) {
            return NextResponse.json(
                { error: 'Crop parameter is required' },
                { status: 400 }
            );
        }

        console.log(`🔮 Generating DeepSeek-R1 market insights for ${crop} in farm ${farmId}...`);

        // Use Ollama service for advanced market analysis
        const aiInsights = await ollamaService.generateMarketAnalysis(crop, {});

        // Combine with traditional insights for comprehensive analysis
        const traditionalInsights = await demandForecastingAI.getMarketInsights(crop);

        const insights = {
            ...traditionalInsights,
            aiInsights: aiInsights,
            aiModel: 'DeepSeek-R1 + Traditional Analytics'
        };

        return NextResponse.json({
            success: true,
            insights,
            timestamp: new Date().toISOString(),
            farmId
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Farm-ID': farmId
            }
        });

    } catch (error) {
        console.error('❌ AI market insights error:', error);
        return NextResponse.json(
            { error: 'Failed to generate insights' },
            { status: 500 }
        );
    }
} 