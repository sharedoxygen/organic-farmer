/**
 * AI-Powered Yield Prediction Service
 * Predicts harvest yields based on multiple factors for production planning
 */

import { ollamaService } from './ollamaService';
import { weatherService } from './weatherService';
import { batchScoringAI, BatchHealthMetrics } from './batchScoringAI';

export interface YieldPrediction {
    batchId: string;
    batchNumber: string;
    cropType: string;
    predictedYield: number;
    yieldUnit: string;
    confidence: number;
    predictionDate: Date;
    harvestDate: Date;
    factors: YieldFactor[];
    range: {
        low: number;
        expected: number;
        high: number;
    };
    comparison: {
        vsHistoricalAvg: number;
        vsBenchmark: number;
        vsLastBatch: number;
    };
}

export interface YieldFactor {
    name: string;
    impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    weight: number;
    value: number;
    description: string;
}

export interface FarmYieldForecast {
    farmId: string;
    forecastPeriod: {
        start: Date;
        end: Date;
    };
    totalPredictedYield: number;
    yieldUnit: string;
    byCrop: CropYieldForecast[];
    byWeek: WeeklyYieldForecast[];
    confidence: number;
    recommendations: string[];
}

export interface CropYieldForecast {
    cropType: string;
    predictedYield: number;
    activeBatches: number;
    avgYieldPerBatch: number;
    confidence: number;
    trend: 'up' | 'stable' | 'down';
}

export interface WeeklyYieldForecast {
    weekStart: Date;
    weekEnd: Date;
    predictedYield: number;
    batchesHarvesting: number;
    crops: string[];
    confidence: number;
}

export interface HistoricalYieldData {
    batchId: string;
    cropType: string;
    plantingDate: Date;
    harvestDate: Date;
    expectedYield: number;
    actualYield: number;
    yieldEfficiency: number;
    qualityGrade: string;
    environmentalConditions: {
        avgTemperature: number;
        avgHumidity: number;
        lightHours: number;
    };
}

export interface ProductionPlanInput {
    targetYield: number;
    cropType: string;
    targetDate: Date;
    constraints?: {
        maxTrays?: number;
        maxBatches?: number;
        availableSpace?: number;
    };
}

export interface ProductionPlan {
    cropType: string;
    targetYield: number;
    targetDate: Date;
    recommendedBatches: number;
    recommendedTraysPerBatch: number;
    totalTrays: number;
    plantingSchedule: PlantingScheduleItem[];
    expectedYield: number;
    yieldBuffer: number;
    confidence: number;
    risks: string[];
    recommendations: string[];
}

export interface PlantingScheduleItem {
    batchNumber: number;
    plantingDate: Date;
    expectedHarvestDate: Date;
    trays: number;
    expectedYield: number;
}

export class YieldPredictionAI {
    private cropYieldModels: Map<string, CropYieldModel> = new Map();

    constructor() {
        this.initializeYieldModels();
    }

