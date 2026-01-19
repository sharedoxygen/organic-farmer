/**
 * AI-Powered Resource Optimization Service
 * Optimizes water, labor, inputs, and equipment utilization
 */

import { weatherService } from './weatherService';
import { yieldPredictionAI } from './yieldPredictionAI';

export interface ResourceOptimizationPlan {
    farmId: string;
    generatedAt: Date;
    planPeriod: { start: Date; end: Date };
    water: WaterOptimization;
    labor: LaborOptimization;
    inputs: InputOptimization;
    equipment: EquipmentOptimization;
    overallSavings: SavingsEstimate;
    recommendations: PrioritizedRecommendation[];
}

export interface WaterOptimization {
    currentUsage: number; // gallons per day
    optimizedUsage: number;
    savingsPercentage: number;
    schedule: IrrigationSchedule[];
    weatherAdjustments: WeatherAdjustment[];
    cropSpecificRecommendations: CropWaterRecommendation[];
}

export interface IrrigationSchedule {
    zone: string;
    cropType: string;
    frequency: string;
    duration: number; // minutes
    optimalTime: string;
    waterAmount: number; // gallons
    adjustmentReason?: string;
}

export interface WeatherAdjustment {
    date: Date;
    adjustment: 'INCREASE' | 'DECREASE' | 'SKIP';
    percentage: number;
    reason: string;
}

export interface CropWaterRecommendation {
    cropType: string;
    currentWaterPerTray: number;
    recommendedWaterPerTray: number;
    growthStageAdjustment: number;
    notes: string;
}

export interface LaborOptimization {
    currentHours: number;
    optimizedHours: number;
    savingsPercentage: number;
    schedule: LaborSchedule[];
    taskPrioritization: TaskPriority[];
    efficiencyRecommendations: string[];
}

export interface LaborSchedule {
    date: Date;
    shift: 'MORNING' | 'AFTERNOON' | 'EVENING';
    requiredStaff: number;
    tasks: ScheduledTask[];
    estimatedHours: number;
}

export interface ScheduledTask {
    taskType: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    estimatedDuration: number; // minutes
    assignedZone?: string;
    batchId?: string;
    notes?: string;
}

export interface TaskPriority {
    taskType: string;
    urgency: number; // 1-10
    impact: number; // 1-10
    priorityScore: number;
    recommendedTiming: string;
}

export interface InputOptimization {
    seeds: InputRecommendation;
    growingMedia: InputRecommendation;
    nutrients: InputRecommendation;
    packaging: InputRecommendation;
    totalSavings: number;
    purchaseSchedule: PurchaseScheduleItem[];
}

export interface InputRecommendation {
    inputType: string;
    currentUsage: number;
    optimizedUsage: number;
    unit: string;
    savingsPercentage: number;
    costSavings: number;
    recommendations: string[];
}

export interface PurchaseScheduleItem {
    inputType: string;
    quantity: number;
    unit: string;
    orderDate: Date;
    neededByDate: Date;
    estimatedCost: number;
    supplier?: string;
}

export interface EquipmentOptimization {
    utilizationRate: number; // percentage
    optimizedUtilization: number;
    maintenanceSchedule: MaintenanceItem[];
    efficiencyImprovements: EfficiencyImprovement[];
    replacementRecommendations: ReplacementRecommendation[];
}

export interface MaintenanceItem {
    equipmentId: string;
    equipmentName: string;
    maintenanceType: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE';
    scheduledDate: Date;
    estimatedDowntime: number; // hours
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    notes: string;
}

export interface EfficiencyImprovement {
    equipmentName: string;
    currentEfficiency: number;
    potentialEfficiency: number;
    improvement: string;
    estimatedSavings: number;
    implementationCost: number;
    paybackPeriod: number; // months
}

