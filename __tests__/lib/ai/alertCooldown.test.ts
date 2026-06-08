import { filterAlertsByCooldown } from '@/lib/ai/alertCooldownService'
import type { AIAlert } from '@/lib/ai/alertEngine'

function alert(id: string, type: AIAlert['type'] = 'HARVEST_OPTIMAL'): AIAlert {
  return {
    id,
    type,
    severity: 'MEDIUM',
    title: 'Test',
    message: 'Test',
    actionRequired: false,
    createdAt: new Date(),
    acknowledged: false,
    farmId: 'farm-1',
    channels: ['IN_APP'],
  }
}

describe('alertCooldownService', () => {
  it('filters alerts inside cooldown window', () => {
    const emissions = new Map([
      ['HARVEST_OPTIMAL:farm-1:b1', new Date(Date.now() - 30 * 60 * 1000)],
    ])
    const result = filterAlertsByCooldown(
      [alert('HARVEST_OPTIMAL:farm-1:b1', 'HARVEST_OPTIMAL')],
      emissions
    )
    expect(result).toHaveLength(0)
  })

  it('allows alerts after cooldown elapsed', () => {
    const emissions = new Map([
      ['HARVEST_OPTIMAL:farm-1:b1', new Date(Date.now() - 25 * 60 * 60 * 1000)],
    ])
    const result = filterAlertsByCooldown(
      [alert('HARVEST_OPTIMAL:farm-1:b1', 'HARVEST_OPTIMAL')],
      emissions
    )
    expect(result).toHaveLength(1)
  })
})
