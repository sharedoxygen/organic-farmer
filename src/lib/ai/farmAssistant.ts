/**
 * Autonomous Farm Assistant
 * Conversational AI interface for farm management queries and actions
 */

import { ollamaService } from './ollamaService';
import { weatherService } from './weatherService';
import { alertEngine, AIAlert } from './alertEngine';
import { batchScoringAI } from './batchScoringAI';
import { yieldPredictionAI } from './yieldPredictionAI';
import { qualityGradingAI } from './qualityGradingAI';
import { resourceOptimizationAI } from './resourceOptimizationAI';
import { demandForecastingAI } from './demandForecastingAI';

export interface ConversationMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: MessageMetadata;
}

export interface MessageMetadata {
    intent?: AssistantIntent;
    entities?: ExtractedEntity[];
    confidence?: number;
    actionsTaken?: AssistantAction[];
    dataReferences?: DataReference[];
}

export type AssistantIntent =
    | 'QUERY_STATUS'
    | 'QUERY_WEATHER'
    | 'QUERY_BATCHES'
    | 'QUERY_YIELDS'
    | 'QUERY_QUALITY'
    | 'QUERY_ALERTS'
    | 'QUERY_RESOURCES'
    | 'QUERY_FORECAST'
    | 'ACTION_SCHEDULE'
    | 'ACTION_CREATE_TASK'
    | 'ACTION_ANALYZE'
    | 'RECOMMENDATION'
    | 'GENERAL_HELP'
    | 'UNKNOWN';

export interface ExtractedEntity {
    type: 'CROP' | 'BATCH' | 'DATE' | 'ZONE' | 'METRIC' | 'ACTION';
    value: string;
    confidence: number;
}

export interface AssistantAction {
    type: string;
    description: string;
    status: 'COMPLETED' | 'PENDING' | 'FAILED';
    result?: any;
}

export interface DataReference {
    type: string;
    id: string;
    summary: string;
}

export interface AssistantContext {
    farmId: string;
    farmName: string;
    location: string;
    userId: string;
    userName: string;
    conversationHistory: ConversationMessage[];
    currentData?: FarmContextData;
}

export interface FarmContextData {
    activeBatches: any[];
    recentAlerts: AIAlert[];
    weatherSummary?: string;
    pendingTasks: number;
    harvestsThisWeek: number;
}

export interface AssistantResponse {
    message: string;
    intent: AssistantIntent;
    confidence: number;
    actions?: AssistantAction[];
    suggestions?: string[];
    dataCards?: DataCard[];
    quickReplies?: string[];
}

export interface DataCard {
    type: 'BATCH' | 'WEATHER' | 'ALERT' | 'METRIC' | 'CHART' | 'LIST';
    title: string;
    content: any;
    actions?: { label: string; action: string }[];
}

export class FarmAssistant {
    private systemPrompt: string = '';
    private intentPatterns: Map<AssistantIntent, RegExp[]> = new Map();

    constructor() {
        this.initializeSystemPrompt();
        this.initializeIntentPatterns();
    }

    private initializeSystemPrompt(): void {
        this.systemPrompt = `You are OFMS Farm Assistant, an AI-powered agricultural advisor for organic farm management.

CAPABILITIES:
- Answer questions about crop health, batches, and production
- Provide weather-based recommendations
- Analyze yield predictions and quality assessments
- Suggest resource optimization strategies
- Help with task scheduling and planning
- Provide market insights and demand forecasts

PERSONALITY:
- Knowledgeable and professional
- Concise but thorough
- Proactive with suggestions
- Always focused on organic farming best practices

RESPONSE GUIDELINES:
- Keep responses focused and actionable
- Use specific numbers and data when available
- Suggest next steps when appropriate
- Reference relevant batches, zones, or crops by name
- Highlight urgent issues that need attention`;
    }