export interface ReplacementRecommendation {
    equipmentName: string;
    currentAge: number; // months
    expectedLifespan: number;
    condition: 'GOOD' | 'FAIR' | 'POOR';
    replacementUrgency: 'IMMEDIATE' | 'SOON' | 'PLANNED' | 'MONITOR';
    estimatedReplacementCost: number;
    annualSavingsIfReplaced: number;
}

export interface SavingsEstimate {
    waterSavings: { amount: number; unit: string; costSavings: number };
    laborSavings: { hours: number; costSavings: number };
    inputSavings: { costSavings: number };
    energySavings: { amount: number; unit: string; costSavings: number };
    totalMonthlySavings: number;
    totalAnnualSavings: number;
    implementationCost: number;
    paybackPeriod: number; // months
}

export interface PrioritizedRecommendation {
    id: string;
    category: 'WATER' | 'LABOR' | 'INPUTS' | 'EQUIPMENT' | 'ENERGY';
    title: string;
    description: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    effort: 'HIGH' | 'MEDIUM' | 'LOW';
    estimatedSavings: number;
    implementationSteps: string[];
    priority: number; // 1-10
}

export interface FarmResourceData {
    farmId: string;
    location: string;
    activeBatches: BatchResourceData[];
    equipment: EquipmentData[];
    currentStaff: number;
    operatingHours: { start: string; end: string };
    zones: ZoneData[];
}

export interface BatchResourceData {
    batchId: string;
    cropType: string;
    traysUsed: number;
    zone: string;
    plantingDate: Date;
    expectedHarvestDate: Date;
    currentWaterUsage: number;
}

export interface EquipmentData {
    id: string;
    name: string;
    type: string;
    age: number; // months
    condition: 'GOOD' | 'FAIR' | 'POOR';
    lastMaintenance: Date;
    utilizationRate: number;
    energyConsumption: number; // kWh per day
}

export interface ZoneData {
    id: string;
    name: string;
    area: number; // sq ft
    cropTypes: string[];
    irrigationType: string;
    lightingType: string;
}

export class ResourceOptimizationAI {
    private cropWaterProfiles: Map<string, CropWaterProfile> = new Map();
    private taskDurations: Map<string, number> = new Map();

    constructor() {
        this.initializeProfiles();
    }

    private initializeProfiles(): void {
        // Water profiles (gallons per tray per day)
        const waterProfiles: CropWaterProfile[] = [
            { cropType: 'Arugula', baseWater: 0.15, germinationMultiplier: 1.5, growthMultiplier: 1.0, harvestMultiplier: 0.8 },
            { cropType: 'Basil', baseWater: 0.18, germinationMultiplier: 1.4, growthMultiplier: 1.2, harvestMultiplier: 0.9 },
            { cropType: 'Kale', baseWater: 0.16, germinationMultiplier: 1.3, growthMultiplier: 1.0, harvestMultiplier: 0.8 },
            { cropType: 'Pea Shoots', baseWater: 0.20, germinationMultiplier: 1.6, growthMultiplier: 1.1, harvestMultiplier: 0.7 },
            { cropType: 'Sunflower', baseWater: 0.22, germinationMultiplier: 1.5, growthMultiplier: 1.2, harvestMultiplier: 0.8 },
            { cropType: 'Radish', baseWater: 0.14, germinationMultiplier: 1.4, growthMultiplier: 1.0, harvestMultiplier: 0.7 }
        ];
        waterProfiles.forEach(p => this.cropWaterProfiles.set(p.cropType, p));

        // Task durations (minutes)
        this.taskDurations.set('SEEDING', 5); // per tray
        this.taskDurations.set('WATERING', 2); // per zone
        this.taskDurations.set('HARVESTING', 8); // per tray
        this.taskDurations.set('PACKAGING', 6); // per tray
        this.taskDurations.set('QUALITY_CHECK', 3); // per batch
        this.taskDurations.set('CLEANING', 15); // per zone
        this.taskDurations.set('MAINTENANCE', 30); // per equipment
    }

