/**
 * AI Alert Engine for OFMS
 * Proactive notifications for critical farming insights
 */

import { weatherService, WeatherAlert } from './weatherService';
import { ollamaService } from './ollamaService';
import { buildStableAlertId } from './alertAcknowledgmentService';

export type AlertType =
    | 'DISEASE_OUTBREAK'
    | 'HARVEST_OPTIMAL'
    | 'MARKET_OPPORTUNITY'
    | 'WEATHER_WARNING'
    | 'RESOURCE_LOW'
    | 'YIELD_ANOMALY'
    | 'QUALITY_ISSUE'
    | 'COMPLIANCE_REMINDER'
    | 'MAINTENANCE_DUE'
    | 'BATCH_ATTENTION';

export type AlertSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';

export interface AIAlert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    aiInsight?: string;
    data?: Record<string, any>;
    actionRequired: boolean;
    actions?: AlertAction[];
    createdAt: Date;
    expiresAt?: Date;
    acknowledged: boolean;
    acknowledgedAt?: Date;
    acknowledgedBy?: string;
    farmId: string;
    batchId?: string;
    channels: AlertChannel[];
}

export interface AlertAction {
    id: string;
    label: string;
    type: 'PRIMARY' | 'SECONDARY' | 'DANGER';
    action: string; // URL or action identifier
    completed: boolean;
}

export interface AlertRule {
    id: string;
    name: string;
    type: AlertType;
    enabled: boolean;
    conditions: AlertCondition[];
    severity: AlertSeverity;
    channels: AlertChannel[];
    cooldownMinutes: number; // Prevent alert spam
}

export interface AlertCondition {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
    value: any;
}

export interface BatchHealthData {
    batchId: string;
    batchNumber: string;
    cropType: string;
    plantingDate: Date;
    expectedHarvestDate: Date;
    currentStatus: string;
    healthScore?: number;
    temperature?: number;
    humidity?: number;
    daysToHarvest: number;
    issues?: string[];
}

export interface MarketData {
    cropType: string;
    currentPrice: number;
    priceChange: number;
    demandTrend: 'increasing' | 'stable' | 'decreasing';
    competitorActivity: 'low' | 'medium' | 'high';
}

export interface ResourceData {
    resourceType: string;
    currentLevel: number;
    reorderPoint: number;
    unit: string;
    daysUntilEmpty?: number;
}

export class AIAlertEngine {
    private alertRules: AlertRule[] = [];
    private recentAlerts: Map<string, Date> = new Map(); // For cooldown tracking

    constructor() {
        this.initializeDefaultRules();
    }

    private initializeDefaultRules(): void {
        this.alertRules = [
            {
                id: 'disease_detection',
                name: 'Disease Detection Alert',
                type: 'DISEASE_OUTBREAK',
                enabled: true,
                conditions: [{ field: 'diseaseConfidence', operator: 'gte', value: 0.7 }],
                severity: 'HIGH',
                channels: ['IN_APP', 'EMAIL'],
                cooldownMinutes: 60
            },
            {
                id: 'harvest_optimal',
                name: 'Optimal Harvest Window',
                type: 'HARVEST_OPTIMAL',
                enabled: true,
                conditions: [{ field: 'daysToHarvest', operator: 'lte', value: 2 }],
                severity: 'MEDIUM',
                channels: ['IN_APP'],
                cooldownMinutes: 1440 // 24 hours
            },
            {
                id: 'market_opportunity',
                name: 'Market Price Opportunity',
                type: 'MARKET_OPPORTUNITY',
                enabled: true,
                conditions: [{ field: 'priceChange', operator: 'gte', value: 10 }],
                severity: 'INFO',
                channels: ['IN_APP'],
                cooldownMinutes: 720 // 12 hours
            },
            {
                id: 'resource_low',
                name: 'Low Resource Alert',
                type: 'RESOURCE_LOW',
                enabled: true,
                conditions: [{ field: 'currentLevel', operator: 'lte', value: 'reorderPoint' }],
                severity: 'MEDIUM',
                channels: ['IN_APP', 'EMAIL'],
                cooldownMinutes: 1440
            },
            {
                id: 'weather_warning',
                name: 'Weather Warning',
                type: 'WEATHER_WARNING',
                enabled: true,
                conditions: [],
                severity: 'HIGH',
                channels: ['IN_APP', 'EMAIL', 'PUSH'],
                cooldownMinutes: 360 // 6 hours
            }
        ];
    }

