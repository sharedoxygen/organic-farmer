import { getToolNames } from '@/lib/ai/agent/tools'
import type { OperationDefinition } from './types'

const AGENT_GOALS = [
  'status',
  'batches',
  'yield',
  'alerts',
  'resources',
  'forecast',
  'plant',
  'recommend',
  'create_task',
  'general',
].map((g) => ({ value: g, label: g }))

const MCP_TOOLS = getToolNames().map((t) => ({ value: t, label: t }))

export const OFMS_OPERATIONS: OperationDefinition[] = [
  {
    id: 'agent.run',
    name: 'Run Farm Agent',
    description: 'Invoke the OFMS agent with a message and goal against live farm data',
    category: 'agent',
    icon: '🤖',
    cliEquivalent: 'POST /api/ai/agent',
    requiresSystemAdmin: false,
    params: [
      { key: 'farmId', label: 'Farm', type: 'farm', required: true },
      {
        key: 'message',
        label: 'Message',
        type: 'string',
        required: true,
        defaultValue: 'What should I focus on today?',
      },
      {
        key: 'goal',
        label: 'Goal hint',
        type: 'select',
        options: AGENT_GOALS,
      },
      {
        key: 'useLlm',
        label: 'Use LLM tool planner',
        type: 'boolean',
        defaultValue: false,
      },
    ],
    timeoutMs: 120000,
  },
  {
    id: 'agent.verify',
    name: 'Verify Agent (E2E)',
    description: 'Multi-tool agent run on a showcase farm (same as npm run verify:agent)',
    category: 'agent',
    icon: '🔬',
    cliEquivalent: 'npm run verify:agent',
    requiresSystemAdmin: false,
    params: [
      { key: 'farmId', label: 'Farm', type: 'farm', required: true },
      {
        key: 'message',
        label: 'Message',
        type: 'string',
        defaultValue: 'What should I focus on today?',
      },
    ],
    timeoutMs: 120000,
  },
  {
    id: 'mcp.tools-list',
    name: 'MCP — List Tools',
    description: 'List agent tools exposed via MCP JSON-RPC',
    category: 'mcp',
    icon: '🔌',
    cliEquivalent: 'POST /api/mcp tools/list',
    requiresSystemAdmin: false,
    params: [],
    timeoutMs: 10000,
  },
  {
    id: 'mcp.tools-call',
    name: 'MCP — Invoke Tool',
    description: 'Call a single agent tool via MCP tools/call semantics',
    category: 'mcp',
    icon: '⚡',
    cliEquivalent: 'POST /api/mcp tools/call',
    requiresSystemAdmin: false,
    params: [
      { key: 'farmId', label: 'Farm', type: 'farm', required: true },
      {
        key: 'toolName',
        label: 'Tool',
        type: 'select',
        required: true,
        options: MCP_TOOLS,
      },
      {
        key: 'arguments',
        label: 'Arguments (JSON)',
        type: 'json',
        placeholder: '{"limit": 5}',
        description: 'Optional tool parameters as JSON object',
      },
    ],
    timeoutMs: 120000,
  },
  {
    id: 'ai.typecheck',
    name: 'TypeScript Check',
    description: 'Run tsc --noEmit across the monolith',
    category: 'verification',
    icon: '📐',
    cliEquivalent: 'npm run type-check',
    requiresSystemAdmin: true,
    params: [],
    timeoutMs: 180000,
  },
  {
    id: 'ai.agent-tests',
    name: 'Agent Unit Tests',
    description: 'Run agent orchestrator unit tests',
    category: 'verification',
    icon: '🧪',
    cliEquivalent: 'jest agent.orchestrator',
    requiresSystemAdmin: true,
    params: [],
    timeoutMs: 60000,
  },
  {
    id: 'mobile.verify',
    name: 'Verify Mobile Setup',
    description: 'Audit Capacitor env, native configs, and mobile routes',
    category: 'mobile',
    icon: '📱',
    cliEquivalent: 'npm run mobile:verify',
    requiresSystemAdmin: false,
    params: [],
    timeoutMs: 180000,
  },
  {
    id: 'mobile.configure',
    name: 'Configure Mobile',
    description: 'Sync Capacitor server URL and native configs from .env',
    category: 'mobile',
    icon: '⚙️',
    cliEquivalent: 'npm run mobile:configure',
    requiresSystemAdmin: true,
    destructive: true,
    params: [
      {
        key: 'confirmDestructive',
        label: 'I understand this updates native mobile configs',
        type: 'boolean',
        required: true,
      },
    ],
    timeoutMs: 120000,
  },
  {
    id: 'data.seed-showcase',
    name: 'Seed Showcase Data',
    description: 'Enhance Curry Island + Shared Oxygen demo operational data',
    category: 'data',
    icon: '🌱',
    cliEquivalent: 'npm run seed:showcase',
    requiresSystemAdmin: true,
    destructive: true,
    params: [
      {
        key: 'confirmDestructive',
        label: 'Confirm showcase seed (mutates demo data)',
        type: 'boolean',
        required: true,
      },
    ],
    timeoutMs: 300000,
  },
  {
    id: 'docs.user-guide',
    name: 'Generate User Guide',
    description: 'Build OFMS user guide artifacts',
    category: 'docs',
    icon: '📚',
    cliEquivalent: 'npm run docs:user-guide',
    requiresSystemAdmin: true,
    params: [],
    timeoutMs: 300000,
  },
  {
    id: 'observability.snapshot',
    name: 'Observability Snapshot',
    description: 'AI inference metrics and recent audit trail for a farm',
    category: 'observability',
    icon: '📡',
    cliEquivalent: 'GET /api/observability/metrics',
    requiresSystemAdmin: false,
    params: [{ key: 'farmId', label: 'Farm', type: 'farm', required: true }],
    timeoutMs: 30000,
  },
]

export function getOperation(id: string): OperationDefinition | undefined {
  return OFMS_OPERATIONS.find((o) => o.id === id)
}

export function listOperations(): OperationDefinition[] {
  return OFMS_OPERATIONS
}
