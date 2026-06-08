const mockFindMany = jest.fn()
const mockCreateMany = jest.fn()

jest.mock('@/lib/db', () => ({
  prisma: {
    audit_logs: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      createMany: (...args: unknown[]) => mockCreateMany(...args),
      create: jest.fn(),
    },
  },
}))

import { finalizeFarmAlerts } from '@/lib/ai/alertPipeline'
import type { AIAlert } from '@/lib/ai/alertEngine'

const sample: AIAlert = {
  id: 'HARVEST_OPTIMAL:farm-1:batch-1',
  type: 'HARVEST_OPTIMAL',
  severity: 'MEDIUM',
  title: 'Harvest',
  message: 'Soon',
  actionRequired: true,
  createdAt: new Date(),
  acknowledged: false,
  farmId: 'farm-1',
  batchId: 'batch-1',
  channels: ['IN_APP'],
}

describe('finalizeFarmAlerts integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateMany.mockResolvedValue({ count: 1 })
  })

  it('applies acknowledgment and records emissions', async () => {
    mockFindMany.mockImplementation(({ where }: { where: { action: { in?: string[] } } }) => {
      if (where.action?.in?.includes('ALERT_ACKNOWLEDGED')) {
        return Promise.resolve([
          {
            entityId: sample.id,
            timestamp: new Date(),
            userId: 'user-1',
            details: { alertId: sample.id },
          },
        ])
      }
      return Promise.resolve([])
    })

    const result = await finalizeFarmAlerts('farm-1', 'user-1', [sample])

    expect(result).toHaveLength(1)
    expect(result[0].acknowledged).toBe(true)
    expect(mockCreateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            action: 'ALERT_EMITTED',
            entityId: sample.id,
          }),
        ]),
      })
    )
  })

  it('suppresses alerts in DB cooldown window', async () => {
    mockFindMany.mockImplementation(({ where }: { where: { action: string | { in?: string[] } } }) => {
      if (where.action === 'ALERT_EMITTED') {
        return Promise.resolve([
          {
            entityId: sample.id,
            timestamp: new Date(Date.now() - 60 * 1000),
          },
        ])
      }
      return Promise.resolve([])
    })

    const result = await finalizeFarmAlerts('farm-1', 'user-1', [sample])
    expect(result).toHaveLength(0)
  })
})