    /**
     * Generate alerts for a farm based on current conditions
     */
    async generateFarmAlerts(
        farmId: string,
        batches: BatchHealthData[],
        resources: ResourceData[],
        location: string
    ): Promise<AIAlert[]> {
        const alerts: AIAlert[] = [];

        // Weather-based alerts
        const weatherAlerts = await this.generateWeatherAlerts(farmId, location);
        alerts.push(...weatherAlerts);

        // Batch health alerts
        const batchAlerts = await this.generateBatchAlerts(farmId, batches);
        alerts.push(...batchAlerts);

        // Resource alerts
        const resourceAlerts = this.generateResourceAlerts(farmId, resources);
        alerts.push(...resourceAlerts);

        // Harvest timing alerts
        const harvestAlerts = await this.generateHarvestAlerts(farmId, batches);
        alerts.push(...harvestAlerts);

        return alerts;
    }

    /**
     * Generate weather-based alerts
     */
    async generateWeatherAlerts(farmId: string, location: string): Promise<AIAlert[]> {
        const alerts: AIAlert[] = [];

        try {
            const weatherAlerts = await weatherService.getWeatherAlerts(location);

            for (const wa of weatherAlerts) {
                alerts.push({
                    id: buildStableAlertId({
                        type: 'WEATHER_WARNING',
                        farmId,
                        weatherId: wa.id,
                    }),
                    type: 'WEATHER_WARNING',
                    severity: this.mapWeatherSeverity(wa.severity),
                    title: wa.title,
                    message: wa.description,
                    aiInsight: `AI recommends: ${wa.recommendations[0]}`,
                    data: {
                        weatherType: wa.type,
                        affectedCrops: wa.affectedCrops,
                        startTime: wa.startTime,
                        endTime: wa.endTime
                    },
                    actionRequired: wa.severity === 'HIGH' || wa.severity === 'CRITICAL',
                    actions: wa.recommendations.slice(0, 3).map((rec, i) => ({
                        id: `action_${i}`,
                        label: rec,
                        type: i === 0 ? 'PRIMARY' : 'SECONDARY',
                        action: `/tasks/create?type=weather&description=${encodeURIComponent(rec)}`,
                        completed: false
                    })),
                    createdAt: new Date(),
                    expiresAt: wa.endTime,
                    acknowledged: false,
                    farmId,
                    channels: ['IN_APP', 'PUSH']
                });
            }
        } catch (error) {
            console.error('❌ Error generating weather alerts:', error);
        }

        return alerts;
    }

    /**
     * Generate batch health alerts
     */
    async generateBatchAlerts(farmId: string, batches: BatchHealthData[]): Promise<AIAlert[]> {
        const alerts: AIAlert[] = [];

        for (const batch of batches) {
            // Low health score alert
            if (batch.healthScore !== undefined && batch.healthScore < 70) {
                const aiInsight = await this.getAIBatchInsight(batch);

                alerts.push({
                    id: buildStableAlertId({
                        type: 'BATCH_ATTENTION',
                        farmId,
                        batchId: `health_${batch.batchId}`,
                    }),
                    type: 'BATCH_ATTENTION',
                    severity: batch.healthScore < 50 ? 'HIGH' : 'MEDIUM',
                    title: `Batch ${batch.batchNumber} Needs Attention`,
                    message: `Health score is ${batch.healthScore}% for ${batch.cropType}`,
                    aiInsight,
                    data: {
                        batchNumber: batch.batchNumber,
                        cropType: batch.cropType,
                        healthScore: batch.healthScore,
                        issues: batch.issues
                    },
                    actionRequired: true,
                    actions: [
                        {
                            id: 'inspect',
                            label: 'Inspect Batch',
                            type: 'PRIMARY',
                            action: `/production/batches/${batch.batchId}`,
                            completed: false
                        },
                        {
                            id: 'ai_analysis',
                            label: 'Run AI Analysis',
                            type: 'SECONDARY',
                            action: `/ai-insights?batch=${batch.batchId}`,
                            completed: false
                        }
                    ],
                    createdAt: new Date(),
                    acknowledged: false,
                    farmId,
                    batchId: batch.batchId,
                    channels: ['IN_APP']
                });
            }

            // Environmental issues
            if (batch.temperature && (batch.temperature < 55 || batch.temperature > 85)) {
                alerts.push({
                    id: buildStableAlertId({
                        type: 'BATCH_ATTENTION',
                        farmId,
                        batchId: `temp_${batch.batchId}`,
                    }),
                    type: 'BATCH_ATTENTION',
                    severity: 'MEDIUM',
                    title: `Temperature Alert: Batch ${batch.batchNumber}`,
                    message: `Temperature is ${batch.temperature}°F - outside optimal range for ${batch.cropType}`,
                    actionRequired: true,
                    actions: [
                        {
                            id: 'adjust',
                            label: 'Adjust Environment',
                            type: 'PRIMARY',
                            action: `/equipment/climate-control`,
                            completed: false
                        }
                    ],
                    createdAt: new Date(),
                    acknowledged: false,
                    farmId,
                    batchId: batch.batchId,
                    channels: ['IN_APP']
                });
            }
        }

        return alerts;
    }

