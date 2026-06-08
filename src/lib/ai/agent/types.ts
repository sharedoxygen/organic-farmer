import type { FarmContext } from '../farmContextService'

export interface AgentContext {
  farmId: string
  userId: string
  userName: string
  farmContext: FarmContext
  /** When false, write tools return a pending proposal instead of mutating data. */
  confirmWrites?: boolean
}

export interface ToolInvocation {
  tool: string
  params: Record<string, unknown>
  status: 'completed' | 'failed'
  durationMs: number
  summary?: string
  error?: string
}

export interface AgentDataCard {
  type: 'BATCH' | 'WEATHER' | 'ALERT' | 'METRIC' | 'CHART' | 'LIST' | 'TASK'
  title: string
  content: unknown
}

export interface AgentAction {
  type: string
  description: string
  status: 'COMPLETED' | 'PENDING' | 'FAILED'
  result?: unknown
}

export interface AgentRunResult {
  answer: string
  goal: string
  confidence: number
  toolsUsed: ToolInvocation[]
  dataCards: AgentDataCard[]
  actions: AgentAction[]
  suggestions: string[]
  insights: string[]
}

export interface AgentTool {
  name: string
  description: string
  execute: (
    ctx: AgentContext,
    params: Record<string, unknown>
  ) => Promise<{ summary: string; data: unknown }>
}

export type AgentGoal =
  | 'status'
  | 'batches'
  | 'yield'
  | 'alerts'
  | 'resources'
  | 'forecast'
  | 'create_task'
  | 'analyze'
  | 'plant'
  | 'recommend'
  | 'general'
