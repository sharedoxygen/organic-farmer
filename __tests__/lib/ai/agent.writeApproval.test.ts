import { agentTools } from '@/lib/ai/agent/tools'
import { prisma } from '@/lib/db'
import type { AgentContext } from '@/lib/ai/agent/types'

jest.mock('@/lib/db', () => ({
  prisma: {
    tasks: {
      create: jest.fn(),
    },
  },
}))

const mockFarmContext = {
  farmName: 'Test Farm',
  farmType: 'ORGANIC_MICROGREENS',
  location: 'Test, NY',
  activeBatches: [],
  allBatches: [],
  pendingTasks: 0,
  harvestsThisWeek: 0,
  ordersThisMonth: 0,
  qualityChecks: 0,
  custodyEvents: 0,
  assistantData: {},
} as AgentContext['farmContext']

function mockCtx(confirmWrites?: boolean): AgentContext {
  return {
    farmId: 'farm-1',
    userId: 'user-1',
    userName: 'test@example.com',
    farmContext: mockFarmContext,
    confirmWrites,
  }
}

describe('create_task write approval', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('proposes a task without confirmWrites', async () => {
    const result = await agentTools.create_task.execute(mockCtx(false), {
      title: 'Inspect trays',
    })

    expect(result.data).toMatchObject({
      pending: true,
      title: 'Inspect trays',
    })
    expect(prisma.tasks.create).not.toHaveBeenCalled()
  })

  it('creates a task when confirmWrites is true', async () => {
    ;(prisma.tasks.create as jest.Mock).mockResolvedValue({
      id: 'task-1',
      title: 'Inspect trays',
    })

    const result = await agentTools.create_task.execute(mockCtx(true), {
      title: 'Inspect trays',
    })

    expect(prisma.tasks.create).toHaveBeenCalled()
    expect(result.summary).toContain('Created task')
    expect(result.data).toMatchObject({ title: 'Inspect trays' })
  })
})
