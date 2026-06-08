import { isWriteTool, WRITE_TOOLS } from '@/lib/ai/agent/toolClassification'

describe('toolClassification', () => {
  it('marks create_task as a write tool', () => {
    expect(WRITE_TOOLS.has('create_task')).toBe(true)
    expect(isWriteTool('create_task')).toBe(true)
  })

  it('does not mark read tools as writes', () => {
    expect(isWriteTool('get_farm_overview')).toBe(false)
    expect(isWriteTool('score_batches')).toBe(false)
  })
})
