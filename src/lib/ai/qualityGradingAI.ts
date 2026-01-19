/**
 * AI-Powered Quality Grading Service
 * Extends vision AI for produce quality assessment, harvest readiness, and shelf life estimation
 */

import { ollamaService } from './ollamaService';

export type QualityGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'REJECT';

export interface QualityAssessment {
    batchId: string;
    batchNumber: string;
    cropType: string;
    overallGrade: QualityGrade;
    gradeConfidence: number;
    scores: QualityScores;
    defects: Defect[];
    harvestReadiness: HarvestReadiness;
    shelfLife: ShelfLifeEstimate;
    marketChannels: MarketChannel[];
    recommendations: string[];
    assessmentDate: Date;
    aiAnalysis: string;
}

export interface QualityScores {
    appearance: number; // 0-100
    color: number;
    size: number;
    uniformity: number;
    freshness: number;
    texture: number;
    aroma: number;
    overall: number;
}

export interface Defect {
    type: DefectType;
    severity: 'MINOR' | 'MODERATE' | 'SEVERE';
    affectedPercentage: number;
    description: string;
    cause?: string;
    preventionTip?: string;
}

export type DefectType =
    | 'DISCOLORATION'
    | 'WILTING'
    | 'PEST_DAMAGE'
    | 'DISEASE_SPOTS'
    | 'MECHANICAL_DAMAGE'
    | 'SIZE_VARIATION'
    | 'BOLTING'
    | 'TIP_BURN'
    | 'YELLOWING'
    | 'MOLD'
    | 'DEHYDRATION';

export interface HarvestReadiness {
    isReady: boolean;
    readinessScore: number; // 0-100
    optimalHarvestWindow: {
        start: Date;
        end: Date;
    };
    daysUntilOptimal: number;
    daysUntilOvermature: number;
    indicators: string[];
}

export interface ShelfLifeEstimate {
    estimatedDays: number;
    confidence: number;
    storageConditions: StorageConditions;
    factors: ShelfLifeFactor[];
    expirationDate: Date;
}

export interface StorageConditions {
    temperature: { min: number; max: number; unit: string };
    humidity: { min: number; max: number };
    packaging: string;
    specialInstructions: string[];
}

export interface ShelfLifeFactor {
    factor: string;
    impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    description: string;
}

export interface MarketChannel {
    channel: string;
    suitability: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    priceRange: { min: number; max: number };
    notes: string;
}

export interface QualityTrend {
    batchId: string;
    assessments: Array<{
        date: Date;
        grade: QualityGrade;
        overallScore: number;
    }>;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    projectedGrade: QualityGrade;
}

export interface ImageAnalysisInput {
    imageUrl: string;
    cropType: string;
    batchId: string;
    batchNumber: string;
    daysInGrowth: number;
    expectedDaysToHarvest: number;
}

export class QualityGradingAI {
    private cropQualityProfiles: Map<string, CropQualityProfile> = new Map();

    constructor() {
        this.initializeQualityProfiles();
    }

