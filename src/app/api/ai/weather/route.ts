import { NextRequest, NextResponse } from 'next/server';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import { weatherService } from '@/lib/ai/weatherService';

export const dynamic = 'force-dynamic';

// GET /api/ai/weather - Get weather data and growing conditions
export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        const { searchParams } = new URL(request.url);
        const location = searchParams.get('location') || 'New York, NY';
        const days = parseInt(searchParams.get('days') || '7');

        console.log(`🌤️ Fetching weather for ${location} (farm ${farmId})`);

        const [current, forecast, alerts, conditions] = await Promise.all([
            weatherService.getCurrentWeather(location),
            weatherService.getForecast(location, days),
            weatherService.getWeatherAlerts(location),
            weatherService.getGrowingConditions(location, 'general')
        ]);

        return NextResponse.json({
            success: true,
            data: {
                current,
                forecast,
                alerts,
                growingConditions: conditions,
                weatherIndex: conditions.overallScore / 100
            },
            location,
            timestamp: new Date().toISOString(),
            farmId
        });
    } catch (error: any) {
        console.error('❌ Weather API error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to fetch weather' },
            { status: 500 }
        );
    }
}
