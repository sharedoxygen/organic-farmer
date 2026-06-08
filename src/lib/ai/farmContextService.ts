import { prisma } from '@/lib/db'
import { getActiveBatchStatuses } from '@/lib/utils/batchStatusUtils'
import type { BatchHealthData, ResourceData } from './alertEngine'
import type { BatchHealthMetrics } from './batchScoringAI'
import type { FarmContextData } from './farmAssistant'

export interface FarmContext {
  farmId: string
  farmName: string
  farmType: string
  location: string
  ownerId: string
  activeBatches: BatchRecord[]
  allBatches: BatchRecord[]
  pendingTasks: number
  completedTasks: number
  harvestsThisWeek: number
  ordersThisMonth: number
  qualityChecks: number
  custodyEvents: number
  alertBatchData: BatchHealthData[]
  resourceData: ResourceData[]
  assistantData: FarmContextData
}

export interface BatchRecord {
  id: string
  batchNumber: string
  cropType: string
  status: string
  plantingDate: Date
  expectedHarvestDate: Date | null
  actualHarvestDate: Date | null
  quantity: number
  unit: string
  metrics: BatchHealthMetrics
}

function parseLocation(settings: unknown): string {
  if (!settings || typeof settings !== 'object') return 'New York, NY'
  const s = settings as Record<string, unknown>
  if (typeof s.location === 'string') return s.location
  if (s.state === 'CALIFORNIA') return 'California, USA'
  return 'Naples, FL'
}

function parseFarmType(settings: unknown): string {
  if (!settings || typeof settings !== 'object') return 'GENERAL'
  return String((settings as Record<string, unknown>).farm_type || 'GENERAL')
}

function daysBetween(start: Date, end: Date): number {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000))
}

function buildMetrics(
  batch: {
    plantingDate: Date
    expectedHarvestDate: Date | null
    status: string
    quantity: number
  },
  qc?: {
    status: string
    uniformity: number | null
    visualAppearance: string | null
    checkDate: Date
  } | null
): BatchHealthMetrics {
  const now = new Date()
  const expectedTotal =
    batch.expectedHarvestDate && batch.plantingDate
      ? Math.max(7, daysBetween(batch.plantingDate, batch.expectedHarvestDate))
      : 14
  const daysInGrowth = daysBetween(batch.plantingDate, now)
  const progress = Math.min(1, daysInGrowth / expectedTotal)
  const isLate =
    batch.expectedHarvestDate &&
    batch.expectedHarvestDate < now &&
    !batch.status.includes('HARVEST')

  let visualHealth = isLate ? 72 : 85 + Math.round((1 - progress) * 10)
  let diseaseRisk = isLate ? 3 : 1

  if (qc) {
    if (qc.uniformity != null) {
      visualHealth = Math.round((visualHealth + qc.uniformity * 100) / 2)
    }
    const failed = !['PASSED', 'PASS', 'APPROVED'].includes(qc.status.toUpperCase())
    if (failed) {
      visualHealth = Math.min(visualHealth, 65)
      diseaseRisk = Math.max(diseaseRisk, 2)
    }
    if (qc.visualAppearance?.toLowerCase().includes('poor')) {
      visualHealth = Math.min(visualHealth, 60)
    }
  }

  return {
    batchId: '',
    temperature: 68 + Math.round(progress * 4),
    humidity: 58 + Math.round(progress * 8),
    lightHours: 14,
    daysInGrowth,
    expectedDaysTotal: expectedTotal,
    germinationRate: qc ? (visualHealth > 80 ? 0.94 : 0.88) : 0.92,
    visualHealth: Math.max(40, Math.min(100, visualHealth)),
    pestPressure: progress > 0.7 ? 2 : 1,
    diseaseRisk,
  }
}

