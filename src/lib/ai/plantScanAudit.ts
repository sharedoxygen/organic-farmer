import { prisma } from '@/lib/db'
import { logInference } from './inferenceLogger'
import type { PlantScanResult } from '@/types/plantScan'

export interface LinkedBatch {
  id: string
  batchNumber: string
  cropType: string
}

/** Validate batch belongs to farm before linking a plant scan (FSMA KDE → lot linkage) */
export async function resolvePlantScanBatch(
  farmId: string,
  batchId?: string | null
): Promise<LinkedBatch | null> {
  if (!batchId) return null

  const batch = await prisma.batches.findFirst({
    where: { id: batchId, farm_id: farmId },
    select: {
      id: true,
      batchNumber: true,
      seed_varieties: { select: { name: true } },
    },
  })

  if (!batch) return null

  return {
    id: batch.id,
    batchNumber: batch.batchNumber,
    cropType: batch.seed_varieties?.name || 'Crop',
  }
}

export interface PlantScanAuditInput {
  farmId: string
  userId: string
  cropType: string
  result: PlantScanResult
  batch?: LinkedBatch | null
  farmZone?: string
  source?: 'plant_scan_api' | 'agent_tool' | 'crop_analysis'
}

/** Persist plant vision result linked to traceability lot when batchId is provided */
export async function logPlantScanAudit(input: PlantScanAuditInput): Promise<string> {
  const {
    farmId,
    userId,
    cropType,
    result,
    batch,
    farmZone,
    source = 'plant_scan_api',
  } = input

  const details = {
    cropType,
    diagnosis: result.summary.diagnosis,
    severity: result.summary.severity,
    confidence: result.summary.confidence,
    overallHealth: result.summary.overallHealth,
    aiModel: result.aiModel,
    farmZone,
    source,
    batchId: batch?.id,
    batchNumber: batch?.batchNumber,
    headline: result.summary.headline,
    statusLabel: result.summary.statusLabel,
  }

  await logInference({
    farmId,
    userId,
    action: 'AI_PLANT_SCAN',
    entity: batch ? 'Batch' : 'PlantVision',
    entityId: batch?.id || farmId,
    details,
  })

  let qualityCheckId: string | undefined
  if (
    batch &&
    result.summary.severity === 'HIGH'
  ) {
    qualityCheckId = await createPlantVisionQualityCheck({
      farmId,
      userId,
      batchId: batch.id,
      result,
    })
  }

  return batch?.id || farmId
}

async function createPlantVisionQualityCheck(input: {
  farmId: string
  userId: string
  batchId: string
  result: PlantScanResult
}): Promise<string> {
  const { farmId, userId, batchId, result } = input
  const id = `qc-plant-${Date.now()}`
  const actions =
    result.recommendations
      .slice(0, 3)
      .map((r) => r.action)
      .join('; ') || 'Review Plant Vision report and apply organic treatment plan'

  await prisma.quality_checks.create({
    data: {
      id,
      farm_id: farmId,
      batchId,
      inspectorId: userId,
      checkDate: new Date(),
      checkType: 'PLANT_VISION_AI',
      status: 'REVIEW_REQUIRED',
      correctiveActions: actions,
      notes: `${result.summary.headline}: ${result.summary.diagnosis}`,
      uniformity: result.summary.overallHealth / 100,
      visualAppearance:
        result.summary.severity === 'HIGH' ? 'Poor — AI flagged' : 'Fair',
      contaminationSeverity: result.summary.severity,
      followUpRequired: true,
      followUpDate: new Date(Date.now() + 3 * 86400000),
      updatedAt: new Date(),
    },
  })

  await logInference({
    farmId,
    userId,
    action: 'AI_QC_CREATED',
    entity: 'quality_checks',
    entityId: id,
    details: {
      batchId,
      source: 'plant_vision_high_severity',
      diagnosis: result.summary.diagnosis,
    },
  })

  return id
}