    /**
     * Generate harvest timing alerts
     */
    async generateHarvestAlerts(farmId: string, batches: BatchHealthData[]): Promise<AIAlert[]> {
        const alerts: AIAlert[] = [];

        for (const batch of batches) {
            if (batch.daysToHarvest <= 2 && batch.daysToHarvest >= 0) {
                const urgency = batch.daysToHarvest === 0 ? 'HIGH' : 'MEDIUM';

                alerts.push({
                    id: buildStableAlertId({
                        type: 'HARVEST_OPTIMAL',
                        farmId,
                        batchId: batch.batchId,
                    }),
                    type: 'HARVEST_OPTIMAL',
                    severity: urgency,
                    title: batch.daysToHarvest === 0
                        ? `🌾 Harvest Today: ${batch.batchNumber}`
                        : `🌾 Harvest in ${batch.daysToHarvest} day(s): ${batch.batchNumber}`,
                    message: `${batch.cropType} batch is ${batch.daysToHarvest === 0 ? 'ready for harvest' : 'approaching optimal harvest window'}`,
                    aiInsight: 'AI analysis indicates optimal harvest timing for maximum quality and yield',
                    data: {
                        batchNumber: batch.batchNumber,
                        cropType: batch.cropType,
                        expectedHarvestDate: batch.expectedHarvestDate,
                        daysToHarvest: batch.daysToHarvest
                    },
                    actionRequired: batch.daysToHarvest === 0,
                    actions: [
                        {
                            id: 'schedule',
                            label: 'Schedule Harvest',
                            type: 'PRIMARY',
                            action: `/tasks/create?type=HARVESTING&batchId=${batch.batchId}`,
                            completed: false
                        },
                        {
                            id: 'quality_check',
                            label: 'Quality Check',
                            type: 'SECONDARY',
                            action: `/quality/check?batchId=${batch.batchId}`,
                            completed: false
                        }
                    ],
                    createdAt: new Date(),
                    acknowledged: false,
                    farmId,
                    batchId: batch.batchId,
                    channels: ['IN_APP']
                });
            }
        }

        return alerts;
    }

    /**
     * Generate resource alerts
     */
    generateResourceAlerts(farmId: string, resources: ResourceData[]): AIAlert[] {
        const alerts: AIAlert[] = [];

        for (const resource of resources) {
            if (resource.currentLevel <= resource.reorderPoint) {
                const severity: AlertSeverity = resource.currentLevel <= resource.reorderPoint * 0.5
                    ? 'HIGH'
                    : 'MEDIUM';

                alerts.push({
                    id: buildStableAlertId({
                        type: 'RESOURCE_LOW',
                        farmId,
                        resourceType: resource.resourceType,
                    }),
                    type: 'RESOURCE_LOW',
                    severity,
                    title: `Low Stock: ${resource.resourceType}`,
                    message: `Current level: ${resource.currentLevel} ${resource.unit} (reorder point: ${resource.reorderPoint} ${resource.unit})`,
                    aiInsight: resource.daysUntilEmpty
                        ? `AI estimates ${resource.daysUntilEmpty} days until depleted based on usage patterns`
                        : undefined,
                    data: {
                        resourceType: resource.resourceType,
                        currentLevel: resource.currentLevel,
                        reorderPoint: resource.reorderPoint,
                        daysUntilEmpty: resource.daysUntilEmpty
                    },
                    actionRequired: true,
                    actions: [
                        {
                            id: 'reorder',
                            label: 'Create Purchase Order',
                            type: 'PRIMARY',
                            action: `/inventory/purchase-orders/create?item=${encodeURIComponent(resource.resourceType)}`,
                            completed: false
                        }
                    ],
                    createdAt: new Date(),
                    acknowledged: false,
                    farmId,
                    channels: ['IN_APP', 'EMAIL']
                });
            }
        }

        return alerts;
    }