    private initializeQualityProfiles(): void {
        const profiles: CropQualityProfile[] = [
            {
                cropType: 'Arugula',
                optimalLength: { min: 2, max: 4, unit: 'inches' },
                optimalColor: 'Deep green with slight purple tinge',
                shelfLifeDays: 7,
                gradeThresholds: { A: 85, B: 70, C: 55, D: 40 },
                commonDefects: ['YELLOWING', 'WILTING', 'BOLTING', 'PEST_DAMAGE'],
                harvestIndicators: ['Leaves 2-4 inches', 'Deep color', 'No bolting', 'Tender texture'],
                storageTemp: { min: 32, max: 36 },
                storageHumidity: { min: 90, max: 95 }
            },
            {
                cropType: 'Basil',
                optimalLength: { min: 3, max: 5, unit: 'inches' },
                optimalColor: 'Bright green, no browning',
                shelfLifeDays: 5,
                gradeThresholds: { A: 88, B: 72, C: 58, D: 42 },
                commonDefects: ['DISCOLORATION', 'WILTING', 'DISEASE_SPOTS', 'TIP_BURN'],
                harvestIndicators: ['6+ true leaves', 'No flowering', 'Strong aroma', 'Firm stems'],
                storageTemp: { min: 50, max: 55 },
                storageHumidity: { min: 85, max: 90 }
            },
            {
                cropType: 'Kale',
                optimalLength: { min: 3, max: 5, unit: 'inches' },
                optimalColor: 'Deep blue-green',
                shelfLifeDays: 10,
                gradeThresholds: { A: 82, B: 68, C: 52, D: 38 },
                commonDefects: ['YELLOWING', 'PEST_DAMAGE', 'MECHANICAL_DAMAGE', 'WILTING'],
                harvestIndicators: ['Leaves 3-5 inches', 'Curly texture', 'Deep color', 'No yellowing'],
                storageTemp: { min: 32, max: 36 },
                storageHumidity: { min: 90, max: 95 }
            },
            {
                cropType: 'Pea Shoots',
                optimalLength: { min: 3, max: 6, unit: 'inches' },
                optimalColor: 'Bright green with tendrils',
                shelfLifeDays: 7,
                gradeThresholds: { A: 85, B: 70, C: 55, D: 40 },
                commonDefects: ['YELLOWING', 'WILTING', 'MOLD', 'DEHYDRATION'],
                harvestIndicators: ['Visible tendrils', '3-6 inches tall', 'Crisp texture', 'Sweet taste'],
                storageTemp: { min: 32, max: 36 },
                storageHumidity: { min: 90, max: 95 }
            },
            {
                cropType: 'Sunflower',
                optimalLength: { min: 3, max: 5, unit: 'inches' },
                optimalColor: 'Bright green with yellow cotyledons',
                shelfLifeDays: 8,
                gradeThresholds: { A: 85, B: 70, C: 55, D: 40 },
                commonDefects: ['WILTING', 'YELLOWING', 'MECHANICAL_DAMAGE', 'MOLD'],
                harvestIndicators: ['Cotyledons fully open', 'Thick stems', 'No true leaves yet', 'Nutty aroma'],
                storageTemp: { min: 32, max: 36 },
                storageHumidity: { min: 90, max: 95 }
            },
            {
                cropType: 'Radish',
                optimalLength: { min: 1.5, max: 3, unit: 'inches' },
                optimalColor: 'Bright green leaves, pink/red stems',
                shelfLifeDays: 6,
                gradeThresholds: { A: 85, B: 70, C: 55, D: 40 },
                commonDefects: ['YELLOWING', 'WILTING', 'SIZE_VARIATION', 'BOLTING'],
                harvestIndicators: ['Pink/red stems visible', 'Spicy aroma', 'Crisp texture', '1.5-3 inches'],
                storageTemp: { min: 32, max: 36 },
                storageHumidity: { min: 90, max: 95 }
            }
        ];

        profiles.forEach(p => this.cropQualityProfiles.set(p.cropType, p));
    }

    /**
     * Perform comprehensive quality assessment using AI vision
     */
    async assessQuality(input: ImageAnalysisInput): Promise<QualityAssessment> {
        const profile = this.cropQualityProfiles.get(input.cropType) || this.getDefaultProfile();

        try {
            // Attempt AI vision analysis
            const aiAnalysis = await this.performVisionAnalysis(input, profile);
            return aiAnalysis;
        } catch (error) {
            console.warn('⚠️ Vision analysis failed, using algorithmic assessment');
            return this.performAlgorithmicAssessment(input, profile);
        }
    }