    private initializeYieldModels(): void {
        const models: CropYieldModel[] = [
            {
                cropType: 'Arugula',
                baseYieldPerTray: 8.5,
                yieldUnit: 'oz',
                daysToHarvest: 10,
                yieldVariance: 0.15,
                temperatureSensitivity: 0.8,
                humiditySensitivity: 0.6,
                lightSensitivity: 0.7,
                seasonalFactors: [0.9, 0.95, 1.0, 1.05, 1.1, 1.05, 0.95, 0.9, 0.95, 1.0, 0.95, 0.9]
            },
            {
                cropType: 'Basil',
                baseYieldPerTray: 6.0,
                yieldUnit: 'oz',
                daysToHarvest: 14,
                yieldVariance: 0.18,
                temperatureSensitivity: 0.9,
                humiditySensitivity: 0.7,
                lightSensitivity: 0.85,
                seasonalFactors: [0.7, 0.75, 0.85, 0.95, 1.1, 1.15, 1.1, 1.05, 0.95, 0.85, 0.75, 0.7]
            },
            {
                cropType: 'Kale',
                baseYieldPerTray: 7.0,
                yieldUnit: 'oz',
                daysToHarvest: 12,
                yieldVariance: 0.12,
                temperatureSensitivity: 0.6,
                humiditySensitivity: 0.5,
                lightSensitivity: 0.6,
                seasonalFactors: [1.1, 1.1, 1.05, 1.0, 0.9, 0.85, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1]
            },
            {
                cropType: 'Pea Shoots',
                baseYieldPerTray: 10.0,
                yieldUnit: 'oz',
                daysToHarvest: 8,
                yieldVariance: 0.1,
                temperatureSensitivity: 0.5,
                humiditySensitivity: 0.4,
                lightSensitivity: 0.5,
                seasonalFactors: [1.0, 1.0, 1.05, 1.05, 1.0, 0.95, 0.9, 0.95, 1.0, 1.05, 1.0, 1.0]
            },
            {
                cropType: 'Sunflower',
                baseYieldPerTray: 9.0,
                yieldUnit: 'oz',
                daysToHarvest: 10,
                yieldVariance: 0.12,
                temperatureSensitivity: 0.7,
                humiditySensitivity: 0.5,
                lightSensitivity: 0.8,
                seasonalFactors: [0.85, 0.9, 0.95, 1.0, 1.1, 1.15, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85]
            },
            {
                cropType: 'Radish',
                baseYieldPerTray: 7.5,
                yieldUnit: 'oz',
                daysToHarvest: 6,
                yieldVariance: 0.1,
                temperatureSensitivity: 0.6,
                humiditySensitivity: 0.5,
                lightSensitivity: 0.5,
                seasonalFactors: [1.05, 1.05, 1.0, 0.95, 0.9, 0.85, 0.85, 0.9, 0.95, 1.0, 1.05, 1.05]
            }
        ];

        models.forEach(model => this.cropYieldModels.set(model.cropType, model));
    }

    /**
     * Predict yield for a single batch
     */
    async predictBatchYield(
        batchId: string,
        batchNumber: string,
        cropType: string,
        traysUsed: number,
        metrics: BatchHealthMetrics,
        historicalData?: HistoricalYieldData[],
        location?: string
    ): Promise<YieldPrediction> {
        const model = this.cropYieldModels.get(cropType) || this.getDefaultModel();
        const factors: YieldFactor[] = [];

        // Base yield calculation
        let yieldMultiplier = 1.0;

        // 1. Health factor
        const healthFactor = await this.calculateHealthFactor(metrics);
        factors.push(healthFactor);
        yieldMultiplier *= (1 + (healthFactor.value - 0.5) * healthFactor.weight);

        // 2. Environmental factor
        const envFactor = this.calculateEnvironmentalFactor(metrics, model);
        factors.push(envFactor);
        yieldMultiplier *= (1 + (envFactor.value - 0.5) * envFactor.weight);

        // 3. Seasonal factor
        const seasonalFactor = this.calculateSeasonalFactor(model);
        factors.push(seasonalFactor);
        yieldMultiplier *= seasonalFactor.value;

        // 4. Weather factor (if location provided)
        if (location) {
            const weatherFactor = await this.calculateWeatherFactor(location, model);
            factors.push(weatherFactor);
            yieldMultiplier *= (1 + (weatherFactor.value - 0.5) * weatherFactor.weight);
        }

        // 5. Historical performance factor
        if (historicalData && historicalData.length > 0) {
            const histFactor = this.calculateHistoricalFactor(historicalData, cropType);
            factors.push(histFactor);
            yieldMultiplier *= (1 + (histFactor.value - 0.5) * histFactor.weight);
        }

        // 6. Growth stage factor
        const growthFactor = this.calculateGrowthStageFactor(metrics, model);
        factors.push(growthFactor);
        yieldMultiplier *= (1 + (growthFactor.value - 0.5) * growthFactor.weight);

        // Calculate predicted yield
        const baseYield = model.baseYieldPerTray * traysUsed;
        const predictedYield = Math.round(baseYield * yieldMultiplier * 10) / 10;

        // Calculate confidence based on data quality
        const confidence = this.calculateConfidence(factors, historicalData);

        // Calculate yield range
        const variance = model.yieldVariance * (1 - confidence);
        const range = {
            low: Math.round(predictedYield * (1 - variance) * 10) / 10,
            expected: predictedYield,
            high: Math.round(predictedYield * (1 + variance) * 10) / 10
        };

        // Calculate comparisons
        const comparison = this.calculateComparisons(predictedYield, traysUsed, model, historicalData);

        // Calculate harvest date
        const remainingDays = metrics.expectedDaysTotal - metrics.daysInGrowth;
        const harvestDate = new Date();
        harvestDate.setDate(harvestDate.getDate() + remainingDays);

        return {
            batchId,
            batchNumber,
            cropType,
            predictedYield,
            yieldUnit: model.yieldUnit,
            confidence,
            predictionDate: new Date(),
            harvestDate,
            factors,
            range,
            comparison
        };
    }