    /**
     * Generate market opportunity alerts
     */
    async generateMarketAlerts(farmId: string, marketData: MarketData[]): Promise<AIAlert[]> {
        const alerts: AIAlert[] = [];

        for (const market of marketData) {
            // Price increase opportunity
            if (market.priceChange >= 10) {
                alerts.push({
                    id: buildStableAlertId({
                        type: 'MARKET_OPPORTUNITY',
                        farmId,
                        cropType: `price_${market.cropType}`,
                    }),
                    type: 'MARKET_OPPORTUNITY',
                    severity: 'INFO',
                    title: `📈 Price Surge: ${market.cropType}`,
                    message: `Prices up ${market.priceChange}% - consider accelerating harvest or sales`,
                    aiInsight: `AI market analysis: ${market.demandTrend} demand with ${market.competitorActivity} competitor activity`,
                    data: {
                        cropType: market.cropType,
                        currentPrice: market.currentPrice,
                        priceChange: market.priceChange,
                        demandTrend: market.demandTrend
                    },
                    actionRequired: false,
                    actions: [
                        {
                            id: 'view_forecast',
                            label: 'View Demand Forecast',
                            type: 'PRIMARY',
                            action: `/ai-insights?crop=${encodeURIComponent(market.cropType)}`,
                            completed: false
                        }
                    ],
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                    acknowledged: false,
                    farmId,
                    channels: ['IN_APP']
                });
            }

            // High demand alert
            if (market.demandTrend === 'increasing' && market.competitorActivity === 'low') {
                alerts.push({
                    id: buildStableAlertId({
                        type: 'MARKET_OPPORTUNITY',
                        farmId,
                        cropType: `demand_${market.cropType}`,
                    }),
                    type: 'MARKET_OPPORTUNITY',
                    severity: 'INFO',
                    title: `🎯 Market Opportunity: ${market.cropType}`,
                    message: `Increasing demand with low competition - ideal time to expand production`,
                    aiInsight: 'AI recommends increasing production capacity to capture market share',
                    data: market,
                    actionRequired: false,
                    createdAt: new Date(),
                    acknowledged: false,
                    farmId,
                    channels: ['IN_APP']
                });
            }
        }

        return alerts;
    }

    /**
     * Get AI-generated insight for a batch
     */
    private async getAIBatchInsight(batch: BatchHealthData): Promise<string> {
        try {
            const prompt = `Briefly analyze this crop batch and provide one actionable recommendation:
            Crop: ${batch.cropType}
            Health Score: ${batch.healthScore}%
            Days to Harvest: ${batch.daysToHarvest}
            Issues: ${batch.issues?.join(', ') || 'None reported'}
            Temperature: ${batch.temperature || 'Unknown'}°F
            Humidity: ${batch.humidity || 'Unknown'}%
            
            Provide a single, specific recommendation in under 50 words.`;

            const response = await ollamaService.generateCompletion(prompt);
            return response.trim();
        } catch (error) {
            return 'Monitor batch closely and consider environmental adjustments if issues persist.';
        }
    }

    /**
     * Check if alert should be sent based on cooldown
     */
    private checkCooldown(alert: AIAlert): boolean {
        const rule = this.alertRules.find(r => r.type === alert.type);
        if (!rule) return true;

        const cooldownKey = `${alert.type}_${alert.batchId || alert.farmId}`;
        const lastAlert = this.recentAlerts.get(cooldownKey);

        if (lastAlert) {
            const cooldownMs = rule.cooldownMinutes * 60 * 1000;
            if (Date.now() - lastAlert.getTime() < cooldownMs) {
                return false;
            }
        }

        this.recentAlerts.set(cooldownKey, new Date());
        return true;
    }

    private mapWeatherSeverity(severity: string): AlertSeverity {
        const map: Record<string, AlertSeverity> = {
            'LOW': 'LOW',
            'MEDIUM': 'MEDIUM',
            'HIGH': 'HIGH',
            'CRITICAL': 'CRITICAL'
        };
        return map[severity] || 'MEDIUM';
    }

    /**
     * Get alert statistics for a farm
     */
    getAlertStats(alerts: AIAlert[]): {
        total: number;
        bySeverity: Record<AlertSeverity, number>;
        byType: Record<AlertType, number>;
        actionRequired: number;
        acknowledged: number;
    } {
        const stats = {
            total: alerts.length,
            bySeverity: {} as Record<AlertSeverity, number>,
            byType: {} as Record<AlertType, number>,
            actionRequired: 0,
            acknowledged: 0
        };

        for (const alert of alerts) {
            stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
            stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
            if (alert.actionRequired) stats.actionRequired++;
            if (alert.acknowledged) stats.acknowledged++;
        }

        return stats;
    }
}

export const alertEngine = new AIAlertEngine();