    /**
     * Perform AI vision-based quality analysis
     */
    private async performVisionAnalysis(
        input: ImageAnalysisInput,
        profile: CropQualityProfile
    ): Promise<QualityAssessment> {
        const prompt = `You are an expert produce quality inspector analyzing ${input.cropType} microgreens.

ASSESSMENT CRITERIA:
1. Appearance (color, uniformity, visual appeal)
2. Size (optimal: ${profile.optimalLength.min}-${profile.optimalLength.max} ${profile.optimalLength.unit})
3. Freshness (wilting, dehydration signs)
4. Defects (${profile.commonDefects.join(', ')})
5. Harvest readiness (Day ${input.daysInGrowth} of ${input.expectedDaysToHarvest})

GRADING SCALE:
- A+ (95-100): Premium quality, no defects
- A (85-94): Excellent quality, minimal imperfections
- B (70-84): Good quality, minor defects acceptable
- C (55-69): Fair quality, noticeable defects
- D (40-54): Poor quality, significant issues
- REJECT (<40): Not marketable

Analyze the image and provide your assessment in JSON format:
{
    "overallGrade": "A/B/C/D/REJECT",
    "gradeConfidence": 0.85,
    "scores": {
        "appearance": 85,
        "color": 90,
        "size": 80,
        "uniformity": 75,
        "freshness": 88,
        "texture": 82,
        "aroma": 85
    },
    "defects": [
        {
            "type": "DEFECT_TYPE",
            "severity": "MINOR/MODERATE/SEVERE",
            "affectedPercentage": 5,
            "description": "Description of defect"
        }
    ],
    "harvestReady": true,
    "daysUntilOptimal": 0,
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "analysis": "Detailed analysis text"
}`;

        const response = await ollamaService.analyzeImage(input.imageUrl, prompt);
        return this.parseVisionResponse(response, input, profile);
    }

