jest.mock('@/lib/ai/farmContextService', () => ({
  loadFarmContext: jest.fn().mockResolvedValue({
    farmId: 'farm-1',
    farmName: 'Test Farm',
    activeBatches: [],
    allBatches: [],
    pendingTasks: 0,
    alertBatchData: [],
    resourceData: [],
    location: 'Test',
    assistantData: { activeBatches: [], recentAlerts: [], pendingTasks: 0, harvestsThisWeek: 0 },
  }),
}))

jest.mock('@/lib/ai/agent/tools', () => ({
  getToolNames: () => ['get_farm_overview'],
  agentTools: {
    get_farm_overview: {
      name: 'get_farm_overview',
      description: 'overview',
      execute: async () => ({
        summary: '8 active batches',
        data: { activeBatches: 8 },
      }),
    },
  },
}))

jest.mock('@/lib/ai/agent/mcpTools', () => ({
  getMcpToolDescriptors: () => [
    { name: 'get_farm_overview', description: 'overview', inputSchema: { type: 'object', properties: {} } },
  ],
}))

import { handleMcpJsonRpc } from '@/lib/ai/agent/mcpServer'

describe('mcpServer', () => {
  const ctx = { farmId: 'farm-1', userId: 'user-1', userEmail: 'test@farm.com' }

  it('handles initialize', async () => {
    const res = await handleMcpJsonRpc(
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
      ctx
    )
    expect(res.result).toMatchObject({
      serverInfo: { name: 'ofms-farm-agent' },
    })
  })

  it('lists tools', async () => {
    const res = await handleMcpJsonRpc(
      { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      ctx
    )
    expect((res.result as { tools: unknown[] }).tools).toHaveLength(1)
  })

  it('invokes tools/call', async () => {
    const res = await handleMcpJsonRpc(
      {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_farm_overview', arguments: {} },
      },
      ctx
    )
    const content = (res.result as { content: { text: string }[] }).content[0].text
    expect(content).toContain('8 active batches')
  })
})
