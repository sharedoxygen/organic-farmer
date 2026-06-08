import { prisma } from '@/lib/db'
import { alertEngine } from '../alertEngine'
import { batchScoringAI } from '../batchScoringAI'
import { demandForecastingAI } from '../demandForecastingAI'
import { finalizeFarmAlerts } from '../alertPipeline'
import { logInference } from '../inferenceLogger'
import { analyzePlantImage } from '../plantVisionAnalysis'
import { logPlantScanAudit, resolvePlantScanBatch } from '../plantScanAudit'
import { resourceOptimizationAI } from '../resourceOptimizationAI'
import { yieldPredictionAI } from '../yieldPredictionAI'
import { weatherService } from '../weatherService'
import type { AgentContext, AgentTool } from './types'

export const agentTools: Record<string, AgentTool> = {
  get_farm_overview: {
    name: 'get_farm_overview',
    description: 'Load farm status, batch counts, tasks, and compliance metrics',
    async execute(ctx) {
      const { farmContext: f } = ctx
      const data = {
        farmName: f.farmName,
        farmType: f.farmType,
        activeBatches: f.activeBatches.length,
        totalBatches: f.allBatches.length,
        pendingTasks: f.pendingTasks,
        harvestsThisWeek: f.harvestsThisWeek,
        ordersThisMonth: f.ordersThisMonth,
        qualityChecks: f.qualityChecks,
        custodyEvents: f.custodyEvents,
        topCrops: Array.from(new Set(f.activeBatches.map((b) => b.cropType))).slice(0, 5),
      }
      return {
        summary: `${f.farmName}: ${data.activeBatches} active batches, ${data.pendingTasks} pending tasks`,
        data,
      }
    },
  },

  score_batches: {
    name: 'score_batches',
    description: 'AI health scoring for active production batches',
    async execute(ctx, params) {
      const limit = Number(params.limit) || 5
      const batches = ctx.farmContext.activeBatches.slice(0, limit)
      const scores = await Promise.all(
        batches.map(async (b) => {
          const score = await batchScoringAI.calculateBatchScore(
            b.id,
            b.batchNumber,
            b.cropType,
            b.metrics
          )
          return { ...score, cropType: b.cropType }
        })
      )
      const avg =
        scores.length > 0
          ? Math.round(scores.reduce((s, x) => s + x.overallScore, 0) / scores.length)
          : 0
      return {
        summary: `Scored ${scores.length} batches — avg health ${avg}/100`,
        data: scores,
      }
    },
  },

  predict_yield: {
    name: 'predict_yield',
    description: 'Forecast harvest yields by crop and week',
    async execute(ctx) {
      const forecast = await yieldPredictionAI.generateFarmForecast(
        ctx.farmId,
        ctx.farmContext.activeBatches.map((b) => ({
          batchId: b.id,
          batchNumber: b.batchNumber,
          cropType: b.cropType,
          traysUsed: Math.max(1, Math.round(b.quantity)),
          metrics: b.metrics,
          expectedHarvestDate: b.expectedHarvestDate || new Date(Date.now() + 7 * 86400000),
        })),
        28,
        ctx.farmContext.location
      )
      return {
        summary: `Forecast: ${forecast.totalPredictedYield} ${forecast.yieldUnit} over 4 weeks (${Math.round(forecast.confidence * 100)}% confidence)`,
        data: forecast,
      }
    },
  },

  generate_alerts: {
    name: 'generate_alerts',
    description: 'Proactive AI alerts from batches, weather, and resources',
    async execute(ctx) {
      const rawAlerts = await alertEngine.generateFarmAlerts(
        ctx.farmId,
        ctx.farmContext.alertBatchData,
        ctx.farmContext.resourceData,
        ctx.farmContext.location
      )
      const alerts = await finalizeFarmAlerts(
        ctx.farmId,
        ctx.userId,
        rawAlerts
      )
      const critical = alerts.filter(
        (a) => a.severity === 'HIGH' || a.severity === 'CRITICAL'
      ).length
      return {
        summary: `${alerts.length} alerts (${critical} high/critical)`,
        data: { alerts, stats: alertEngine.getAlertStats(alerts) },
      }
    },
  },

  optimize_resources: {
    name: 'optimize_resources',
    description: 'Water, labor, input, and equipment optimization plan',
    async execute(ctx) {
      const [equipmentRows, zoneRows] = await Promise.all([
        prisma.equipment.findMany({
          where: { farm_id: ctx.farmId },
          take: 20,
        }),
        prisma.zones.findMany({
          where: { farm_id: ctx.farmId, status: 'active' },
          take: 15,
        }),
      ])

      const equipment = equipmentRows.length
        ? equipmentRows.map((eq) => {
            const ageMonths = Math.max(
              1,
              Math.floor(
                (Date.now() - eq.installDate.getTime()) / (30 * 86400000)
              )
            )
            const condition =
              eq.status === 'OPERATIONAL' || eq.status === 'ACTIVE'
                ? ('GOOD' as const)
                : eq.status === 'MAINTENANCE'
                  ? ('FAIR' as const)
                  : ('POOR' as const)
            return {
              id: eq.id,
              name: eq.name,
              type: eq.type,
              age: ageMonths,
              condition,
              lastMaintenance: eq.lastMaintenance || eq.installDate,
              utilizationRate: eq.powerConsumption ? 0.7 : 0.55,
              energyConsumption: eq.powerConsumption || 3,
            }
          })
        : [
            {
              id: 'fallback-irrigation',
              name: 'Irrigation System',
              type: 'WATER',
              age: 12,
              condition: 'GOOD' as const,
              lastMaintenance: new Date(Date.now() - 30 * 86400000),
              utilizationRate: 0.75,
              energyConsumption: 4.5,
            },
          ]

      const zones = zoneRows.length
        ? zoneRows.map((z) => ({
            id: z.id,
            name: z.name,
            area: z.area || z.capacity * 10 || 500,
            cropTypes: Array.from(
              new Set(ctx.farmContext.activeBatches.map((b) => b.cropType))
            ),
            irrigationType: 'DRIP',
            lightingType: z.type?.includes('greenhouse') ? 'LED' : 'NATURAL',
          }))
        : [
            {
              id: 'main',
              name: 'Production',
              area: 1000,
              cropTypes: Array.from(
                new Set(ctx.farmContext.activeBatches.map((b) => b.cropType))
              ),
              irrigationType: 'DRIP',
              lightingType: 'LED',
            },
          ]

      const farmData = {
        farmId: ctx.farmId,
        location: ctx.farmContext.location,
        currentStaff: Math.max(2, Math.ceil(ctx.farmContext.pendingTasks / 5)),
        operatingHours: { start: '06:00', end: '18:00' },
        activeBatches: ctx.farmContext.activeBatches.map((b) => ({
          batchId: b.id,
          cropType: b.cropType,
          traysUsed: Math.max(1, Math.round(b.quantity)),
          zone: zones[0]?.name || 'Main',
          plantingDate: b.plantingDate,
          expectedHarvestDate:
            b.expectedHarvestDate || new Date(Date.now() + 7 * 86400000),
          currentWaterUsage: Math.round(8 + b.metrics.humidity / 10),
        })),
        equipment,
        zones,
      }
      const plan = await resourceOptimizationAI.generateOptimizationPlan(
        farmData,
        30
      )
      return {
        summary: `Est. annual savings $${plan.overallSavings.totalAnnualSavings.toLocaleString()} (${equipmentRows.length} equipment, ${zoneRows.length} zones)`,
        data: plan,
      }
    },
  },

  get_demand_forecast: {
    name: 'get_demand_forecast',
    description: 'Market demand forecast for planning',
    async execute(ctx, params) {
      const crop =
        String(params.cropType || '') ||
        ctx.farmContext.activeBatches[0]?.cropType ||
        'Microgreens'
      const forecast = await demandForecastingAI.generateForecast(
        crop,
        Number(params.daysAhead) || 30,
        {},
        ctx.farmId
      )
      return {
        summary: `30-day ${crop} demand forecast — accuracy ${Math.round((forecast.accuracy || 0.85) * 100)}% (order-history grounded)`,
        data: forecast,
      }
    },
  },

  get_quality_summary: {
    name: 'get_quality_summary',
    description: 'Recent quality inspections and pass rates by batch',
    async execute(ctx, params) {
      const limit = Number(params.limit) || 10
      const checks = await prisma.quality_checks.findMany({
        where: { farm_id: ctx.farmId },
        orderBy: { checkDate: 'desc' },
        take: limit,
        include: {
          batches: { select: { batchNumber: true } },
        },
      })
      const passed = checks.filter((c) =>
        ['PASSED', 'PASS', 'APPROVED'].includes(c.status.toUpperCase())
      ).length
      const passRate =
        checks.length > 0 ? Math.round((passed / checks.length) * 100) : 100
      return {
        summary: `${checks.length} recent QC checks — ${passRate}% pass rate`,
        data: checks.map((c) => ({
          id: c.id,
          batchNumber: c.batches?.batchNumber,
          checkType: c.checkType,
          status: c.status,
          checkDate: c.checkDate,
          uniformity: c.uniformity,
          visualAppearance: c.visualAppearance,
        })),
      }
    },
  },

  analyze_plant: {
    name: 'analyze_plant',
    description:
      'Analyze a plant photo for disease, pests, and health (requires imageDataUrl) or summarize recent scans',
    async execute(ctx, params) {
      const imageDataUrl = params.imageDataUrl ? String(params.imageDataUrl) : ''
      const cropType =
        String(params.cropType || '') ||
        ctx.farmContext.activeBatches[0]?.cropType ||
        'Microgreens'
      const farmZone = String(params.farmZone || ctx.farmContext.location)

      if (!imageDataUrl.startsWith('data:image/')) {
        const history = await agentTools.get_plant_scan_history.execute(ctx, params)
        return {
          summary: `${history.summary} — capture a photo in Plant Vision Scan for live analysis`,
          data: {
            scans: history.data,
            requiresImage: true,
            plantScanUrl: '/mobile/plant-scan',
          },
        }
      }

      const requestedBatchId = params.batchId ? String(params.batchId) : undefined
      const batch = await resolvePlantScanBatch(ctx.farmId, requestedBatchId)

      if (requestedBatchId && !batch) {
        return {
          summary: 'batchId does not belong to this farm',
          data: { error: 'invalid_batch', batchId: requestedBatchId },
        }
      }

      const result = await analyzePlantImage({
        imageDataUrl,
        cropType: batch?.cropType || cropType,
        farmZone,
        notes: params.notes ? String(params.notes) : undefined,
      })

      await logPlantScanAudit({
        farmId: ctx.farmId,
        userId: ctx.userId,
        cropType: batch?.cropType || cropType,
        result,
        batch,
        farmZone,
        source: 'agent_tool',
      })

      return {
        summary: `${result.summary.diagnosis} (${result.summary.severity}, ${Math.round(result.summary.confidence * 100)}% confidence)`,
        data: result,
      }
    },
  },

  get_plant_scan_history: {
    name: 'get_plant_scan_history',
    description: 'Recent Plant Vision AI scan results from audit trail',
    async execute(ctx, params) {
      const limit = Number(params.limit) || 5
      const batchId = params.batchId ? String(params.batchId) : undefined
      const logs = await prisma.audit_logs.findMany({
        where: {
          farm_id: ctx.farmId,
          action: { in: ['AI_PLANT_SCAN', 'PLANT_SCAN'] },
          ...(batchId
            ? { details: { path: ['batchId'], equals: batchId } }
            : {}),
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
      })
      const scans = logs.map((log) => {
        const d = (log.details || {}) as Record<string, unknown>
        return {
          id: log.id,
          timestamp: log.timestamp,
          cropType: d.cropType,
          diagnosis: d.diagnosis,
          severity: d.severity,
          confidence: d.confidence,
          aiModel: d.aiModel,
          batchId: d.batchId,
          batchNumber: d.batchNumber,
        }
      })
      return {
        summary:
          scans.length > 0
            ? `${scans.length} recent plant scans on file`
            : 'No plant scans yet — use Plant Vision Scan to capture a photo',
        data: scans,
      }
    },
  },

  get_weather: {
    name: 'get_weather',
    description: 'Current weather and growing conditions',
    async execute(ctx) {
      const crop = ctx.farmContext.activeBatches[0]?.cropType || 'general'
      const weather = await weatherService.getCurrentWeather(ctx.farmContext.location)
      const conditions = await weatherService.getGrowingConditions(ctx.farmContext.location, crop)
      const score = conditions.overallScore
      return {
        summary: `${weather.temperature}°F, ${weather.conditions} — growing score ${score}/100`,
        data: { weather, conditions },
      }
    },
  },

  create_task: {
    name: 'create_task',
    description: 'Create an operational task on the farm',
    async execute(ctx, params) {
      const title = String(params.title || 'AI-generated follow-up task')
      const description = String(params.description || 'Created by OFMS AI Agent')
      const dueDate = params.dueDate
        ? new Date(String(params.dueDate))
        : new Date(Date.now() + 86400000)

      const task = await prisma.tasks.create({
        data: {
          id: `task-agent-${Date.now()}`,
          farm_id: ctx.farmId,
          title,
          description,
          category: String(params.category || 'MONITORING'),
          priority: String(params.priority || 'MEDIUM'),
          status: 'PENDING',
          assignedTo: ctx.userId,
          assignedBy: ctx.userId,
          dueDate,
          estimatedDuration: Number(params.estimatedMinutes) || 30,
          dependencies: '[]',
          updatedAt: new Date(),
        },
      })
      return {
        summary: `Created task: ${task.title}`,
        data: task,
      }
    },
  },
}

export function getToolNames(): string[] {
  return Object.keys(agentTools)
}