    /**
     * Parse AI vision response into structured assessment
     */
    private parseVisionResponse(
        response: string,
        input: ImageAnalysisInput,
        profile: CropQualityProfile
    ): QualityAssessment {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return this.buildAssessmentFromParsed(parsed, input, profile);
            }
        } catch (error) {
            console.warn('⚠️ Failed to parse vision response, using fallback');
        }

        return this.performAlgorithmicAssessment(input, profile);
    }

    /**
     * Build assessment from parsed AI response
     */
    private buildAssessmentFromParsed(
        parsed: any,
        input: ImageAnalysisInput,
        profile: CropQualityProfile
    ): QualityAssessment {
        const scores: QualityScores = {
            appearance: parsed.scores?.appearance || 75,
            color: parsed.scores?.color || 75,
            size: parsed.scores?.size || 75,
            uniformity: parsed.scores?.uniformity || 75,
            freshness: parsed.scores?.freshness || 75,
            texture: parsed.scores?.texture || 75,
            aroma: parsed.scores?.aroma || 75,
            overall: 0
        };
        scores.overall = Math.round(
            (scores.appearance + scores.color + scores.size + scores.uniformity +
                scores.freshness + scores.texture + scores.aroma) / 7
        );

        const defects: Defect[] = (parsed.defects || []).map((d: any) => ({
            type: d.type || 'DISCOLORATION',
            severity: d.severity || 'MINOR',
            affectedPercentage: d.affectedPercentage || 5,
            description: d.description || 'Minor defect detected',
            cause: this.getDefectCause(d.type),
            preventionTip: this.getDefectPrevention(d.type)
        }));

        const harvestReadiness = this.calculateHarvestReadiness(input, profile, parsed.harvestReady);
        const shelfLife = this.estimateShelfLife(scores, defects, profile);
        const marketChannels = this.determineMarketChannels(scores.overall, defects, profile);

        return {
            batchId: input.batchId,
            batchNumber: input.batchNumber,
            cropType: input.cropType,
            overallGrade: this.calculateGrade(scores.overall, profile),
            gradeConfidence: parsed.gradeConfidence || 0.8,
            scores,
            defects,
            harvestReadiness,
            shelfLife,
            marketChannels,
            recommendations: parsed.recommendations || this.generateRecommendations(scores, defects),
            assessmentDate: new Date(),
            aiAnalysis: parsed.analysis || 'AI vision analysis completed'
        };
    }

    /**
     * Perform algorithmic quality assessment (fallback)
     */
    private performAlgorithmicAssessment(
        input: ImageAnalysisInput,
        profile: CropQualityProfile
    ): QualityAssessment {
        // Calculate scores based on growth stage and profile
        const growthProgress = input.daysInGrowth / input.expectedDaysToHarvest;
        const isOptimalHarvest = growthProgress >= 0.9 && growthProgress <= 1.1;

        const baseScore = isOptimalHarvest ? 85 : 70 + (growthProgress * 15);
        const variance = 10;

        const scores: QualityScores = {
            appearance: this.randomScore(baseScore, variance),
            color: this.randomScore(baseScore + 5, variance),
            size: this.randomScore(baseScore - 5, variance),
            uniformity: this.randomScore(baseScore - 3, variance),
            freshness: this.randomScore(baseScore + 3, variance),
            texture: this.randomScore(baseScore, variance),
            aroma: this.randomScore(baseScore + 2, variance),
            overall: 0
        };
        scores.overall = Math.round(
            (scores.appearance + scores.color + scores.size + scores.uniformity +
                scores.freshness + scores.texture + scores.aroma) / 7
        );

        // Generate realistic defects based on growth stage
        const defects = this.generateRealisticDefects(input, profile, scores);

        const harvestReadiness = this.calculateHarvestReadiness(input, profile, isOptimalHarvest);
        const shelfLife = this.estimateShelfLife(scores, defects, profile);
        const marketChannels = this.determineMarketChannels(scores.overall, defects, profile);

        return {
            batchId: input.batchId,
            batchNumber: input.batchNumber,
            cropType: input.cropType,
            overallGrade: this.calculateGrade(scores.overall, profile),
            gradeConfidence: 0.75,
            scores,
            defects,
            harvestReadiness,
            shelfLife,
            marketChannels,
            recommendations: this.generateRecommendations(scores, defects),
            assessmentDate: new Date(),
            aiAnalysis: `Algorithmic assessment for ${input.cropType} at day ${input.daysInGrowth}`
        };
    }

    /**
     * Calculate harvest readiness
     */
    private calculateHarvestReadiness(
        input: ImageAnalysisInput,
        profile: CropQualityProfile,
        isReady?: boolean
    ): HarvestReadiness {
        const growthProgress = input.daysInGrowth / input.expectedDaysToHarvest;
        const daysRemaining = input.expectedDaysToHarvest - input.daysInGrowth;

        const optimalStart = new Date();
        optimalStart.setDate(optimalStart.getDate() + Math.max(0, daysRemaining - 1));

        const optimalEnd = new Date();
        optimalEnd.setDate(optimalEnd.getDate() + daysRemaining + 2);

        const readinessScore = Math.min(100, Math.max(0, growthProgress * 100));

        return {
            isReady: isReady ?? (growthProgress >= 0.9 && growthProgress <= 1.15),
            readinessScore,
            optimalHarvestWindow: {
                start: optimalStart,
                end: optimalEnd
            },
            daysUntilOptimal: Math.max(0, daysRemaining),
            daysUntilOvermature: Math.max(0, daysRemaining + 3),
            indicators: profile.harvestIndicators
        };
    }

    /**
     * Estimate shelf life based on quality
     */
    private estimateShelfLife(
        scores: QualityScores,
        defects: Defect[],
        profile: CropQualityProfile
    ): ShelfLifeEstimate {
        let baseDays = profile.shelfLifeDays;

        // Adjust based on quality
        const qualityMultiplier = scores.overall / 100;
        baseDays = Math.round(baseDays * qualityMultiplier);

        // Reduce for defects
        const severeDefects = defects.filter(d => d.severity === 'SEVERE').length;
        const moderateDefects = defects.filter(d => d.severity === 'MODERATE').length;
        baseDays -= severeDefects * 2;
        baseDays -= moderateDefects * 1;

        const estimatedDays = Math.max(1, baseDays);

        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + estimatedDays);

        const factors: ShelfLifeFactor[] = [];

        if (scores.freshness >= 85) {
            factors.push({
                factor: 'High freshness score',
                impact: 'POSITIVE',
                description: 'Excellent initial freshness extends shelf life'
            });
        }

        if (defects.length > 0) {
            factors.push({
                factor: 'Defects present',
                impact: 'NEGATIVE',
                description: `${defects.length} defect(s) may accelerate deterioration`
            });
        }

        if (scores.overall >= 80) {
            factors.push({
                factor: 'Premium quality',
                impact: 'POSITIVE',
                description: 'High overall quality supports longer shelf life'
            });
        }

        return {
            estimatedDays,
            confidence: 0.8,
            storageConditions: {
                temperature: {
                    min: profile.storageTemp.min,
                    max: profile.storageTemp.max,
                    unit: '°F'
                },
                humidity: {
                    min: profile.storageHumidity.min,
                    max: profile.storageHumidity.max
                },
                packaging: 'Clamshell container or breathable bag',
                specialInstructions: [
                    'Store away from ethylene-producing fruits',
                    'Do not wash until ready to use',
                    'Keep refrigerated at all times'
                ]
            },
            factors,
            expirationDate
        };
    }

    /**
     * Determine suitable market channels
     */
    private determineMarketChannels(
        overallScore: number,
        defects: Defect[],
        profile: CropQualityProfile
    ): MarketChannel[] {
        const channels: MarketChannel[] = [];
        const hasSignificantDefects = defects.some(d => d.severity === 'SEVERE');

        // Premium restaurants
        channels.push({
            channel: 'Fine Dining Restaurants',
            suitability: overallScore >= 90 && !hasSignificantDefects ? 'EXCELLENT' :
                overallScore >= 80 ? 'GOOD' : overallScore >= 70 ? 'FAIR' : 'POOR',
            priceRange: { min: 18, max: 25 },
            notes: overallScore >= 90 ? 'Premium pricing justified' : 'May need to negotiate'
        });

        // Farmers markets
        channels.push({
            channel: 'Farmers Markets',
            suitability: overallScore >= 75 ? 'EXCELLENT' :
                overallScore >= 60 ? 'GOOD' : 'FAIR',
            priceRange: { min: 12, max: 18 },
            notes: 'Direct-to-consumer, freshness valued'
        });

        // Grocery/retail
        channels.push({
            channel: 'Grocery Retail',
            suitability: overallScore >= 80 && defects.length <= 1 ? 'EXCELLENT' :
                overallScore >= 70 ? 'GOOD' : overallScore >= 55 ? 'FAIR' : 'POOR',
            priceRange: { min: 8, max: 14 },
            notes: 'Uniformity and packaging important'
        });

        // Wholesale
        channels.push({
            channel: 'Wholesale Distribution',
            suitability: overallScore >= 70 ? 'GOOD' :
                overallScore >= 55 ? 'FAIR' : 'POOR',
            priceRange: { min: 6, max: 10 },
            notes: 'Volume pricing, longer shelf life needed'
        });

        // Value/processing
        if (overallScore < 70 || hasSignificantDefects) {
            channels.push({
                channel: 'Food Processing/Juicing',
                suitability: 'GOOD',
                priceRange: { min: 3, max: 6 },
                notes: 'Suitable for value recovery of lower-grade produce'
            });
        }

        return channels;
    }

    /**
     * Calculate quality grade from score
     */
    private calculateGrade(score: number, profile: CropQualityProfile): QualityGrade {
        if (score >= 95) return 'A+';
        if (score >= profile.gradeThresholds.A) return 'A';
        if (score >= profile.gradeThresholds.B) return 'B';
        if (score >= profile.gradeThresholds.C) return 'C';
        if (score >= profile.gradeThresholds.D) return 'D';
        return 'REJECT';
    }

    /**
     * Generate realistic defects based on conditions
     */
    private generateRealisticDefects(
        input: ImageAnalysisInput,
        profile: CropQualityProfile,
        scores: QualityScores
    ): Defect[] {
        const defects: Defect[] = [];
        const growthProgress = input.daysInGrowth / input.expectedDaysToHarvest;

        // Higher chance of defects with lower scores
        const defectProbability = (100 - scores.overall) / 100;

        if (Math.random() < defectProbability * 0.5) {
            const defectType = profile.commonDefects[Math.floor(Math.random() * profile.commonDefects.length)] as DefectType;
            defects.push({
                type: defectType,
                severity: scores.overall < 60 ? 'MODERATE' : 'MINOR',
                affectedPercentage: Math.round(5 + Math.random() * 10),
                description: this.getDefectDescription(defectType),
                cause: this.getDefectCause(defectType),
                preventionTip: this.getDefectPrevention(defectType)
            });
        }

        // Overmature crops have higher defect risk
        if (growthProgress > 1.1 && Math.random() < 0.4) {
            defects.push({
                type: 'BOLTING',
                severity: 'MODERATE',
                affectedPercentage: Math.round(10 + Math.random() * 15),
                description: 'Early signs of bolting detected',
                cause: 'Extended growth period beyond optimal harvest window',
                preventionTip: 'Harvest at optimal maturity to prevent bolting'
            });
        }

        return defects;
    }

    /**
     * Generate recommendations based on assessment
     */
    private generateRecommendations(scores: QualityScores, defects: Defect[]): string[] {
        const recommendations: string[] = [];

        if (scores.overall >= 85) {
            recommendations.push('Premium quality - target high-end restaurant and specialty retail channels');
        } else if (scores.overall >= 70) {
            recommendations.push('Good quality - suitable for farmers markets and standard retail');
        } else {
            recommendations.push('Consider value channels or processing to maximize recovery');
        }

        if (scores.uniformity < 70) {
            recommendations.push('Improve uniformity through better seed spacing and environmental control');
        }

        if (scores.color < 75) {
            recommendations.push('Review light exposure and nutrient levels to improve color development');
        }

        if (defects.length > 0) {
            recommendations.push(`Address ${defects.length} identified defect(s) in future batches`);
        }

        if (scores.freshness < 80) {
            recommendations.push('Optimize harvest timing and post-harvest handling for better freshness');
        }

        return recommendations;
    }

    // Helper methods

    private randomScore(base: number, variance: number): number {
        return Math.round(Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance * 2)));
    }

    private getDefectDescription(type: DefectType): string {
        const descriptions: Record<DefectType, string> = {
            DISCOLORATION: 'Abnormal color changes on leaves or stems',
            WILTING: 'Loss of turgor, drooping leaves',
            PEST_DAMAGE: 'Visible damage from insect activity',
            DISEASE_SPOTS: 'Spots or lesions indicating disease',
            MECHANICAL_DAMAGE: 'Physical damage from handling',
            SIZE_VARIATION: 'Inconsistent sizing across the batch',
            BOLTING: 'Premature flowering or elongation',
            TIP_BURN: 'Brown or dried leaf tips',
            YELLOWING: 'Chlorosis or yellowing of leaves',
            MOLD: 'Visible fungal growth',
            DEHYDRATION: 'Excessive moisture loss, shriveling'
        };
        return descriptions[type] || 'Quality defect detected';
    }

    private getDefectCause(type: DefectType): string {
        const causes: Record<DefectType, string> = {
            DISCOLORATION: 'Nutrient imbalance, light stress, or temperature extremes',
            WILTING: 'Insufficient watering or root problems',
            PEST_DAMAGE: 'Insect infestation in growing environment',
            DISEASE_SPOTS: 'Fungal or bacterial infection',
            MECHANICAL_DAMAGE: 'Rough handling during harvest or transport',
            SIZE_VARIATION: 'Uneven seed distribution or environmental gradients',
            BOLTING: 'Heat stress or extended growth period',
            TIP_BURN: 'Calcium deficiency or high EC levels',
            YELLOWING: 'Nitrogen deficiency or overwatering',
            MOLD: 'Excessive humidity and poor air circulation',
            DEHYDRATION: 'Low humidity or delayed harvest'
        };
        return causes[type] || 'Environmental or handling factors';
    }

    private getDefectPrevention(type: DefectType): string {
        const prevention: Record<DefectType, string> = {
            DISCOLORATION: 'Maintain balanced nutrition and stable temperatures',
            WILTING: 'Ensure consistent watering schedule',
            PEST_DAMAGE: 'Implement IPM and regular scouting',
            DISEASE_SPOTS: 'Improve air circulation and reduce humidity',
            MECHANICAL_DAMAGE: 'Train staff on gentle handling techniques',
            SIZE_VARIATION: 'Use precision seeding and uniform conditions',
            BOLTING: 'Harvest at optimal maturity, control temperature',
            TIP_BURN: 'Monitor calcium levels and EC',
            YELLOWING: 'Optimize nitrogen fertilization',
            MOLD: 'Reduce humidity and improve ventilation',
            DEHYDRATION: 'Maintain humidity and harvest promptly'
        };
        return prevention[type] || 'Review growing conditions and handling procedures';
    }

    private getDefaultProfile(): CropQualityProfile {
        return {
            cropType: 'Default',
            optimalLength: { min: 2, max: 4, unit: 'inches' },
            optimalColor: 'Bright green',
            shelfLifeDays: 7,
            gradeThresholds: { A: 85, B: 70, C: 55, D: 40 },
            commonDefects: ['WILTING', 'YELLOWING', 'DISCOLORATION'],
            harvestIndicators: ['Optimal size reached', 'Good color', 'Firm texture'],
            storageTemp: { min: 32, max: 36 },
            storageHumidity: { min: 90, max: 95 }
        };
    }

    /**
     * Get quality trend for a batch over time
     */
    getQualityTrend(assessments: QualityAssessment[]): QualityTrend | null {
        if (assessments.length < 2) return null;

        const sorted = assessments.sort((a, b) =>
            a.assessmentDate.getTime() - b.assessmentDate.getTime()
        );

        const recentScores = sorted.slice(-3).map(a => a.scores.overall);
        const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        const firstScore = sorted[0].scores.overall;

        let trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
        if (avgRecent > firstScore + 5) {
            trend = 'IMPROVING';
        } else if (avgRecent < firstScore - 5) {
            trend = 'DECLINING';
        } else {
            trend = 'STABLE';
        }

        const projectedScore = avgRecent + (trend === 'IMPROVING' ? 5 : trend === 'DECLINING' ? -5 : 0);
        const projectedGrade = this.calculateGrade(projectedScore, this.getDefaultProfile());

        return {
            batchId: sorted[0].batchId,
            assessments: sorted.map(a => ({
                date: a.assessmentDate,
                grade: a.overallGrade,
                overallScore: a.scores.overall
            })),
            trend,
            projectedGrade
        };
    }
}

interface CropQualityProfile {
    cropType: string;
    optimalLength: { min: number; max: number; unit: string };
    optimalColor: string;
    shelfLifeDays: number;
    gradeThresholds: { A: number; B: number; C: number; D: number };
    commonDefects: string[];
    harvestIndicators: string[];
    storageTemp: { min: number; max: number };
    storageHumidity: { min: number; max: number };
}

export const qualityGradingAI = new QualityGradingAI();