    /**
     * Generate comprehensive resource optimization plan
     */
    async generateOptimizationPlan(
        farmData: FarmResourceData,
        planDays: number = 7
    ): Promise<ResourceOptimizationPlan> {
        const planStart = new Date();
        const planEnd = new Date();
        planEnd.setDate(planEnd.getDate() + planDays);

        // Generate individual optimizations
        const water = await this.optimizeWater(farmData, planDays);
        const labor = await this.optimizeLabor(farmData, planDays);
        const inputs = await this.optimizeInputs(farmData, planDays);
        const equipment = await this.optimizeEquipment(farmData);

        // Calculate overall savings
        const overallSavings = this.calculateOverallSavings(water, labor, inputs, equipment);

        // Generate prioritized recommendations
        const recommendations = this.generatePrioritizedRecommendations(water, labor, inputs, equipment);

        return {
            farmId: farmData.farmId,
            generatedAt: new Date(),
            planPeriod: { start: planStart, end: planEnd },
            water,
            labor,
            inputs,
            equipment,
            overallSavings,
            recommendations
        };
    }

    /**
     * Optimize water usage
     */
    async optimizeWater(farmData: FarmResourceData, planDays: number): Promise<WaterOptimization> {
        // Calculate current usage
        let currentUsage = 0;
        const cropRecommendations: CropWaterRecommendation[] = [];

        for (const batch of farmData.activeBatches) {
            currentUsage += batch.currentWaterUsage * batch.traysUsed;

            const profile = this.cropWaterProfiles.get(batch.cropType) || this.getDefaultWaterProfile();
            const growthStage = this.getGrowthStage(batch.plantingDate, batch.expectedHarvestDate);
            const stageMultiplier = this.getStageMultiplier(growthStage, profile);

            const recommendedWater = profile.baseWater * stageMultiplier;

            cropRecommendations.push({
                cropType: batch.cropType,
                currentWaterPerTray: batch.currentWaterUsage,
                recommendedWaterPerTray: Math.round(recommendedWater * 100) / 100,
                growthStageAdjustment: stageMultiplier,
                notes: `${growthStage} stage - ${stageMultiplier > 1 ? 'increased' : 'standard'} water needs`
            });
        }

        // Get weather adjustments
        const weatherAdjustments = await this.getWeatherWaterAdjustments(farmData.location, planDays);

        // Calculate optimized usage
        const optimizedUsage = cropRecommendations.reduce((sum, rec) => {
            const batch = farmData.activeBatches.find(b => b.cropType === rec.cropType);
            return sum + (rec.recommendedWaterPerTray * (batch?.traysUsed ?? 0));
        }, 0);

        // Apply weather adjustments
        const avgWeatherAdjustment = weatherAdjustments.reduce((sum, adj) =>
            sum + (adj.adjustment === 'INCREASE' ? adj.percentage : adj.adjustment === 'DECREASE' ? -adj.percentage : -100), 0
        ) / Math.max(1, weatherAdjustments.length);

        const weatherAdjustedUsage = optimizedUsage * (1 + avgWeatherAdjustment / 100);

        // Generate irrigation schedule
        const schedule = this.generateIrrigationSchedule(farmData, cropRecommendations);

        return {
            currentUsage: Math.round(currentUsage * 10) / 10,
            optimizedUsage: Math.round(weatherAdjustedUsage * 10) / 10,
            savingsPercentage: Math.round(((currentUsage - weatherAdjustedUsage) / currentUsage) * 100),
            schedule,
            weatherAdjustments,
            cropSpecificRecommendations: cropRecommendations
        };
    }

