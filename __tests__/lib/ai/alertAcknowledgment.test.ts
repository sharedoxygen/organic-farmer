import {
  applyAlertAcknowledgments,
  buildStableAlertId,
} from '@/lib/ai/alertAcknowledgmentService'
import type { AIAlert } from '@/lib/ai/alertEngine'

function sampleAlert(id: string): AIAlert {
  return {
    id,
    type: 'HARVEST_OPTIMAL',
    severity: 'MEDIUM',
    title: 'Harvest soon',
    message: 'Batch ready',
    actionRequired: true,
    createdAt: new Date(),
    acknowledged: false,
    farmId: 'farm-1',
    batchId: 'batch-1',
    channels: ['IN_APP'],
  }
}

describe('alertAcknowledgmentService', () => {
  describe('buildStableAlertId', () => {
    it('builds deterministic IDs without timestamps', () => {
      const a = buildStableAlertId({
        type: 'HARVEST_OPTIMAL',
        farmId: 'farm-1',
        batchId: 'batch-1',
      })
      const b = buildStableAlertId({
        type: 'HARVEST_OPTIMAL',
        farmId: 'farm-1',
        batchId: 'batch-1',
      })
      expect(a).toBe(b)
      expect(a).toBe('HARVEST_OPTIMAL:farm-1:batch-1')
    })

    it('differentiates health vs temp batch alerts', () => {
      const health = buildStableAlertId({
        type: 'BATCH_ATTENTION',
        farmId: 'f1',
        batchId: 'health_b1',
      })
      const temp = buildStableAlertId({
        type: 'BATCH_ATTENTION',
        farmId: 'f1',
        batchId: 'temp_b1',
      })
      expect(health).not.toBe(temp)
    })
  })

  describe('applyAlertAcknowledgments', () => {
    it('marks matching alerts as acknowledged with metadata', () => {
      const alertId = 'HARVEST_OPTIMAL:farm-1:batch-1'
      const acks = new Map([
        [
          alertId,
          { acknowledgedAt: new Date('2026-06-01T12:00:00Z'), acknowledgedBy: 'user-1' },
        ],
      ])

      const [result] = applyAlertAcknowledgments([sampleAlert(alertId)], acks)

      expect(result.acknowledged).toBe(true)
      expect(result.acknowledgedBy).toBe('user-1')
      expect(result.acknowledgedAt?.toISOString()).toBe('2026-06-01T12:00:00.000Z')
    })

    it('leaves unacknowledged alerts unchanged', () => {
      const [result] = applyAlertAcknowledgments(
        [sampleAlert('HARVEST_OPTIMAL:farm-1:other')],
        new Map()
      )
      expect(result.acknowledged).toBe(false)
    })
  })
})