export async function loadFarmContext(farmId: string): Promise<FarmContext> {
  const farm = await prisma.farms.findUnique({ where: { id: farmId } })
  if (!farm) throw new Error('Farm not found')

  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - 7)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const batches = await prisma.batches.findMany({
    where: { farm_id: farmId },
    include: { seed_varieties: { select: { name: true, daysToHarvest: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const [
    pendingTasks,
    completedTasks,
    harvestsThisWeek,
    ordersThisMonth,
    qualityChecks,
    custodyEvents,
    inventoryCount,
  ] = await Promise.all([
    prisma.tasks.count({ where: { farm_id: farmId, status: { in: ['PENDING', 'IN_PROGRESS', 'SCHEDULED'] } } }),
    prisma.tasks.count({ where: { farm_id: farmId, status: 'COMPLETED' } }),
    prisma.batches.count({
      where: {
        farm_id: farmId,
        actualHarvestDate: { gte: startOfWeek },
      },
    }),
    prisma.orders.count({ where: { farm_id: farmId, createdAt: { gte: startOfMonth } } }),
    prisma.quality_checks.count({ where: { farm_id: farmId } }),
    prisma.custody_events.count({ where: { farm_id: farmId } }),
    prisma.inventory_items.count({ where: { farm_id: farmId } }),
  ])

  const recentQc = await prisma.quality_checks.findMany({
    where: { farm_id: farmId },
    orderBy: { checkDate: 'desc' },
    take: 100,
  })
  const qcByBatch = new Map<string, (typeof recentQc)[0]>()
  for (const qc of recentQc) {
    if (!qcByBatch.has(qc.batchId)) qcByBatch.set(qc.batchId, qc)
  }

  const activeStatuses = getActiveBatchStatuses()
  const batchRecords: BatchRecord[] = batches.map((b) => {
    const cropType = b.seed_varieties?.name || 'Crop'
    const plantDate = b.plantDate
    const metrics = buildMetrics(
      {
        plantingDate: plantDate,
        expectedHarvestDate: b.expectedHarvestDate,
        status: b.status,
        quantity: b.quantity,
      },
      qcByBatch.get(b.id)
    )
    metrics.batchId = b.id
    return {
      id: b.id,
      batchNumber: b.batchNumber,
      cropType,
      status: b.status,
      plantingDate: plantDate,
      expectedHarvestDate: b.expectedHarvestDate,
      actualHarvestDate: b.actualHarvestDate,
      quantity: b.quantity,
      unit: b.unit || 'units',
      metrics,
    }
  })

  const activeBatches = batchRecords.filter((b) =>
    activeStatuses.some((s) => b.status.toUpperCase().includes(s.toUpperCase()))
  )

  const alertBatchData: BatchHealthData[] = batchRecords.slice(0, 20).map((b) => ({
    batchId: b.id,
    batchNumber: b.batchNumber,
    cropType: b.cropType,
    plantingDate: b.plantingDate,
    expectedHarvestDate: b.expectedHarvestDate || new Date(),
    currentStatus: b.status,
    healthScore: b.metrics.visualHealth,
    temperature: b.metrics.temperature,
    humidity: b.metrics.humidity,
    daysToHarvest: b.expectedHarvestDate
      ? Math.max(0, daysBetween(new Date(), b.expectedHarvestDate))
      : 7,
  }))

  const maintenanceDue = await prisma.equipment.count({
    where: {
      farm_id: farmId,
      nextMaintenance: { lte: new Date(Date.now() + 7 * 86400000) },
    },
  })

  const resourceData: ResourceData[] = [
    {
      resourceType: 'WATER',
      currentLevel: Math.max(20, 100 - pendingTasks * 2),
      reorderPoint: 30,
      unit: 'gal/day',
      daysUntilEmpty: pendingTasks > 10 ? 3 : 7,
    },
    {
      resourceType: 'LABOR',
      currentLevel: Math.min(100, 60 + pendingTasks * 3),
      reorderPoint: 50,
      unit: 'hrs/week',
    },
    {
      resourceType: 'INVENTORY',
      currentLevel: Math.max(15, Math.min(100, inventoryCount * 8)),
      reorderPoint: 25,
      unit: '% stocked',
      daysUntilEmpty: inventoryCount < 5 ? 5 : 14,
    },
    {
      resourceType: 'EQUIPMENT',
      currentLevel: Math.max(10, 100 - maintenanceDue * 15),
      reorderPoint: 40,
      unit: '% operational',
      daysUntilEmpty: maintenanceDue > 2 ? 7 : 30,
    },
  ]

  const assistantData: FarmContextData = {
    activeBatches: activeBatches.map((b) => ({
      id: b.id,
      batchNumber: b.batchNumber,
      cropType: b.cropType,
      status: b.status,
    })),
    recentAlerts: [],
    pendingTasks,
    harvestsThisWeek,
  }

  return {
    farmId,
    farmName: farm.farm_name,
    farmType: parseFarmType(farm.settings),
    location: parseLocation(farm.settings),
    ownerId: farm.owner_id,
    activeBatches,
    allBatches: batchRecords,
    pendingTasks,
    completedTasks,
    harvestsThisWeek,
    ordersThisMonth,
    qualityChecks,
    custodyEvents,
    alertBatchData,
    resourceData,
    assistantData,
  }
}