    /**
     * Optimize labor allocation
     */
    async optimizeLabor(farmData: FarmResourceData, planDays: number): Promise<LaborOptimization> {
        const schedules: LaborSchedule[] = [];
        const taskPriorities: TaskPriority[] = [];

        // Calculate task requirements
        let totalCurrentHours = 0;
        let totalOptimizedHours = 0;

        for (let day = 0; day < planDays; day++) {
            const date = new Date();
            date.setDate(date.getDate() + day);

            const dayTasks = this.calculateDayTasks(farmData, date);
            const schedule = this.createDaySchedule(date, dayTasks, farmData.currentStaff);
            schedules.push(schedule);

            totalOptimizedHours += schedule.estimatedHours;
        }

        // Estimate current hours (assume 20% inefficiency)
        totalCurrentHours = totalOptimizedHours * 1.2;

        // Generate task priorities
        const taskTypes = ['HARVESTING', 'QUALITY_CHECK', 'SEEDING', 'WATERING', 'PACKAGING', 'CLEANING', 'MAINTENANCE'];
        taskTypes.forEach((taskType, index) => {
            taskPriorities.push({
                taskType,
                urgency: 10 - index,
                impact: 10 - Math.floor(index / 2),
                priorityScore: (10 - index) * 0.6 + (10 - Math.floor(index / 2)) * 0.4,
                recommendedTiming: this.getRecommendedTiming(taskType)
            });
        });

        return {
            currentHours: Math.round(totalCurrentHours * 10) / 10,
            optimizedHours: Math.round(totalOptimizedHours * 10) / 10,
            savingsPercentage: Math.round(((totalCurrentHours - totalOptimizedHours) / totalCurrentHours) * 100),
            schedule: schedules,
            taskPrioritization: taskPriorities.sort((a, b) => b.priorityScore - a.priorityScore),
            efficiencyRecommendations: [
                'Batch similar tasks together to reduce transition time',
                'Schedule harvesting during cooler morning hours for better quality',
                'Use task checklists to ensure consistent completion times',
                'Cross-train staff to handle multiple task types',
                'Implement zone-based workflow to minimize movement'
            ]
        };
    }

    /**
     * Optimize input usage
     */
    async optimizeInputs(farmData: FarmResourceData, planDays: number): Promise<InputOptimization> {
        const totalTrays = farmData.activeBatches.reduce((sum, b) => sum + b.traysUsed, 0);

        // Seeds optimization
        const seeds: InputRecommendation = {
            inputType: 'Seeds',
            currentUsage: totalTrays * 15, // grams per tray average
            optimizedUsage: totalTrays * 13, // 13% reduction through precision seeding
            unit: 'grams',
            savingsPercentage: 13,
            costSavings: totalTrays * 0.15, // $0.15 per tray savings
            recommendations: [
                'Implement precision seeding for consistent density',
                'Adjust seed rates based on germination test results',
                'Use vacuum seeders for uniform distribution'
            ]
        };

        // Growing media optimization
        const growingMedia: InputRecommendation = {
            inputType: 'Growing Media',
            currentUsage: totalTrays * 0.5, // lbs per tray
            optimizedUsage: totalTrays * 0.45,
            unit: 'lbs',
            savingsPercentage: 10,
            costSavings: totalTrays * 0.08,
            recommendations: [
                'Optimize media depth for each crop type',
                'Consider reusable growing systems where applicable',
                'Source bulk media for volume discounts'
            ]
        };

        // Nutrients optimization
        const nutrients: InputRecommendation = {
            inputType: 'Nutrients',
            currentUsage: totalTrays * 0.02, // liters per tray
            optimizedUsage: totalTrays * 0.018,
            unit: 'liters',
            savingsPercentage: 10,
            costSavings: totalTrays * 0.05,
            recommendations: [
                'Use EC meters to prevent over-fertilization',
                'Adjust nutrient strength by growth stage',
                'Implement fertigation for precise delivery'
            ]
        };

        // Packaging optimization
        const packaging: InputRecommendation = {
            inputType: 'Packaging',
            currentUsage: totalTrays * 1.1, // units per tray (some waste)
            optimizedUsage: totalTrays * 1.02,
            unit: 'units',
            savingsPercentage: 7,
            costSavings: totalTrays * 0.12,
            recommendations: [
                'Right-size packaging to reduce material waste',
                'Negotiate volume discounts with suppliers',
                'Consider eco-friendly options for premium positioning'
            ]
        };

        const totalSavings = seeds.costSavings + growingMedia.costSavings +
            nutrients.costSavings + packaging.costSavings;

        // Generate purchase schedule
        const purchaseSchedule = this.generatePurchaseSchedule(farmData, planDays);

        return {
            seeds,
            growingMedia,
            nutrients,
            packaging,
            totalSavings: Math.round(totalSavings * 100) / 100,
            purchaseSchedule
        };
    }