    /**
     * Generate farm-wide yield forecast
     */
    async generateFarmForecast(
        farmId: string,
        activeBatches: Array<{
            batchId: string;
            batchNumber: string;
            cropType: string;
            traysUsed: number;
            metrics: BatchHealthMetrics;
            expectedHarvestDate: Date;
        }>,
        forecastDays: number = 30,
        location?: string
    ): Promise<FarmYieldForecast> {
        const forecastStart = new Date();
        const forecastEnd = new Date();
        forecastEnd.setDate(forecastEnd.getDate() + forecastDays);

        // Predict yield for each batch
        const batchPredictions: YieldPrediction[] = [];
        for (const batch of activeBatches) {
            const prediction = await this.predictBatchYield(
                batch.batchId,
                batch.batchNumber,
                batch.cropType,
                batch.traysUsed,
                batch.metrics,
                undefined,
                location
            );
            batchPredictions.push(prediction);
        }

        // Aggregate by crop
        const byCrop = this.aggregateByCrop(batchPredictions);

        // Aggregate by week
        const byWeek = this.aggregateByWeek(batchPredictions, forecastStart, forecastEnd);

        // Calculate total
        const totalPredictedYield = batchPredictions.reduce((sum, p) => sum + p.predictedYield, 0);
        const avgConfidence = batchPredictions.reduce((sum, p) => sum + p.confidence, 0) / batchPredictions.length;

        // Generate recommendations
        const recommendations = await this.generateForecastRecommendations(byCrop, byWeek);

        return {
            farmId,
            forecastPeriod: { start: forecastStart, end: forecastEnd },
            totalPredictedYield: Math.round(totalPredictedYield * 10) / 10,
            yieldUnit: 'oz',
            byCrop,
            byWeek,
            confidence: avgConfidence,
            recommendations
        };
    }

    /**
     * Generate production plan to meet target yield
     */
    async generateProductionPlan(input: ProductionPlanInput): Promise<ProductionPlan> {
        const model = this.cropYieldModels.get(input.cropType) || this.getDefaultModel();

        // Calculate required production
        const yieldBuffer = 1.15; // 15% buffer for losses
        const targetWithBuffer = input.targetYield * yieldBuffer;
        const yieldPerTray = model.baseYieldPerTray * this.getSeasonalMultiplier(model, input.targetDate);

        const totalTraysNeeded = Math.ceil(targetWithBuffer / yieldPerTray);

        // Determine batch structure
        const optimalTraysPerBatch = 20; // Configurable
        const recommendedBatches = Math.ceil(totalTraysNeeded / optimalTraysPerBatch);
        const traysPerBatch = Math.ceil(totalTraysNeeded / recommendedBatches);

        // Apply constraints
        let finalBatches = recommendedBatches;
        let finalTraysPerBatch = traysPerBatch;

        if (input.constraints?.maxBatches && finalBatches > input.constraints.maxBatches) {
            finalBatches = input.constraints.maxBatches;
            finalTraysPerBatch = Math.ceil(totalTraysNeeded / finalBatches);
        }

        if (input.constraints?.maxTrays && finalTraysPerBatch > input.constraints.maxTrays) {
            finalTraysPerBatch = input.constraints.maxTrays;
            finalBatches = Math.ceil(totalTraysNeeded / finalTraysPerBatch);
        }

        // Generate planting schedule
        const plantingSchedule = this.generatePlantingSchedule(
            finalBatches,
            finalTraysPerBatch,
            input.targetDate,
            model
        );

        // Calculate expected yield
        const expectedYield = plantingSchedule.reduce((sum, item) => sum + item.expectedYield, 0);

        // Identify risks
        const risks = this.identifyProductionRisks(input, model, plantingSchedule);

        // Generate recommendations
        const recommendations = await this.generatePlanRecommendations(input, model, plantingSchedule);

        return {
            cropType: input.cropType,
            targetYield: input.targetYield,
            targetDate: input.targetDate,
            recommendedBatches: finalBatches,
            recommendedTraysPerBatch: finalTraysPerBatch,
            totalTrays: finalBatches * finalTraysPerBatch,
            plantingSchedule,
            expectedYield: Math.round(expectedYield * 10) / 10,
            yieldBuffer: yieldBuffer - 1,
            confidence: 0.85,
            risks,
            recommendations
        };
    }

