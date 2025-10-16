import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        console.log('📊 Fetching forecasts for farm:', farmId);

        // Get demand forecasts from database with proper farm isolation
        const forecasts = await (prisma as any).demand_forecasts.findMany({
            where: {
                farm_id: farmId,
                status: 'ACTIVE'
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        // Transform database records to frontend format
        const transformedForecasts = forecasts.map((forecast: any) => ({
            id: forecast.id,
            product: forecast.crop_type,
            productType: forecast.crop_variety || 'microgreens',
            currentDemand: 0, // Could be calculated from recent orders
            predictedDemand: forecast.total_predicted_demand,
            demandTrend: forecast.demand_trend as 'increasing' | 'decreasing' | 'stable',
            confidence: forecast.model_accuracy,
            forecastPeriod: `${forecast.forecast_period_days} days`,
            recommendations: forecast.recommendations ? JSON.parse(forecast.recommendations) : [],
            lastUpdated: forecast.updated_at.toISOString()
        }));

        return NextResponse.json({
            success: true,
            data: transformedForecasts,
            count: transformedForecasts.length
        });

    } catch (error) {
        console.error('Error fetching forecasts:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch forecasts' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { farmId, user } = await ensureFarmAccess(request);

        const body = await request.json();

        console.log('💾 Creating forecast for farm:', farmId);

        // Extract data from the forecast object
        const {
            crop,
            predictions,
            accuracy,
            modelType,
            factors,
            forecastPeriod,
            recommendations
        } = body;
        
        const userId = user.id;

        // Validate required fields
        if (!crop || !predictions || !accuracy) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: crop, predictions, accuracy' },
                { status: 400 }
            );
        }

        // Calculate totals
        const totalPredictedDemand = predictions.reduce((sum: number, pred: any) => sum + pred.predictedDemand, 0);
        const averagePrice = predictions.reduce((sum: number, pred: any) => sum + pred.priceEstimate, 0) / predictions.length;

        // Determine trend
        const demandTrend = predictions.length > 1 && predictions[1].predictedDemand > predictions[0].predictedDemand ? 'increasing' :
            predictions.length > 1 && predictions[1].predictedDemand < predictions[0].predictedDemand ? 'decreasing' : 'stable';

        // Create forecast record
        const forecast = await (prisma as any).demand_forecasts.create({
            data: {
                farm_id: farmId,
                crop_type: crop,
                crop_variety: 'microgreens',
                forecast_period_days: forecastPeriod || predictions.length,
                forecast_data: JSON.stringify(predictions),
                model_type: modelType || 'AI Statistical Analysis',
                model_accuracy: accuracy,
                confidence_threshold: 0.7,
                total_predicted_demand: totalPredictedDemand,
                average_price_estimate: averagePrice,
                demand_trend: demandTrend,
                market_conditions: JSON.stringify({}),
                contributing_factors: JSON.stringify(factors || {}),
                recommendations: JSON.stringify(recommendations || []),
                status: 'ACTIVE',
                created_by: userId,
                updated_by: userId
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                id: forecast.id,
                crop: forecast.crop_type,
                totalPredictedDemand: forecast.total_predicted_demand,
                accuracy: forecast.model_accuracy,
                demandTrend: forecast.demand_trend,
                createdAt: forecast.created_at
            }
        });

    } catch (error) {
        console.error('Error creating forecast:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create forecast' },
            { status: 500 }
        );
    }
} 