    /**
     * Optimize equipment utilization
     */
    async optimizeEquipment(farmData: FarmResourceData): Promise<EquipmentOptimization> {
        const currentUtilization = farmData.equipment.reduce((sum, e) => sum + e.utilizationRate, 0) /
            Math.max(1, farmData.equipment.length);

        // Generate maintenance schedule
        const maintenanceSchedule: MaintenanceItem[] = farmData.equipment.map(equip => {
            const daysSinceMaintenance = Math.floor(
                (Date.now() - equip.lastMaintenance.getTime()) / (1000 * 60 * 60 * 24)
            );
            const maintenanceInterval = equip.condition === 'GOOD' ? 90 : equip.condition === 'FAIR' ? 60 : 30;
            const daysUntilMaintenance = Math.max(0, maintenanceInterval - daysSinceMaintenance);

            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() + daysUntilMaintenance);

            return {
                equipmentId: equip.id,
                equipmentName: equip.name,
                maintenanceType: daysUntilMaintenance <= 7 ? 'PREVENTIVE' as const : 'PREDICTIVE' as const,
                scheduledDate,
                estimatedDowntime: equip.condition === 'POOR' ? 4 : 2,
                priority: daysUntilMaintenance <= 7 ? 'HIGH' as const : daysUntilMaintenance <= 14 ? 'MEDIUM' as const : 'LOW' as const,
                notes: `${daysSinceMaintenance} days since last maintenance`
            };
        });

        // Identify efficiency improvements
        const efficiencyImprovements: EfficiencyImprovement[] = farmData.equipment
            .filter(e => e.utilizationRate < 70 || e.condition !== 'GOOD')
            .map(equip => ({
                equipmentName: equip.name,
                currentEfficiency: equip.utilizationRate,
                potentialEfficiency: Math.min(95, equip.utilizationRate + 20),
                improvement: equip.utilizationRate < 50
                    ? 'Consolidate usage or consider sharing/selling'
                    : 'Optimize scheduling to increase utilization',
                estimatedSavings: equip.energyConsumption * 0.15 * 30, // 15% energy savings monthly
                implementationCost: 500,
                paybackPeriod: Math.round(500 / (equip.energyConsumption * 0.15 * 30 * 0.12))
            }));

        // Replacement recommendations
        const replacementRecommendations: ReplacementRecommendation[] = farmData.equipment
            .filter(e => e.condition === 'POOR' || e.age > 60)
            .map(equip => ({
                equipmentName: equip.name,
                currentAge: equip.age,
                expectedLifespan: 84, // 7 years average
                condition: equip.condition,
                replacementUrgency: equip.condition === 'POOR' ? 'SOON' as const : 'PLANNED' as const,
                estimatedReplacementCost: 2000, // Placeholder
                annualSavingsIfReplaced: equip.energyConsumption * 0.25 * 365 * 0.12 // 25% efficiency gain
            }));