    // Private helper methods

    private async calculateHealthFactor(metrics: BatchHealthMetrics): Promise<YieldFactor> {
        const healthScore = 100 - (metrics.pestPressure * 5) - (metrics.diseaseRisk * 5);
        const normalizedValue = Math.max(0, Math.min(1, healthScore / 100));

        return {
            name: 'Plant Health',
            impact: normalizedValue >= 0.7 ? 'POSITIVE' : normalizedValue >= 0.5 ? 'NEUTRAL' : 'NEGATIVE',
            weight: 0.25,
            value: normalizedValue,
            description: `Health score: ${healthScore}% (Pest: ${metrics.pestPressure}/10, Disease: ${metrics.diseaseRisk}/10)`
        };
    }

    private calculateEnvironmentalFactor(metrics: BatchHealthMetrics, model: CropYieldModel): YieldFactor {
        // Temperature impact
        const optimalTemp = 68; // Simplified
        const tempDiff = Math.abs(metrics.temperature - optimalTemp);
        const tempScore = Math.max(0, 1 - (tempDiff / 30) * model.temperatureSensitivity);

        // Humidity impact
        const optimalHumidity = 60;
        const humidityDiff = Math.abs(metrics.humidity - optimalHumidity);
        const humidityScore = Math.max(0, 1 - (humidityDiff / 40) * model.humiditySensitivity);

        // Light impact
        const optimalLight = 12;
        const lightDiff = Math.abs(metrics.lightHours - optimalLight);
        const lightScore = Math.max(0, 1 - (lightDiff / 8) * model.lightSensitivity);

        const avgScore = (tempScore + humidityScore + lightScore) / 3;

        return {
            name: 'Environmental Conditions',
            impact: avgScore >= 0.7 ? 'POSITIVE' : avgScore >= 0.5 ? 'NEUTRAL' : 'NEGATIVE',
            weight: 0.2,
            value: avgScore,
            description: `Temp: ${metrics.temperature}°F, Humidity: ${metrics.humidity}%, Light: ${metrics.lightHours}h`
        };
    }

    private calculateSeasonalFactor(model: CropYieldModel): YieldFactor {
        const month = new Date().getMonth();
        const seasonalValue = model.seasonalFactors[month];

        return {
            name: 'Seasonal Conditions',
            impact: seasonalValue >= 1.0 ? 'POSITIVE' : seasonalValue >= 0.9 ? 'NEUTRAL' : 'NEGATIVE',
            weight: 0.15,
            value: seasonalValue,
            description: `Current month factor: ${(seasonalValue * 100).toFixed(0)}%`
        };
    }