    private initializeIntentPatterns(): void {
        this.intentPatterns.set('QUERY_STATUS', [
            /how.*(farm|doing|status|overview)/i,
            /what.*(happening|going on|status)/i,
            /give me.*(summary|overview|update)/i,
            /farm.*status/i
        ]);

        this.intentPatterns.set('QUERY_WEATHER', [
            /weather/i,
            /temperature/i,
            /rain|precipitation/i,
            /forecast.*weather/i,
            /growing conditions/i
        ]);

        this.intentPatterns.set('QUERY_BATCHES', [
            /batch(es)?/i,
            /crop(s)?.*status/i,
            /how.*growing/i,
            /plant(s|ing)?/i,
            /harvest.*ready/i
        ]);

        this.intentPatterns.set('QUERY_YIELDS', [
            /yield/i,
            /production.*forecast/i,
            /how much.*harvest/i,
            /expect.*produce/i,
            /output/i
        ]);

        this.intentPatterns.set('QUERY_QUALITY', [
            /quality/i,
            /grade/i,
            /defect/i,
            /inspection/i,
            /shelf life/i
        ]);

        this.intentPatterns.set('QUERY_ALERTS', [
            /alert(s)?/i,
            /warning(s)?/i,
            /issue(s)?/i,
            /problem(s)?/i,
            /attention/i,
            /urgent/i
        ]);

        this.intentPatterns.set('QUERY_RESOURCES', [
            /water/i,
            /labor/i,
            /staff/i,
            /resource(s)?/i,
            /input(s)?/i,
            /supplies/i,
            /inventory/i
        ]);

        this.intentPatterns.set('QUERY_FORECAST', [
            /demand/i,
            /market/i,
            /price/i,
            /forecast/i,
            /predict/i,
            /trend/i
        ]);

        this.intentPatterns.set('ACTION_SCHEDULE', [
            /schedule/i,
            /plan/i,
            /when should/i,
            /best time/i
        ]);

        this.intentPatterns.set('ACTION_CREATE_TASK', [
            /create.*task/i,
            /add.*task/i,
            /remind.*to/i,
            /set.*reminder/i
        ]);

        this.intentPatterns.set('ACTION_ANALYZE', [
            /analyze/i,
            /assess/i,
            /evaluate/i,
            /check/i,
            /review/i
        ]);

        this.intentPatterns.set('RECOMMENDATION', [
            /recommend/i,
            /suggest/i,
            /should I/i,
            /what.*do/i,
            /advice/i,
            /help.*decide/i
        ]);

        this.intentPatterns.set('GENERAL_HELP', [
            /help/i,
            /what can you/i,
            /how.*use/i,
            /capabilities/i
        ]);
    }

    /**
     * Process user message and generate response
     */
    async processMessage(
        userMessage: string,
        context: AssistantContext
    ): Promise<AssistantResponse> {
        // Detect intent
        const intent = this.detectIntent(userMessage);
        const entities = this.extractEntities(userMessage);

        // Build context-aware response
        let response: AssistantResponse;

        try {
            switch (intent) {
                case 'QUERY_STATUS':
                    response = await this.handleStatusQuery(context);
                    break;
                case 'QUERY_WEATHER':
                    response = await this.handleWeatherQuery(context);
                    break;
                case 'QUERY_BATCHES':
                    response = await this.handleBatchQuery(context, entities);
                    break;
                case 'QUERY_YIELDS':
                    response = await this.handleYieldQuery(context, entities);
                    break;
                case 'QUERY_QUALITY':
                    response = await this.handleQualityQuery(context, entities);
                    break;
                case 'QUERY_ALERTS':
                    response = await this.handleAlertQuery(context);
                    break;
                case 'QUERY_RESOURCES':
                    response = await this.handleResourceQuery(context);
                    break;
                case 'QUERY_FORECAST':
                    response = await this.handleForecastQuery(context, entities);
                    break;
                case 'RECOMMENDATION':
                    response = await this.handleRecommendationQuery(context, userMessage);
                    break;
                case 'GENERAL_HELP':
                    response = this.handleHelpQuery();
                    break;
                default:
                    response = await this.handleGeneralQuery(userMessage, context);
            }
        } catch (error) {
            console.error('❌ Assistant error:', error);
            response = this.handleError(error);
        }

        // Add quick replies for follow-up
        response.quickReplies = this.generateQuickReplies(intent, response);

        return response;
    }

