import { prisma } from '@/lib/db'

export interface CropAnalysisHistoryEntry {
  id: string
  timestamp: Date
  cropType: string
  diagnosis?: unknown
  severity?: unknown
  confidence?: unknown
  overallHealth?: unknown
  aiModel?: unknown
  batchId?: unknown
  batchNumber?: unknown
  headline?: unknown
  source: string
}

export async function fetchCropAnalysisHistory(
  farmId: string,
  options: { days?: number; batchId?: string; limit?: number } = {}
): Promise<CropAnalysisHistoryEntry[]> {
  const days = options.days ?? 30
  const limit = options.limit ?? 50
  const since = new Date(Date.now() - days * 86400000)

  const logs = await prisma.audit_logs.findMany({
    where: {
      farm_id: farmId,
      action: {
        in: ['AI_PLANT_SCAN', 'PLANT_SCAN', 'AI_CROP_ANALYSIS'],
      },
      timestamp: { gte: since },
      ...(options.batchId
        ? { details: { path: ['batchId'], equals: options.batchId } }
        : {}),
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
  })

  return logs.map((log) => {
    const d = (log.details || {}) as Record<string, unknown>
    return {
      id: log.id,
      timestamp: log.timestamp,
      cropType: String(d.cropType || 'Unknown'),
      diagnosis: d.diagnosis || d.diseaseType,
      severity: d.severity,
      confidence: d.confidence,
      overallHealth: d.overallHealth,
      aiModel: d.aiModel,
      batchId: d.batchId,
      batchNumber: d.batchNumber,
      headline: d.headline,
      source: log.action,
    }
  })
}