    private async calculateWeatherFactor(location: string, model: CropYieldModel): Promise<YieldFactor> {
        try {
            const conditions = await weatherService.getGrowingConditions(location, model.cropType);
            const normalizedScore = conditions.overallScore / 100;

            return {
                name: 'Weather Conditions',
                impact: normalizedScore >= 0.7 ? 'POSITIVE' : normalizedScore >= 0.5 ? 'NEUTRAL' : 'NEGATIVE',
                weight: 0.15,
                value: normalizedScore,
                description: `Growing conditions score: ${conditions.overallScore}%`
            };
        } catch (error) {
            return {
                name: 'Weather Conditions',
                impact: 'NEUTRAL',
                weight: 0.1,
                value: 0.7,
                description: 'Weather data unavailable, using default'
            };
        }
    }

    private calculateHistoricalFactor(historicalData: HistoricalYieldData[], cropType: string): YieldFactor {
        const relevantData = historicalData.filter(h => h.cropType === cropType);
        if (relevantData.length === 0) {
            return {
                name: 'Historical Performance',
                impact: 'NEUTRAL',
                weight: 0.1,
                value: 0.5,
                description: 'No historical data available'
            };
        }

        const avgEfficiency = relevantData.reduce((sum, h) => sum + h.yieldEfficiency, 0) / relevantData.length;
        const normalizedValue = Math.min(1, avgEfficiency);

        return {
            name: 'Historical Performance',
            impact: normalizedValue >= 0.9 ? 'POSITIVE' : normalizedValue >= 0.8 ? 'NEUTRAL' : 'NEGATIVE',
            weight: 0.15,
            value: normalizedValue,
            description: `Average historical efficiency: ${(avgEfficiency * 100).toFixed(0)}%`
        };
    }

    private calculateGrowthStageFactor(metrics: BatchHealthMetrics, model: CropYieldModel): YieldFactor {
        const progressRatio = metrics.daysInGrowth / metrics.expectedDaysTotal;

        // Early stage has more uncertainty
        let value = 0.5;
        if (progressRatio >= 0.7) {
            value = 0.8; // More confident near harvest
        } else if (progressRatio >= 0.4) {
            value = 0.65;
        }

        return {
            name: 'Growth Stage',
            impact: progressRatio >= 0.5 ? 'POSITIVE' : 'NEUTRAL',
            weight: 0.1,
            value,
            description: `Day ${metrics.daysInGrowth} of ${metrics.expectedDaysTotal} (${(progressRatio * 100).toFixed(0)}% complete)`
        };
    }

    private calculateConfidence(factors: YieldFactor[], historicalData?: HistoricalYieldData[]): number {
        // Base confidence from factor quality
        const avgFactorValue = factors.reduce((sum, f) => sum + f.value, 0) / factors.length;
        let confidence = 0.6 + (avgFactorValue * 0.2);

        // Boost from historical data
        if (historicalData && historicalData.length >= 5) {
            confidence += 0.1;
        } else if (historicalData && historicalData.length >= 2) {
            confidence += 0.05;
        }

        return Math.min(0.95, confidence);
    }

    private calculateComparisons(
        predictedYield: number,
        traysUsed: number,
        model: CropYieldModel,
        historicalData?: HistoricalYieldData[]
    ): { vsHistoricalAvg: number; vsBenchmark: number; vsLastBatch: number } {
        const yieldPerTray = predictedYield / traysUsed;
        const benchmarkYield = model.baseYieldPerTray;

        let vsHistoricalAvg = 0;
        let vsLastBatch = 0;

        if (historicalData && historicalData.length > 0) {
            const avgHistorical = historicalData.reduce((sum, h) => sum + h.actualYield, 0) / historicalData.length;
            const avgTrays = historicalData.reduce((sum, h) => sum + 1, 0); // Simplified
            const avgYieldPerTray = avgHistorical / (avgTrays || 1);
            vsHistoricalAvg = ((yieldPerTray - avgYieldPerTray) / avgYieldPerTray) * 100;

            const lastBatch = historicalData[historicalData.length - 1];
            if (lastBatch) {
                vsLastBatch = ((yieldPerTray - (lastBatch.actualYield / 1)) / (lastBatch.actualYield / 1)) * 100;
            }
        }

        const vsBenchmark = ((yieldPerTray - benchmarkYield) / benchmarkYield) * 100;

        return {
            vsHistoricalAvg: Math.round(vsHistoricalAvg * 10) / 10,
            vsBenchmark: Math.round(vsBenchmark * 10) / 10,
            vsLastBatch: Math.round(vsLastBatch * 10) / 10
        };
    }