        return {
            utilizationRate: Math.round(currentUtilization),
            optimizedUtilization: Math.min(90, Math.round(currentUtilization + 15)),
            maintenanceSchedule,
            efficiencyImprovements,
            replacementRecommendations
        };
    }

    /**
     * Calculate overall savings
     */
    private calculateOverallSavings(
        water: WaterOptimization,
        labor: LaborOptimization,
        inputs: InputOptimization,
        equipment: EquipmentOptimization
    ): SavingsEstimate {
        const waterCostPerGallon = 0.005;
        const laborCostPerHour = 18;

        const waterSavings = {
            amount: water.currentUsage - water.optimizedUsage,
            unit: 'gallons/day',
            costSavings: (water.currentUsage - water.optimizedUsage) * waterCostPerGallon * 30
        };

        const laborSavings = {
            hours: labor.currentHours - labor.optimizedHours,
            costSavings: (labor.currentHours - labor.optimizedHours) * laborCostPerHour * 4 // weekly
        };

        const inputSavings = {
            costSavings: inputs.totalSavings * 4 // monthly
        };

        const energySavings = {
            amount: equipment.efficiencyImprovements.reduce((sum, e) => sum + e.estimatedSavings / 30, 0),
            unit: 'kWh/day',
            costSavings: equipment.efficiencyImprovements.reduce((sum, e) => sum + e.estimatedSavings, 0)
        };

        const totalMonthlySavings = waterSavings.costSavings + laborSavings.costSavings +
            inputSavings.costSavings + energySavings.costSavings;

        const implementationCost = equipment.efficiencyImprovements.reduce((sum, e) => sum + e.implementationCost, 0);

        return {
            waterSavings,
            laborSavings,
            inputSavings,
            energySavings,
            totalMonthlySavings: Math.round(totalMonthlySavings * 100) / 100,
            totalAnnualSavings: Math.round(totalMonthlySavings * 12 * 100) / 100,
            implementationCost,
            paybackPeriod: implementationCost > 0 ? Math.round(implementationCost / totalMonthlySavings) : 0
        };
    }

    /**
     * Generate prioritized recommendations
     */
    private generatePrioritizedRecommendations(
        water: WaterOptimization,
        labor: LaborOptimization,
        inputs: InputOptimization,
        equipment: EquipmentOptimization
    ): PrioritizedRecommendation[] {
        const recommendations: PrioritizedRecommendation[] = [];

        // Water recommendations
        if (water.savingsPercentage > 10) {
            recommendations.push({
                id: 'water_1',
                category: 'WATER',
                title: 'Implement Smart Irrigation',
                description: `Reduce water usage by ${water.savingsPercentage}% through optimized scheduling`,
                impact: 'HIGH',
                effort: 'LOW',
                estimatedSavings: (water.currentUsage - water.optimizedUsage) * 0.005 * 365,
                implementationSteps: [
                    'Install soil moisture sensors in each zone',
                    'Configure irrigation controller with crop-specific schedules',
                    'Set up weather-based automatic adjustments',
                    'Monitor and fine-tune over 2-week period'
                ],
                priority: 9
            });
        }

        // Labor recommendations
        if (labor.savingsPercentage > 15) {
            recommendations.push({
                id: 'labor_1',
                category: 'LABOR',
                title: 'Optimize Task Scheduling',
                description: `Save ${labor.currentHours - labor.optimizedHours} hours per week through better scheduling`,
                impact: 'HIGH',
                effort: 'MEDIUM',
                estimatedSavings: (labor.currentHours - labor.optimizedHours) * 18 * 52,
                implementationSteps: [
                    'Implement zone-based workflow system',
                    'Batch similar tasks together',
                    'Schedule harvesting during optimal hours',
                    'Cross-train team members'
                ],
                priority: 8
            });
        }

        // Input recommendations
        if (inputs.totalSavings > 50) {
            recommendations.push({
                id: 'inputs_1',
                category: 'INPUTS',
                title: 'Precision Input Management',
                description: `Save $${Math.round(inputs.totalSavings * 12)} annually through optimized input usage`,
                impact: 'MEDIUM',
                effort: 'LOW',
                estimatedSavings: inputs.totalSavings * 12,
                implementationSteps: [
                    'Implement precision seeding techniques',
                    'Use EC meters for nutrient management',
                    'Right-size packaging materials',
                    'Negotiate bulk purchasing agreements'
                ],
                priority: 7
            });
        }

        // Equipment recommendations
        equipment.efficiencyImprovements.forEach((improvement, index) => {
            recommendations.push({
                id: `equipment_${index}`,
                category: 'EQUIPMENT',
                title: `Optimize ${improvement.equipmentName}`,
                description: improvement.improvement,
                impact: improvement.estimatedSavings > 100 ? 'HIGH' : 'MEDIUM',
                effort: 'MEDIUM',
                estimatedSavings: improvement.estimatedSavings * 12,
                implementationSteps: [
                    'Audit current usage patterns',
                    'Implement scheduling optimization',
                    'Perform preventive maintenance',
                    'Monitor efficiency improvements'
                ],
                priority: 6 - index
            });
        });

        return recommendations.sort((a, b) => b.priority - a.priority);
    }

    // Helper methods

    private getGrowthStage(plantingDate: Date, harvestDate: Date): 'GERMINATION' | 'GROWTH' | 'HARVEST' {
        const totalDays = (harvestDate.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24);
        const currentDays = (Date.now() - plantingDate.getTime()) / (1000 * 60 * 60 * 24);
        const progress = currentDays / totalDays;

        if (progress < 0.3) return 'GERMINATION';
        if (progress < 0.85) return 'GROWTH';
        return 'HARVEST';
    }

    private getStageMultiplier(stage: string, profile: CropWaterProfile): number {
        switch (stage) {
            case 'GERMINATION': return profile.germinationMultiplier;
            case 'GROWTH': return profile.growthMultiplier;
            case 'HARVEST': return profile.harvestMultiplier;
            default: return 1.0;
        }
    }

    private async getWeatherWaterAdjustments(location: string, days: number): Promise<WeatherAdjustment[]> {
        const adjustments: WeatherAdjustment[] = [];

        try {
            const forecast = await weatherService.getForecast(location, days);

            forecast.forEach(day => {
                if (day.precipProbability > 60) {
                    adjustments.push({
                        date: day.date,
                        adjustment: 'DECREASE',
                        percentage: 30,
                        reason: `${day.precipProbability}% chance of rain`
                    });
                } else if (day.high > 85) {
                    adjustments.push({
                        date: day.date,
                        adjustment: 'INCREASE',
                        percentage: 20,
                        reason: `High temperature: ${day.high}°F`
                    });
                } else if (day.humidity > 80) {
                    adjustments.push({
                        date: day.date,
                        adjustment: 'DECREASE',
                        percentage: 15,
                        reason: `High humidity: ${day.humidity}%`
                    });
                }
            });
        } catch (error) {
            console.warn('⚠️ Could not get weather data for water adjustments');
        }

        return adjustments;
    }

    private generateIrrigationSchedule(
        farmData: FarmResourceData,
        recommendations: CropWaterRecommendation[]
    ): IrrigationSchedule[] {
        const schedules: IrrigationSchedule[] = [];

        farmData.zones.forEach(zone => {
            const zoneBatches = farmData.activeBatches.filter(b => b.zone === zone.id);
            const primaryCrop = zoneBatches[0]?.cropType || 'Mixed';
            const recommendation = recommendations.find(r => r.cropType === primaryCrop);

            schedules.push({
                zone: zone.name,
                cropType: primaryCrop,
                frequency: 'Twice daily',
                duration: 5,
                optimalTime: '6:00 AM, 2:00 PM',
                waterAmount: (recommendation?.recommendedWaterPerTray || 0.15) * zoneBatches.reduce((sum, b) => sum + b.traysUsed, 0),
                adjustmentReason: recommendation?.notes
            });
        });

        return schedules;
    }

    private calculateDayTasks(farmData: FarmResourceData, date: Date): ScheduledTask[] {
        const tasks: ScheduledTask[] = [];

        // Daily watering
        tasks.push({
            taskType: 'WATERING',
            priority: 'HIGH',
            estimatedDuration: farmData.zones.length * (this.taskDurations.get('WATERING') || 2),
            notes: 'Morning and afternoon watering rounds'
        });

        // Check for harvests
        farmData.activeBatches.forEach(batch => {
            const harvestDate = new Date(batch.expectedHarvestDate);
            if (harvestDate.toDateString() === date.toDateString()) {
                tasks.push({
                    taskType: 'HARVESTING',
                    priority: 'HIGH',
                    estimatedDuration: batch.traysUsed * (this.taskDurations.get('HARVESTING') || 8),
                    batchId: batch.batchId,
                    assignedZone: batch.zone
                });

                tasks.push({
                    taskType: 'PACKAGING',
                    priority: 'HIGH',
                    estimatedDuration: batch.traysUsed * (this.taskDurations.get('PACKAGING') || 6),
                    batchId: batch.batchId
                });
            }
        });

        // Quality checks
        tasks.push({
            taskType: 'QUALITY_CHECK',
            priority: 'MEDIUM',
            estimatedDuration: farmData.activeBatches.length * (this.taskDurations.get('QUALITY_CHECK') || 3)
        });

        return tasks;
    }

    private createDaySchedule(date: Date, tasks: ScheduledTask[], staff: number): LaborSchedule {
        const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedDuration, 0);
        const estimatedHours = totalMinutes / 60 / Math.max(1, staff);

        return {
            date,
            shift: 'MORNING',
            requiredStaff: Math.ceil(totalMinutes / 480), // 8-hour shifts
            tasks,
            estimatedHours: Math.round(estimatedHours * 10) / 10
        };
    }

    private getRecommendedTiming(taskType: string): string {
        const timings: Record<string, string> = {
            'HARVESTING': 'Early morning (6-9 AM) for best quality',
            'QUALITY_CHECK': 'After harvesting, before packaging',
            'SEEDING': 'Morning or early afternoon',
            'WATERING': 'Early morning and mid-afternoon',
            'PACKAGING': 'Immediately after harvest and quality check',
            'CLEANING': 'End of day or between batches',
            'MAINTENANCE': 'Scheduled downtime or weekends'
        };
        return timings[taskType] || 'As needed';
    }

    private generatePurchaseSchedule(farmData: FarmResourceData, planDays: number): PurchaseScheduleItem[] {
        const schedule: PurchaseScheduleItem[] = [];
        const totalTrays = farmData.activeBatches.reduce((sum, b) => sum + b.traysUsed, 0);

        // Seeds (order 2 weeks ahead)
        const seedOrderDate = new Date();
        seedOrderDate.setDate(seedOrderDate.getDate() + 7);
        const seedNeededDate = new Date();
        seedNeededDate.setDate(seedNeededDate.getDate() + 14);

        schedule.push({
            inputType: 'Seeds',
            quantity: Math.round(totalTrays * 13 * 1.1), // 10% buffer
            unit: 'grams',
            orderDate: seedOrderDate,
            neededByDate: seedNeededDate,
            estimatedCost: totalTrays * 2.5
        });

        // Growing media
        schedule.push({
            inputType: 'Growing Media',
            quantity: Math.round(totalTrays * 0.45 * 1.1),
            unit: 'lbs',
            orderDate: seedOrderDate,
            neededByDate: seedNeededDate,
            estimatedCost: totalTrays * 0.8
        });

        return schedule;
    }

    private getDefaultWaterProfile(): CropWaterProfile {
        return {
            cropType: 'Default',
            baseWater: 0.16,
            germinationMultiplier: 1.4,
            growthMultiplier: 1.0,
            harvestMultiplier: 0.8
        };
    }
}

interface CropWaterProfile {
    cropType: string;
    baseWater: number;
    germinationMultiplier: number;
    growthMultiplier: number;
    harvestMultiplier: number;
}

export const resourceOptimizationAI = new ResourceOptimizationAI();
