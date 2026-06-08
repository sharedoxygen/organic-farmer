import { getOperation, listOperations } from '@/lib/operations/registry'

describe('operations registry', () => {
  it('lists registered OFMS utilities', () => {
    const ops = listOperations()
    expect(ops.length).toBeGreaterThanOrEqual(8)
    expect(ops.map((o) => o.id)).toContain('agent.run')
    expect(ops.map((o) => o.id)).toContain('mobile.verify')
  })

  it('defines farm param for agent.run', () => {
    const op = getOperation('agent.run')
    expect(op?.params.some((p) => p.key === 'farmId' && p.type === 'farm')).toBe(
      true
    )
  })
})