    private aggregateByCrop(predictions: YieldPrediction[]): CropYieldForecast[] {
        const cropMap = new Map<string, YieldPrediction[]>();

        predictions.forEach(p => {
            const existing = cropMap.get(p.cropType) || [];
            existing.push(p);
            cropMap.set(p.cropType, existing);
        });

        return Array.from(cropMap.entries()).map(([cropType, preds]) => {
            const totalYield = preds.reduce((sum, p) => sum + p.predictedYield, 0);
            const avgConfidence = preds.reduce((sum, p) => sum + p.confidence, 0) / preds.length;

            // Determine trend from comparisons
            const avgVsBenchmark = preds.reduce((sum, p) => sum + p.comparison.vsBenchmark, 0) / preds.length;
            const trend: 'up' | 'stable' | 'down' = avgVsBenchmark > 5 ? 'up' : avgVsBenchmark < -5 ? 'down' : 'stable';

            return {
                cropType,
                predictedYield: Math.round(totalYield * 10) / 10,
                activeBatches: preds.length,
                avgYieldPerBatch: Math.round((totalYield / preds.length) * 10) / 10,
                confidence: avgConfidence,
                trend
            };
        });
    }

    private aggregateByWeek(
        predictions: YieldPrediction[],
        start: Date,
        end: Date
    ): WeeklyYieldForecast[] {
        const weeks: WeeklyYieldForecast[] = [];
        const current = new Date(start);

        while (current < end) {
            const weekStart = new Date(current);
            const weekEnd = new Date(current);
            weekEnd.setDate(weekEnd.getDate() + 6);

            const weekPredictions = predictions.filter(p => {
                return p.harvestDate >= weekStart && p.harvestDate <= weekEnd;
            });

            if (weekPredictions.length > 0) {
                weeks.push({
                    weekStart: new Date(weekStart),
                    weekEnd: new Date(weekEnd),
                    predictedYield: Math.round(weekPredictions.reduce((sum, p) => sum + p.predictedYield, 0) * 10) / 10,
                    batchesHarvesting: weekPredictions.length,
                    crops: Array.from(new Set(weekPredictions.map(p => p.cropType))),
                    confidence: weekPredictions.reduce((sum, p) => sum + p.confidence, 0) / weekPredictions.length
                });
            }

            current.setDate(current.getDate() + 7);
        }

        return weeks;
    }

    private generatePlantingSchedule(
        batches: number,
        traysPerBatch: number,
        targetDate: Date,
        model: CropYieldModel
    ): PlantingScheduleItem[] {
        const schedule: PlantingScheduleItem[] = [];
        const daysToHarvest = model.daysToHarvest;

        // Stagger plantings to spread harvest
        const staggerDays = Math.max(1, Math.floor(7 / batches)); // Spread over a week

        for (let i = 0; i < batches; i++) {
            const harvestDate = new Date(targetDate);
            harvestDate.setDate(harvestDate.getDate() - (i * staggerDays));

            const plantingDate = new Date(harvestDate);
            plantingDate.setDate(plantingDate.getDate() - daysToHarvest);

            const seasonalMultiplier = this.getSeasonalMultiplier(model, harvestDate);
            const expectedYield = model.baseYieldPerTray * traysPerBatch * seasonalMultiplier;

            schedule.push({
                batchNumber: i + 1,
                plantingDate,
                expectedHarvestDate: harvestDate,
                trays: traysPerBatch,
                expectedYield: Math.round(expectedYield * 10) / 10
            });
        }

        return schedule.sort((a, b) => a.plantingDate.getTime() - b.plantingDate.getTime());
    }

    private getSeasonalMultiplier(model: CropYieldModel, date: Date): number {
        const month = date.getMonth();
        return model.seasonalFactors[month];
    }