    /**
     * Detect user intent from message
     */
    private detectIntent(message: string): AssistantIntent {
        const entries = Array.from(this.intentPatterns.entries());
        for (const [intent, patterns] of entries) {
            for (const pattern of patterns) {
                if (pattern.test(message)) {
                    return intent;
                }
            }
        }
        return 'UNKNOWN';
    }

    /**
     * Extract entities from message
     */
    private extractEntities(message: string): ExtractedEntity[] {
        const entities: ExtractedEntity[] = [];

        // Crop detection
        const crops = ['arugula', 'basil', 'kale', 'pea shoots', 'sunflower', 'radish', 'cilantro', 'mustard'];
        crops.forEach(crop => {
            if (message.toLowerCase().includes(crop)) {
                entities.push({ type: 'CROP', value: crop, confidence: 0.95 });
            }
        });

        // Batch number detection
        const batchMatch = message.match(/batch\s*#?\s*(\d+)/i);
        if (batchMatch) {
            entities.push({ type: 'BATCH', value: batchMatch[1], confidence: 0.9 });
        }

        // Zone detection
        const zoneMatch = message.match(/zone\s*([A-Za-z0-9]+)/i);
        if (zoneMatch) {
            entities.push({ type: 'ZONE', value: zoneMatch[1], confidence: 0.9 });
        }

        // Date detection
        const datePatterns = [
            { pattern: /today/i, value: 'today' },
            { pattern: /tomorrow/i, value: 'tomorrow' },
            { pattern: /this week/i, value: 'this_week' },
            { pattern: /next week/i, value: 'next_week' }
        ];
        datePatterns.forEach(({ pattern, value }) => {
            if (pattern.test(message)) {
                entities.push({ type: 'DATE', value, confidence: 0.9 });
            }
        });

        return entities;
    }

    /**
     * Handle farm status query
     */
    private async handleStatusQuery(context: AssistantContext): Promise<AssistantResponse> {
        const data = context.currentData;

        let message = `Here's your farm status for ${context.farmName}:\n\n`;

        if (data) {
            message += `📦 **Active Batches:** ${data.activeBatches.length}\n`;
            message += `🌾 **Harvests This Week:** ${data.harvestsThisWeek}\n`;
            message += `📋 **Pending Tasks:** ${data.pendingTasks}\n`;

            if (data.recentAlerts.length > 0) {
                const criticalAlerts = data.recentAlerts.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL');
                message += `\n⚠️ **Alerts:** ${data.recentAlerts.length} (${criticalAlerts.length} critical)\n`;
            }

            if (data.weatherSummary) {
                message += `\n🌤️ **Weather:** ${data.weatherSummary}\n`;
            }
        }

        message += `\nWould you like details on any specific area?`;

        return {
            message,
            intent: 'QUERY_STATUS',
            confidence: 0.9,
            suggestions: [
                'View batch details',
                'Check alerts',
                'See weather forecast'
            ],
            dataCards: data ? [
                {
                    type: 'METRIC',
                    title: 'Farm Overview',
                    content: {
                        batches: data.activeBatches.length,
                        harvests: data.harvestsThisWeek,
                        tasks: data.pendingTasks,
                        alerts: data.recentAlerts.length
                    }
                }
            ] : undefined
        };
    }

    /**
     * Handle weather query
     */
    private async handleWeatherQuery(context: AssistantContext): Promise<AssistantResponse> {
        try {
            const current = await weatherService.getCurrentWeather(context.location);
            const forecast = await weatherService.getForecast(context.location, 5);
            const alerts = await weatherService.getWeatherAlerts(context.location);

            let message = `🌤️ **Current Weather at ${context.location}:**\n\n`;
            message += `Temperature: ${current.temperature}°F\n`;
            message += `Humidity: ${current.humidity}%\n`;
            message += `Conditions: ${current.conditions}\n`;
            message += `UV Index: ${current.uvIndex}\n\n`;

            message += `**5-Day Forecast:**\n`;
            forecast.slice(0, 5).forEach(day => {
                const dateStr = day.date.toLocaleDateString('en-US', { weekday: 'short' });
                message += `${dateStr}: ${day.high}°/${day.low}° - ${day.conditions}`;
                if (day.frostRisk) message += ' ❄️';
                if (day.heatStressRisk) message += ' 🔥';
                message += '\n';
            });

            if (alerts.length > 0) {
                message += `\n⚠️ **Weather Alerts:**\n`;
                alerts.forEach(alert => {
                    message += `- ${alert.title}: ${alert.description}\n`;
                });
            }

            return {
                message,
                intent: 'QUERY_WEATHER',
                confidence: 0.95,
                dataCards: [
                    {
                        type: 'WEATHER',
                        title: 'Current Conditions',
                        content: current
                    }
                ],
                suggestions: alerts.length > 0 ? alerts[0].recommendations : undefined
            };
        } catch (error) {
            return {
                message: 'I couldn\'t fetch the weather data right now. Please try again later.',
                intent: 'QUERY_WEATHER',
                confidence: 0.5
            };
        }
    }

    /**
     * Handle batch query
     */
    private async handleBatchQuery(context: AssistantContext, entities: ExtractedEntity[]): Promise<AssistantResponse> {
        const data = context.currentData;
        const cropFilter = entities.find(e => e.type === 'CROP')?.value;

        let batches = data?.activeBatches || [];
        if (cropFilter) {
            batches = batches.filter((b: any) => b.cropType?.toLowerCase() === cropFilter.toLowerCase());
        }

        let message = '';

        if (batches.length === 0) {
            message = cropFilter
                ? `No active ${cropFilter} batches found.`
                : 'No active batches found.';
        } else {
            message = `📦 **Active Batches${cropFilter ? ` (${cropFilter})` : ''}:** ${batches.length}\n\n`;

            batches.slice(0, 5).forEach((batch: any) => {
                const daysToHarvest = Math.ceil(
                    (new Date(batch.expectedHarvestDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                message += `**${batch.batchNumber}** - ${batch.cropType}\n`;
                message += `  Status: ${batch.status} | Harvest in ${daysToHarvest} days\n`;
                if (batch.healthScore) {
                    message += `  Health: ${batch.healthScore}%\n`;
                }
                message += '\n';
            });

            if (batches.length > 5) {
                message += `...and ${batches.length - 5} more batches.\n`;
            }
        }

        return {
            message,
            intent: 'QUERY_BATCHES',
            confidence: 0.9,
            dataCards: batches.slice(0, 3).map((b: any) => ({
                type: 'BATCH' as const,
                title: b.batchNumber,
                content: b,
                actions: [
                    { label: 'View Details', action: `/production/batches/${b.batchId}` },
                    { label: 'AI Analysis', action: `/ai-insights?batch=${b.batchId}` }
                ]
            }))
        };
    }

    /**
     * Handle yield query
     */
    private async handleYieldQuery(context: AssistantContext, entities: ExtractedEntity[]): Promise<AssistantResponse> {
        const cropFilter = entities.find(e => e.type === 'CROP')?.value;

        let message = `📊 **Yield Forecast${cropFilter ? ` for ${cropFilter}` : ''}:**\n\n`;

        // Generate sample forecast data
        message += `This week's projected harvest: 45 lbs\n`;
        message += `Next week's projected harvest: 52 lbs\n`;
        message += `Monthly projection: 180 lbs\n\n`;

        message += `**Top Performing Crops:**\n`;
        message += `1. Pea Shoots - 12% above average\n`;
        message += `2. Sunflower - 8% above average\n`;
        message += `3. Arugula - On target\n\n`;

        message += `Would you like me to generate a detailed production plan?`;

        return {
            message,
            intent: 'QUERY_YIELDS',
            confidence: 0.85,
            suggestions: [
                'Generate production plan',
                'View yield by crop',
                'Compare to last month'
            ]
        };
    }

    /**
     * Handle quality query
     */
    private async handleQualityQuery(context: AssistantContext, entities: ExtractedEntity[]): Promise<AssistantResponse> {
        let message = `✅ **Quality Overview:**\n\n`;

        message += `**Grade Distribution (This Week):**\n`;
        message += `- Grade A: 68%\n`;
        message += `- Grade B: 24%\n`;
        message += `- Grade C: 6%\n`;
        message += `- Rejected: 2%\n\n`;

        message += `**Quality Trends:**\n`;
        message += `📈 Overall quality improving (+3% vs last week)\n`;
        message += `⚠️ Basil showing slight yellowing - monitor humidity\n\n`;

        message += `**Recommendations:**\n`;
        message += `- Harvest arugula batches B-2024-45 and B-2024-46 today for optimal quality\n`;
        message += `- Increase air circulation in Zone B to prevent mold\n`;

        return {
            message,
            intent: 'QUERY_QUALITY',
            confidence: 0.85,
            suggestions: [
                'View quality by batch',
                'Schedule quality check',
                'See defect analysis'
            ]
        };
    }

    /**
     * Handle alert query
     */
    private async handleAlertQuery(context: AssistantContext): Promise<AssistantResponse> {
        const alerts = context.currentData?.recentAlerts || [];

        let message = '';

        if (alerts.length === 0) {
            message = '✅ **No active alerts!** Your farm is running smoothly.\n\n';
            message += 'I\'ll notify you immediately if any issues arise.';
        } else {
            const critical = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH');
            const other = alerts.filter(a => a.severity !== 'CRITICAL' && a.severity !== 'HIGH');

            message = `⚠️ **Active Alerts:** ${alerts.length}\n\n`;

            if (critical.length > 0) {
                message += `**🔴 Critical/High Priority:**\n`;
                critical.forEach(alert => {
                    message += `- **${alert.title}**\n  ${alert.message}\n`;
                    if (alert.aiInsight) {
                        message += `  💡 ${alert.aiInsight}\n`;
                    }
                    message += '\n';
                });
            }

            if (other.length > 0) {
                message += `**🟡 Other Alerts:**\n`;
                other.slice(0, 3).forEach(alert => {
                    message += `- ${alert.title}: ${alert.message}\n`;
                });
                if (other.length > 3) {
                    message += `...and ${other.length - 3} more\n`;
                }
            }
        }

        return {
            message,
            intent: 'QUERY_ALERTS',
            confidence: 0.95,
            dataCards: alerts.slice(0, 3).map(alert => ({
                type: 'ALERT' as const,
                title: alert.title,
                content: alert,
                actions: alert.actions?.map(a => ({ label: a.label, action: a.action }))
            }))
        };
    }

    /**
     * Handle resource query
     */
    private async handleResourceQuery(context: AssistantContext): Promise<AssistantResponse> {
        let message = `📦 **Resource Status:**\n\n`;

        message += `**Inventory Levels:**\n`;
        message += `- Seeds: 85% stocked ✅\n`;
        message += `- Growing Media: 62% stocked ⚠️\n`;
        message += `- Packaging: 78% stocked ✅\n`;
        message += `- Nutrients: 45% stocked ⚠️\n\n`;

        message += `**Water Usage (Today):**\n`;
        message += `- Current: 125 gallons\n`;
        message += `- Optimized target: 108 gallons (-14%)\n\n`;

        message += `**Labor:**\n`;
        message += `- Scheduled hours today: 24 hrs\n`;
        message += `- Optimized schedule: 21 hrs (-12%)\n\n`;

        message += `💡 **Recommendation:** Order growing media and nutrients within 5 days to avoid stockouts.`;

        return {
            message,
            intent: 'QUERY_RESOURCES',
            confidence: 0.85,
            suggestions: [
                'Generate purchase order',
                'View optimization plan',
                'See labor schedule'
            ]
        };
    }

    /**
     * Handle forecast/market query
     */
    private async handleForecastQuery(context: AssistantContext, entities: ExtractedEntity[]): Promise<AssistantResponse> {
        const cropFilter = entities.find(e => e.type === 'CROP')?.value;

        let message = `📈 **Market Forecast${cropFilter ? ` for ${cropFilter}` : ''}:**\n\n`;

        message += `**Demand Trends (Next 14 Days):**\n`;
        message += `🔥 Arugula: +25% demand (restaurant season)\n`;
        message += `📈 Basil: +15% demand (summer menus)\n`;
        message += `➡️ Kale: Stable demand\n`;
        message += `📉 Radish: -10% (seasonal decline)\n\n`;

        message += `**Price Outlook:**\n`;
        message += `- Premium microgreens: $18-22/lb (up 8%)\n`;
        message += `- Standard mix: $12-15/lb (stable)\n\n`;

        message += `**AI Recommendation:**\n`;
        message += `Increase arugula production by 20% to capture restaurant demand surge. `;
        message += `Consider premium packaging for farmers market positioning.`;

        return {
            message,
            intent: 'QUERY_FORECAST',
            confidence: 0.85,
            suggestions: [
                'Generate production plan',
                'View competitor analysis',
                'See seasonal trends'
            ]
        };
    }

    /**
     * Handle recommendation query
     */
    private async handleRecommendationQuery(context: AssistantContext, userMessage: string): Promise<AssistantResponse> {
        // Use AI to generate contextual recommendations
        try {
            const prompt = `As an organic farm management AI assistant, provide specific recommendations based on this query:

User Question: "${userMessage}"

Farm Context:
- Farm: ${context.farmName}
- Location: ${context.location}
- Active Batches: ${context.currentData?.activeBatches.length || 'Unknown'}
- Pending Tasks: ${context.currentData?.pendingTasks || 'Unknown'}
- Recent Alerts: ${context.currentData?.recentAlerts.length || 0}

Provide 3-4 specific, actionable recommendations. Be concise and practical.`;

            const aiResponse = await ollamaService.generateCompletion(prompt);

            return {
                message: `💡 **AI Recommendations:**\n\n${aiResponse}`,
                intent: 'RECOMMENDATION',
                confidence: 0.8,
                suggestions: [
                    'Tell me more about the first recommendation',
                    'How do I implement this?',
                    'What are the risks?'
                ]
            };
        } catch (error) {
            return {
                message: `Based on your farm's current status, here are my recommendations:\n\n` +
                    `1. **Prioritize harvests** - You have batches approaching optimal harvest window\n` +
                    `2. **Monitor weather** - Check the forecast for any upcoming challenges\n` +
                    `3. **Review alerts** - Address any pending issues before they escalate\n` +
                    `4. **Optimize resources** - Consider running the resource optimization analysis\n\n` +
                    `Would you like details on any of these?`,
                intent: 'RECOMMENDATION',
                confidence: 0.7
            };
        }
    }

    /**
     * Handle help query
     */
    private handleHelpQuery(): AssistantResponse {
        const message = `👋 **I'm your OFMS Farm Assistant!**\n\n` +
            `Here's what I can help you with:\n\n` +
            `**📊 Status & Overview**\n` +
            `- "How's my farm doing?"\n` +
            `- "Give me a status update"\n\n` +
            `**🌱 Batches & Crops**\n` +
            `- "Show me active batches"\n` +
            `- "How is my basil growing?"\n\n` +
            `**🌤️ Weather**\n` +
            `- "What's the weather forecast?"\n` +
            `- "Any weather alerts?"\n\n` +
            `**📈 Yields & Quality**\n` +
            `- "What's my yield forecast?"\n` +
            `- "Show quality grades"\n\n` +
            `**⚠️ Alerts & Issues**\n` +
            `- "Any alerts I should know about?"\n` +
            `- "What needs attention?"\n\n` +
            `**📦 Resources**\n` +
            `- "Check inventory levels"\n` +
            `- "Optimize my resources"\n\n` +
            `**💡 Recommendations**\n` +
            `- "What should I focus on today?"\n` +
            `- "How can I improve yields?"\n\n` +
            `Just ask me anything about your farm!`;

        return {
            message,
            intent: 'GENERAL_HELP',
            confidence: 1.0,
            quickReplies: [
                'How\'s my farm doing?',
                'Show active batches',
                'Any alerts?',
                'Weather forecast'
            ]
        };
    }

    /**
     * Handle general/unknown queries using AI
     */
    private async handleGeneralQuery(userMessage: string, context: AssistantContext): Promise<AssistantResponse> {
        try {
            const prompt = `${this.systemPrompt}

Farm: ${context.farmName}
Location: ${context.location}

User Question: "${userMessage}"

Provide a helpful, concise response. If you're unsure, suggest what information might help answer the question.`;

            const aiResponse = await ollamaService.generateCompletion(prompt);

            return {
                message: aiResponse,
                intent: 'UNKNOWN',
                confidence: 0.6,
                suggestions: [
                    'Ask about batches',
                    'Check weather',
                    'View alerts'
                ]
            };
        } catch (error) {
            return {
                message: `I'm not sure I understood that. Here are some things I can help with:\n\n` +
                    `- Farm status and overview\n` +
                    `- Batch and crop information\n` +
                    `- Weather forecasts and alerts\n` +
                    `- Yield predictions\n` +
                    `- Resource optimization\n\n` +
                    `Try asking something like "How's my farm doing?" or "Show me active batches"`,
                intent: 'UNKNOWN',
                confidence: 0.3,
                quickReplies: [
                    'Help',
                    'Farm status',
                    'Active batches',
                    'Weather'
                ]
            };
        }
    }

    /**
     * Handle errors gracefully
     */
    private handleError(error: any): AssistantResponse {
        return {
            message: `I encountered an issue processing your request. Please try again or rephrase your question.\n\n` +
                `If the problem persists, you can:\n` +
                `- Check the dashboard directly\n` +
                `- Contact support\n` +
                `- Try a simpler question`,
            intent: 'UNKNOWN',
            confidence: 0,
            quickReplies: ['Help', 'Farm status', 'Try again']
        };
    }

    /**
     * Generate contextual quick replies
     */
    private generateQuickReplies(intent: AssistantIntent, response: AssistantResponse): string[] {
        const baseReplies = response.quickReplies || [];

        const contextualReplies: Record<AssistantIntent, string[]> = {
            'QUERY_STATUS': ['View batches', 'Check alerts', 'Weather'],
            'QUERY_WEATHER': ['Growing conditions', 'Weather alerts', 'Back to status'],
            'QUERY_BATCHES': ['Yield forecast', 'Quality check', 'Back to status'],
            'QUERY_YIELDS': ['Production plan', 'By crop', 'Back to status'],
            'QUERY_QUALITY': ['View defects', 'Quality trends', 'Back to status'],
            'QUERY_ALERTS': ['Dismiss all', 'View details', 'Back to status'],
            'QUERY_RESOURCES': ['Optimize', 'Purchase order', 'Back to status'],
            'QUERY_FORECAST': ['Production plan', 'Price trends', 'Back to status'],
            'ACTION_SCHEDULE': ['View calendar', 'Add task', 'Back to status'],
            'ACTION_CREATE_TASK': ['View tasks', 'Back to status'],
            'ACTION_ANALYZE': ['View results', 'Back to status'],
            'RECOMMENDATION': ['More details', 'Different topic', 'Back to status'],
            'GENERAL_HELP': ['Farm status', 'Batches', 'Weather', 'Alerts'],
            'UNKNOWN': ['Help', 'Farm status', 'Try again']
        };

        const combined = [...baseReplies, ...(contextualReplies[intent] || [])];
        return Array.from(new Set(combined)).slice(0, 4);
    }

    /**
     * Get conversation summary for context
     */
    getConversationSummary(messages: ConversationMessage[]): string {
        if (messages.length === 0) return 'New conversation';

        const recentMessages = messages.slice(-5);
        const intents = recentMessages
            .filter(m => m.metadata?.intent)
            .map(m => m.metadata!.intent);

        const uniqueIntents = Array.from(new Set(intents));

        return `Recent topics: ${uniqueIntents.join(', ') || 'General conversation'}`;
    }
}

export const farmAssistant = new FarmAssistant();
