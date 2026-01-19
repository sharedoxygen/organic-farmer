/**
 * Batch-Level AI Scoring Service
 * Provides individual batch health scoring, predictions, and anomaly detection
 */

import { ollamaService } from './ollamaService';
import { weatherService } from './weatherService';

export interface BatchScore {
    batchId: string;
    batchNumber: string;
    overallScore: number; // 0-100
    healthScore: number;
    growthScore: number;
    environmentScore: number;
    riskScore: number; // Lower is better
    qualityPrediction: 'A' | 'B' | 'C' | 'D';
    trend: 'improving' | 'stable' | 'declining';
    lastUpdated: Date;
}

export interface BatchHealthMetrics {
    batchId: string;
    temperature: number;
    humidity: number;
    lightHours: number;
    daysInGrowth: number;
    expectedDaysTotal: number;
    germinationRate?: number;
    visualHealth?: number;
    pestPressure: number; // 0-10
    diseaseRisk: number; // 0-10
}

export interface BatchPrediction {
    batchId: string;
    predictedYield: number;
    yieldConfidence: number;
    predictedQualityGrade: string;
    qualityConfidence: number;
    predictedHarvestDate: Date;
    harvestDateConfidence: number;
    riskFactors: RiskFactor[];
    opportunities: string[];
}

export interface RiskFactor {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    mitigation: string;
    probability: number;
}

export interface BatchComparison {
    batchId: string;
    batchNumber: string;
    cropType: string;
    score: number;
    vsAverage: number; // Percentage above/below average
    rank: number;
    totalBatches: number;
    strengths: string[];
    weaknesses: string[];
}

export interface BatchAnomaly {
    batchId: string;
    type: 'GROWTH_RATE' | 'TEMPERATURE' | 'HUMIDITY' | 'YIELD' | 'QUALITY';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    expectedValue: number;
    actualValue: number;
    deviation: number; // Standard deviations from mean
    detectedAt: Date;
    recommendation: string;
}

export interface CropBenchmarks {
    cropType: string;
    avgGerminationRate: number;
    avgYieldPerTray: number;
    avgDaysToHarvest: number;
    optimalTemp: { min: number; max: number };
    optimalHumidity: { min: number; max: number };
    optimalLightHours: number;
    qualityDistribution: { A: number; B: number; C: number; D: number };
}

export class BatchScoringAI {
    private benchmarks: Map<string, CropBenchmarks> = new Map();

    constructor() {
        this.initializeBenchmarks();
    }

    private initializeBenchmarks(): void {
        const crops: CropBenchmarks[] = [
            {
                cropType: 'Arugula',
                avgGerminationRate: 0.92,
                avgYieldPerTray: 8.5,
                avgDaysToHarvest: 10,
                optimalTemp: { min: 60, max: 70 },
                optimalHumidity: { min: 55, max: 70 },
                optimalLightHours: 12,
                qualityDistribution: { A: 0.65, B: 0.25, C: 0.08, D: 0.02 }
            },
            {
                cropType: 'Basil',
                avgGerminationRate: 0.88,
                avgYieldPerTray: 6.0,
                avgDaysToHarvest: 14,
                optimalTemp: { min: 70, max: 80 },
                optimalHumidity: { min: 50, max: 60 },
                optimalLightHours: 14,
                qualityDistribution: { A: 0.60, B: 0.28, C: 0.10, D: 0.02 }
            },
            {
                cropType: 'Kale',
                avgGerminationRate: 0.90,
                avgYieldPerTray: 7.0,
                avgDaysToHarvest: 12,
                optimalTemp: { min: 55, max: 65 },
                optimalHumidity: { min: 60, max: 75 },
                optimalLightHours: 10,
                qualityDistribution: { A: 0.70, B: 0.22, C: 0.06, D: 0.02 }
            },
            {
                cropType: 'Pea Shoots',
                avgGerminationRate: 0.95,
                avgYieldPerTray: 10.0,
                avgDaysToHarvest: 8,
                optimalTemp: { min: 60, max: 70 },
                optimalHumidity: { min: 55, max: 65 },
                optimalLightHours: 12,
                qualityDistribution: { A: 0.72, B: 0.20, C: 0.06, D: 0.02 }
            },
            {
                cropType: 'Sunflower',
                avgGerminationRate: 0.93,
                avgYieldPerTray: 9.0,
                avgDaysToHarvest: 10,
                optimalTemp: { min: 65, max: 75 },
                optimalHumidity: { min: 50, max: 65 },
                optimalLightHours: 14,
                qualityDistribution: { A: 0.68, B: 0.24, C: 0.06, D: 0.02 }
            },
            {
                cropType: 'Radish',
                avgGerminationRate: 0.94,
                avgYieldPerTray: 7.5,
                avgDaysToHarvest: 6,
                optimalTemp: { min: 55, max: 65 },
                optimalHumidity: { min: 55, max: 70 },
                optimalLightHours: 10,
                qualityDistribution: { A: 0.75, B: 0.18, C: 0.05, D: 0.02 }
            }
        ];

        crops.forEach(crop => this.benchmarks.set(crop.cropType, crop));
    }