    private identifyProductionRisks(
        input: ProductionPlanInput,
        model: CropYieldModel,
        schedule: PlantingScheduleItem[]
    ): string[] {
        const risks: string[] = [];

        // Seasonal risk
        const harvestMonth = input.targetDate.getMonth();
        if (model.seasonalFactors[harvestMonth] < 0.9) {
            risks.push(`Seasonal conditions in ${input.targetDate.toLocaleString('default', { month: 'long' })} may reduce yields by ${((1 - model.seasonalFactors[harvestMonth]) * 100).toFixed(0)}%`);
        }

        // Tight timeline risk
        const firstPlanting = schedule[0]?.plantingDate;
        if (firstPlanting && firstPlanting < new Date()) {
            risks.push('Some plantings would need to start immediately or in the past - timeline is very tight');
        }

        // Capacity risk
        const totalTrays = schedule.reduce((sum, s) => sum + s.trays, 0);
        if (input.constraints?.availableSpace && totalTrays > input.constraints.availableSpace) {
            risks.push(`Required ${totalTrays} trays exceeds available space of ${input.constraints.availableSpace}`);
        }

        // Single point of failure
        if (schedule.length === 1) {
            risks.push('Single batch production increases risk - consider splitting into multiple batches');
        }

        return risks;
    }

    private async generateForecastRecommendations(
        byCrop: CropYieldForecast[],
        byWeek: WeeklyYieldForecast[]
    ): Promise<string[]> {
        const recommendations: string[] = [];

        // Identify low-performing crops
        const lowPerformers = byCrop.filter(c => c.trend === 'down');
        if (lowPerformers.length > 0) {
            recommendations.push(`Review conditions for ${lowPerformers.map(c => c.cropType).join(', ')} - yields trending below average`);
        }

        // Identify high-yield weeks
        const highYieldWeeks = byWeek.filter(w => w.batchesHarvesting > 3);
        if (highYieldWeeks.length > 0) {
            recommendations.push('Multiple high-volume harvest weeks ahead - ensure adequate labor and storage');
        }

        // Low confidence predictions
        const lowConfidence = byCrop.filter(c => c.confidence < 0.7);
        if (lowConfidence.length > 0) {
            recommendations.push(`Increase monitoring for ${lowConfidence.map(c => c.cropType).join(', ')} to improve prediction accuracy`);
        }

        return recommendations;
    }

    private async generatePlanRecommendations(
        input: ProductionPlanInput,
        model: CropYieldModel,
        schedule: PlantingScheduleItem[]
    ): Promise<string[]> {
        const recommendations: string[] = [];

        recommendations.push(`Start planting ${schedule[0]?.plantingDate.toLocaleDateString()} for ${input.cropType}`);

        if (schedule.length > 1) {
            recommendations.push(`Stagger ${schedule.length} batches to reduce harvest bottlenecks`);
        }

        const totalTrays = schedule.reduce((sum, s) => sum + s.trays, 0);
        recommendations.push(`Total production: ${totalTrays} trays across ${schedule.length} batch(es)`);

        // Seasonal advice
        const month = input.targetDate.getMonth();
        if (model.seasonalFactors[month] >= 1.0) {
            recommendations.push('Favorable seasonal conditions - good timing for this crop');
        } else {
            recommendations.push('Consider environmental controls to offset seasonal challenges');
        }

        return recommendations;
    }

    private getDefaultModel(): CropYieldModel {
        return {
            cropType: 'Default',
            baseYieldPerTray: 7.0,
            yieldUnit: 'oz',
            daysToHarvest: 10,
            yieldVariance: 0.15,
            temperatureSensitivity: 0.7,
            humiditySensitivity: 0.6,
            lightSensitivity: 0.7,
            seasonalFactors: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        };
    }
}

interface CropYieldModel {
    cropType: string;
    baseYieldPerTray: number;
    yieldUnit: string;
    daysToHarvest: number;
    yieldVariance: number;
    temperatureSensitivity: number;
    humiditySensitivity: number;
    lightSensitivity: number;
    seasonalFactors: number[];
}

export const yieldPredictionAI = new YieldPredictionAI();
