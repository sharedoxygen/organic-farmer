import { getToolNames } from './tools'

export interface McpToolDescriptor {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, { type: string; description: string }>
    required?: string[]
  }
}

const TOOL_META: Record<
  string,
  { description: string; params?: Record<string, string> }
> = {
  get_farm_overview: {
    description:
      'Load farm status, batch counts, tasks, QC, and custody metrics from live database',
  },
  score_batches: {
    description: 'AI health scoring for active production batches',
    params: { limit: 'Max batches to score (default 5)' },
  },
  predict_yield: {
    description: 'Forecast harvest yields by crop and week from active batches',
  },
  generate_alerts: {
    description: 'Proactive alerts from batches, weather, and resource levels',
  },
  optimize_resources: {
    description:
      'Water, labor, input, and equipment optimization plan with savings estimate',
  },
  get_demand_forecast: {
    description: '30-day market demand forecast for primary crop',
  },
  get_weather: {
    description: 'Current weather and growing conditions for farm location',
  },
  create_task: {
    description: 'Create an operational task assigned to the current user',
    params: {
      title: 'Task title',
      description: 'Task description',
      category: 'Task category (MONITORING, HARVESTING, etc.)',
      priority: 'LOW | MEDIUM | HIGH | URGENT',
    },
  },
  get_quality_summary: {
    description: 'Recent quality inspections and pass rates',
    params: { limit: 'Max records (default 10)' },
  },
  get_plant_scan_history: {
    description: 'Recent Plant Vision AI diagnoses from audit trail',
    params: { limit: 'Max scans (default 5)' },
  },
  analyze_plant: {
    description:
      'Plant Vision analysis from photo (imageDataUrl) or recent scan summary',
    params: {
      imageDataUrl: 'Base64 data URL (data:image/...) — optional',
      cropType: 'Crop type (default: primary active batch)',
      farmZone: 'Zone or location label',
      notes: 'Grower notes for context',
      batchId: 'Production batch / lot to link scan for traceability',
    },
  },
}

export function getMcpToolDescriptors(): McpToolDescriptor[] {
  return getToolNames().map(name => {
    const meta = TOOL_META[name] || { description: name }
    const properties: Record<string, { type: string; description: string }> = {}
    if (meta.params) {
      for (const [key, desc] of Object.entries(meta.params)) {
        properties[key] = { type: 'string', description: desc }
      }
    }
    return {
      name,
      description: meta.description,
      inputSchema: {
        type: 'object',
        properties,
        required: [],
      },
    }
  })
}

export const MCP_SERVER_INFO = {
  name: 'ofms-farm-agent',
  version: '2.0.0',
  protocol: 'mcp-streamable-http',
  mcpEndpoint: 'POST /api/mcp',
  invokeEndpoint: '/api/ai/agent',
  toolInvokeEndpoint: '/api/ai/agent/tools/{toolName}',
  auth: 'JWT session cookie + X-Farm-ID header (same as OFMS UI)',
}