    /**
     * Calculate comprehensive batch score
     */
    async calculateBatchScore(
        batchId: string,
        batchNumber: string,
        cropType: string,
        metrics: BatchHealthMetrics,
        historicalScores?: number[]
    ): Promise<BatchScore> {
        const benchmark = this.benchmarks.get(cropType) || this.getDefaultBenchmark();

        // Calculate individual scores
        const healthScore = this.calculateHealthScore(metrics, benchmark);
        const growthScore = this.calculateGrowthScore(metrics, benchmark);
        const environmentScore = this.calculateEnvironmentScore(metrics, benchmark);
        const riskScore = this.calculateRiskScore(metrics, benchmark);

        // Weighted overall score
        const overallScore = Math.round(
            (healthScore * 0.35) +
            (growthScore * 0.25) +
            (environmentScore * 0.25) +
            ((100 - riskScore) * 0.15)
        );

        // Determine quality prediction
        const qualityPrediction = this.predictQualityGrade(overallScore);

        // Determine trend
        const trend = this.calculateTrend(overallScore, historicalScores);

        return {
            batchId,
            batchNumber,
            overallScore,
            healthScore,
            growthScore,
            environmentScore,
            riskScore,
            qualityPrediction,
            trend,
            lastUpdated: new Date()
        };
    }

