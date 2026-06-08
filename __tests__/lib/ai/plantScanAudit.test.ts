import type { PlantScanResult } from '@/types/plantScan'

const mockFindFirst = jest.fn()
const mockLogInference = jest.fn()
const mockQcCreate = jest.fn()

jest.mock('@/lib/db', () => ({
  prisma: {
    batches: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    quality_checks: {
      create: (...args: unknown[]) => mockQcCreate(...args),
    },
  },
}))

jest.mock('@/lib/ai/inferenceLogger', () => ({
  logInference: (...args: unknown[]) => mockLogInference(...args),
}))

import { resolvePlantScanBatch } from '@/lib/ai/plantScanAudit'
import { logPlantScanAudit } from '@/lib/ai/plantScanAudit'

const sampleResult: PlantScanResult = {
  aiModel: 'test-model',
  aiPowered: true,
  summary: {
    headline: 'Healthy Kale',
    diagnosis: 'Minor leaf spot',
    confidence: 0.91,
    severity: 'LOW',
    overallHealth: 88,
    statusLabel: 'Healthy',
  },
  healthIndicators: [],
  findings: [],
  recommendations: [],
  organicTreatments: [],
  affectedAreaPercent: 5,
  careTimeline: [],
  narrative: 'Looks good',
  reasoning: 'Minor spotting',
}

describe('plantScanAudit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('resolvePlantScanBatch', () => {
    it('returns null when batchId is omitted', async () => {
      await expect(resolvePlantScanBatch('farm-1', undefined)).resolves.toBeNull()
      expect(mockFindFirst).not.toHaveBeenCalled()
    })

    it('returns null when batch is not on farm', async () => {
      mockFindFirst.mockResolvedValue(null)
      await expect(resolvePlantScanBatch('farm-1', 'missing')).resolves.toBeNull()
    })

    it('returns linked batch metadata when found', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'b1',
        batchNumber: 'B-100',
        seed_varieties: { name: 'Kale' },
      })
      await expect(resolvePlantScanBatch('farm-1', 'b1')).resolves.toEqual({
        id: 'b1',
        batchNumber: 'B-100',
        cropType: 'Kale',
      })
    })
  })

  describe('logPlantScanAudit', () => {
    it('logs batch KDEs when batch is linked', async () => {
      await logPlantScanAudit({
        farmId: 'farm-1',
        userId: 'user-1',
        cropType: 'Kale',
        result: sampleResult,
        batch: { id: 'b1', batchNumber: 'B-100', cropType: 'Kale' },
        source: 'plant_scan_api',
      })

      expect(mockLogInference).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'AI_PLANT_SCAN',
          entity: 'Batch',
          entityId: 'b1',
          details: expect.objectContaining({
            batchId: 'b1',
            batchNumber: 'B-100',
            diagnosis: 'Minor leaf spot',
          }),
        })
      )
      expect(mockQcCreate).not.toHaveBeenCalled()
    })

    it('creates quality_checks on HIGH severity with batch link', async () => {
      mockQcCreate.mockResolvedValue({ id: 'qc-1' })

      await logPlantScanAudit({
        farmId: 'farm-1',
        userId: 'user-1',
        cropType: 'Kale',
        result: {
          ...sampleResult,
          summary: { ...sampleResult.summary, severity: 'HIGH' },
        },
        batch: { id: 'b1', batchNumber: 'B-100', cropType: 'Kale' },
        source: 'plant_scan_api',
      })

      expect(mockQcCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            batchId: 'b1',
            checkType: 'PLANT_VISION_AI',
            status: 'REVIEW_REQUIRED',
            followUpRequired: true,
          }),
        })
      )
      expect(mockLogInference).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'AI_QC_CREATED' })
      )
    })
  })
})