    /**
     * Calculate health score based on visual and environmental factors
     */
    private calculateHealthScore(metrics: BatchHealthMetrics, benchmark: CropBenchmarks): number {
        let score = 100;

        // Visual health impact
        if (metrics.visualHealth !== undefined) {
            score = Math.min(score, metrics.visualHealth);
        }

        // Pest pressure impact (0-10 scale, 10 is worst)
        score -= metrics.pestPressure * 5;

        // Disease risk impact (0-10 scale, 10 is worst)
        score -= metrics.diseaseRisk * 5;

        // Germination rate impact
        if (metrics.germinationRate !== undefined) {
            const germDiff = benchmark.avgGerminationRate - metrics.germinationRate;
            score -= germDiff * 50; // 10% below average = -5 points
        }

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * Calculate growth score based on progress
     */
    private calculateGrowthScore(metrics: BatchHealthMetrics, benchmark: CropBenchmarks): number {
        const expectedProgress = metrics.daysInGrowth / metrics.expectedDaysTotal;
        const actualProgress = metrics.daysInGrowth / benchmark.avgDaysToHarvest;

        // On track = 100, ahead = bonus, behind = penalty
        let score = 100;

        if (actualProgress < expectedProgress * 0.9) {
            // Behind schedule
            score -= (expectedProgress - actualProgress) * 100;
        } else if (actualProgress > expectedProgress * 1.1) {
            // Ahead of schedule (slight bonus)
            score = Math.min(100, score + 5);
        }

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * Calculate environment score
     */
    private calculateEnvironmentScore(metrics: BatchHealthMetrics, benchmark: CropBenchmarks): number {
        let score = 100;

        // Temperature scoring
        if (metrics.temperature < benchmark.optimalTemp.min) {
            score -= (benchmark.optimalTemp.min - metrics.temperature) * 3;
        } else if (metrics.temperature > benchmark.optimalTemp.max) {
            score -= (metrics.temperature - benchmark.optimalTemp.max) * 3;
        }

        // Humidity scoring
        if (metrics.humidity < benchmark.optimalHumidity.min) {
            score -= (benchmark.optimalHumidity.min - metrics.humidity) * 2;
        } else if (metrics.humidity > benchmark.optimalHumidity.max) {
            score -= (metrics.humidity - benchmark.optimalHumidity.max) * 2;
        }

        // Light hours scoring
        const lightDiff = Math.abs(metrics.lightHours - benchmark.optimalLightHours);
        score -= lightDiff * 3;

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * Calculate risk score (lower is better)
     */
    private calculateRiskScore(metrics: BatchHealthMetrics, benchmark: CropBenchmarks): number {
        let risk = 0;

        // Pest and disease risk
        risk += metrics.pestPressure * 3;
        risk += metrics.diseaseRisk * 4;

        // Environmental stress risk
        if (metrics.temperature < benchmark.optimalTemp.min - 10 ||
            metrics.temperature > benchmark.optimalTemp.max + 10) {
            risk += 20;
        }

        if (metrics.humidity < benchmark.optimalHumidity.min - 15 ||
            metrics.humidity > benchmark.optimalHumidity.max + 15) {
            risk += 15;
        }

        // Late stage risk (closer to harvest = higher stakes)
        const progressRatio = metrics.daysInGrowth / metrics.expectedDaysTotal;
        if (progressRatio > 0.8) {
            risk += 10; // Higher risk near harvest
        }

        return Math.min(100, Math.round(risk));
    }

    /**
     * Predict quality grade based on score
     */
    private predictQualityGrade(score: number): 'A' | 'B' | 'C' | 'D' {
        if (score >= 85) return 'A';
        if (score >= 70) return 'B';
        if (score >= 55) return 'C';
        return 'D';
    }

    /**
     * Calculate trend from historical scores
     */
    private calculateTrend(currentScore: number, historicalScores?: number[]): 'improving' | 'stable' | 'declining' {
        if (!historicalScores || historicalScores.length < 2) return 'stable';

        const recentAvg = historicalScores.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, historicalScores.length);
        const diff = currentScore - recentAvg;

        if (diff > 5) return 'improving';
        if (diff < -5) return 'declining';
        return 'stable';
    }

    /**
     * Generate batch predictions
     */
    async generateBatchPrediction(
        batchId: string,
        cropType: string,
        metrics: BatchHealthMetrics,
        score: BatchScore
    ): Promise<BatchPrediction> {
        const benchmark = this.benchmarks.get(cropType) || this.getDefaultBenchmark();

        // Predict yield
        const baseYield = benchmark.avgYieldPerTray;
        const yieldMultiplier = score.overallScore / 100;
        const predictedYield = Math.round(baseYield * yieldMultiplier * 10) / 10;
        const yieldConfidence = Math.min(0.95, 0.7 + (score.overallScore / 500));

        // Predict quality
        const qualityConfidence = Math.min(0.95, 0.75 + (score.overallScore / 400));

        // Predict harvest date
        const remainingDays = metrics.expectedDaysTotal - metrics.daysInGrowth;
        const adjustedDays = remainingDays * (score.growthScore >= 90 ? 0.9 : score.growthScore >= 70 ? 1.0 : 1.1);
        const predictedHarvestDate = new Date();
        predictedHarvestDate.setDate(predictedHarvestDate.getDate() + Math.round(adjustedDays));

        // Identify risk factors
        const riskFactors = this.identifyRiskFactors(metrics, benchmark, score);

        // Identify opportunities
        const opportunities = this.identifyOpportunities(metrics, benchmark, score);

        return {
            batchId,
            predictedYield,
            yieldConfidence,
            predictedQualityGrade: score.qualityPrediction,
            qualityConfidence,
            predictedHarvestDate,
            harvestDateConfidence: 0.85,
            riskFactors,
            opportunities
        };
    }

    /**
     * Identify risk factors for a batch
     */
    private identifyRiskFactors(
        metrics: BatchHealthMetrics,
        benchmark: CropBenchmarks,
        score: BatchScore
    ): RiskFactor[] {
        const risks: RiskFactor[] = [];

        if (metrics.pestPressure > 3) {
            risks.push({
                type: 'PEST_PRESSURE',
                severity: metrics.pestPressure > 6 ? 'HIGH' : 'MEDIUM',
                description: `Elevated pest pressure detected (${metrics.pestPressure}/10)`,
                mitigation: 'Apply organic pest control measures and increase monitoring',
                probability: metrics.pestPressure / 10
            });
        }

        if (metrics.diseaseRisk > 3) {
            risks.push({
                type: 'DISEASE_RISK',
                severity: metrics.diseaseRisk > 6 ? 'HIGH' : 'MEDIUM',
                description: `Elevated disease risk (${metrics.diseaseRisk}/10)`,
                mitigation: 'Improve air circulation and apply preventive organic fungicide',
                probability: metrics.diseaseRisk / 10
            });
        }

        if (metrics.temperature < benchmark.optimalTemp.min - 5) {
            risks.push({
                type: 'COLD_STRESS',
                severity: metrics.temperature < benchmark.optimalTemp.min - 10 ? 'HIGH' : 'MEDIUM',
                description: `Temperature ${metrics.temperature}°F below optimal range`,
                mitigation: 'Increase heating or move to warmer zone',
                probability: 0.7
            });
        }

        if (metrics.temperature > benchmark.optimalTemp.max + 5) {
            risks.push({
                type: 'HEAT_STRESS',
                severity: metrics.temperature > benchmark.optimalTemp.max + 10 ? 'HIGH' : 'MEDIUM',
                description: `Temperature ${metrics.temperature}°F above optimal range`,
                mitigation: 'Increase ventilation, add shade cloth, or increase watering',
                probability: 0.7
            });
        }

        if (score.riskScore > 50) {
            risks.push({
                type: 'OVERALL_RISK',
                severity: score.riskScore > 70 ? 'HIGH' : 'MEDIUM',
                description: 'Multiple risk factors affecting batch health',
                mitigation: 'Conduct comprehensive batch review and address individual issues',
                probability: score.riskScore / 100
            });
        }

        return risks;
    }

    /**
     * Identify opportunities for a batch
     */
    private identifyOpportunities(
        metrics: BatchHealthMetrics,
        benchmark: CropBenchmarks,
        score: BatchScore
    ): string[] {
        const opportunities: string[] = [];

        if (score.overallScore >= 90) {
            opportunities.push('Excellent batch performance - consider for premium market positioning');
        }

        if (score.growthScore >= 95) {
            opportunities.push('Ahead of schedule - early harvest possible for market timing');
        }

        if (score.environmentScore >= 95) {
            opportunities.push('Optimal growing conditions - maximize by extending light hours');
        }

        if (score.trend === 'improving') {
            opportunities.push('Positive trend - current management practices are effective');
        }

        if (metrics.pestPressure === 0 && metrics.diseaseRisk === 0) {
            opportunities.push('Clean batch - ideal candidate for organic certification documentation');
        }

        return opportunities;
    }

    /**
     * Detect anomalies in batch performance
     */
    detectAnomalies(
        batchId: string,
        cropType: string,
        metrics: BatchHealthMetrics,
        historicalData: BatchHealthMetrics[]
    ): BatchAnomaly[] {
        const anomalies: BatchAnomaly[] = [];
        const benchmark = this.benchmarks.get(cropType) || this.getDefaultBenchmark();

        // Calculate historical averages
        const avgTemp = this.calculateMean(historicalData.map(h => h.temperature));
        const avgHumidity = this.calculateMean(historicalData.map(h => h.humidity));
        const tempStdDev = this.calculateStdDev(historicalData.map(h => h.temperature));
        const humidityStdDev = this.calculateStdDev(historicalData.map(h => h.humidity));

        // Temperature anomaly
        if (tempStdDev > 0) {
            const tempDeviation = Math.abs(metrics.temperature - avgTemp) / tempStdDev;
            if (tempDeviation > 2) {
                anomalies.push({
                    batchId,
                    type: 'TEMPERATURE',
                    severity: tempDeviation > 3 ? 'HIGH' : 'MEDIUM',
                    description: `Temperature ${metrics.temperature}°F is ${tempDeviation.toFixed(1)} standard deviations from average`,
                    expectedValue: avgTemp,
                    actualValue: metrics.temperature,
                    deviation: tempDeviation,
                    detectedAt: new Date(),
                    recommendation: metrics.temperature > avgTemp
                        ? 'Investigate heat source or ventilation issues'
                        : 'Check heating system or cold drafts'
                });
            }
        }

        // Humidity anomaly
        if (humidityStdDev > 0) {
            const humidityDeviation = Math.abs(metrics.humidity - avgHumidity) / humidityStdDev;
            if (humidityDeviation > 2) {
                anomalies.push({
                    batchId,
                    type: 'HUMIDITY',
                    severity: humidityDeviation > 3 ? 'HIGH' : 'MEDIUM',
                    description: `Humidity ${metrics.humidity}% is ${humidityDeviation.toFixed(1)} standard deviations from average`,
                    expectedValue: avgHumidity,
                    actualValue: metrics.humidity,
                    deviation: humidityDeviation,
                    detectedAt: new Date(),
                    recommendation: metrics.humidity > avgHumidity
                        ? 'Increase ventilation or reduce watering'
                        : 'Add humidity or check for air leaks'
                });
            }
        }

        // Growth rate anomaly
        const expectedProgress = metrics.daysInGrowth / benchmark.avgDaysToHarvest;
        if (expectedProgress > 1.2 || expectedProgress < 0.8) {
            anomalies.push({
                batchId,
                type: 'GROWTH_RATE',
                severity: Math.abs(expectedProgress - 1) > 0.3 ? 'HIGH' : 'MEDIUM',
                description: expectedProgress > 1
                    ? 'Growth significantly slower than expected'
                    : 'Growth significantly faster than expected',
                expectedValue: benchmark.avgDaysToHarvest,
                actualValue: metrics.daysInGrowth,
                deviation: Math.abs(expectedProgress - 1) * 3,
                detectedAt: new Date(),
                recommendation: expectedProgress > 1
                    ? 'Review environmental conditions and nutrient levels'
                    : 'Monitor for premature bolting or quality issues'
            });
        }

        return anomalies;
    }

    /**
     * Compare batches and rank them
     */
    compareBatches(batches: Array<{ batchId: string; batchNumber: string; cropType: string; score: BatchScore }>): BatchComparison[] {
        // Calculate average score
        const avgScore = batches.reduce((sum, b) => sum + b.score.overallScore, 0) / batches.length;

        // Sort by score
        const sorted = [...batches].sort((a, b) => b.score.overallScore - a.score.overallScore);

        return sorted.map((batch, index) => {
            const vsAverage = ((batch.score.overallScore - avgScore) / avgScore) * 100;

            const strengths: string[] = [];
            const weaknesses: string[] = [];

            if (batch.score.healthScore >= 90) strengths.push('Excellent health');
            if (batch.score.growthScore >= 90) strengths.push('Strong growth');
            if (batch.score.environmentScore >= 90) strengths.push('Optimal environment');
            if (batch.score.riskScore <= 20) strengths.push('Low risk');

            if (batch.score.healthScore < 70) weaknesses.push('Health concerns');
            if (batch.score.growthScore < 70) weaknesses.push('Growth issues');
            if (batch.score.environmentScore < 70) weaknesses.push('Environmental stress');
            if (batch.score.riskScore > 50) weaknesses.push('Elevated risk');

            return {
                batchId: batch.batchId,
                batchNumber: batch.batchNumber,
                cropType: batch.cropType,
                score: batch.score.overallScore,
                vsAverage: Math.round(vsAverage * 10) / 10,
                rank: index + 1,
                totalBatches: batches.length,
                strengths,
                weaknesses
            };
        });
    }

    /**
     * Get AI-enhanced batch analysis
     */
    async getAIBatchAnalysis(
        batchId: string,
        cropType: string,
        score: BatchScore,
        prediction: BatchPrediction
    ): Promise<string> {
        try {
            const prompt = `Analyze this crop batch and provide actionable insights:

Batch: ${score.batchNumber}
Crop: ${cropType}
Overall Score: ${score.overallScore}/100
Health: ${score.healthScore}/100
Growth: ${score.growthScore}/100
Environment: ${score.environmentScore}/100
Risk Level: ${score.riskScore}/100
Quality Prediction: Grade ${score.qualityPrediction}
Trend: ${score.trend}
Predicted Yield: ${prediction.predictedYield} oz/tray
Risk Factors: ${prediction.riskFactors.map(r => r.type).join(', ') || 'None'}

Provide 3-4 specific, actionable recommendations for optimizing this batch. Be concise.`;

            const response = await ollamaService.generateAdvancedAnalysis(prompt, 'reasoning');
            return response.trim();
        } catch (error) {
            console.error('❌ AI batch analysis error:', error);
            return this.generateFallbackAnalysis(score, prediction);
        }
    }

    private generateFallbackAnalysis(score: BatchScore, prediction: BatchPrediction): string {
        const insights: string[] = [];

        if (score.overallScore >= 85) {
            insights.push('Batch is performing excellently. Maintain current conditions.');
        } else if (score.overallScore >= 70) {
            insights.push('Batch is on track. Minor optimizations could improve yield.');
        } else {
            insights.push('Batch needs attention. Review environmental conditions and health factors.');
        }

        if (prediction.riskFactors.length > 0) {
            insights.push(`Address ${prediction.riskFactors.length} identified risk factor(s) to protect yield.`);
        }

        if (score.trend === 'declining') {
            insights.push('Trend is declining - investigate recent changes in conditions.');
        }

        return insights.join(' ');
    }

    private getDefaultBenchmark(): CropBenchmarks {
        return {
            cropType: 'Default',
            avgGerminationRate: 0.90,
            avgYieldPerTray: 7.0,
            avgDaysToHarvest: 10,
            optimalTemp: { min: 60, max: 75 },
            optimalHumidity: { min: 55, max: 70 },
            optimalLightHours: 12,
            qualityDistribution: { A: 0.65, B: 0.25, C: 0.08, D: 0.02 }
        };
    }

    private calculateMean(values: number[]): number {
        if (values.length === 0) return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    private calculateStdDev(values: number[]): number {
        if (values.length < 2) return 0;
        const mean = this.calculateMean(values);
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return Math.sqrt(this.calculateMean(squaredDiffs));
    }
}

export const batchScoringAI = new BatchScoringAI();
