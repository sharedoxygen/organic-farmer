import { loadFarmContext } from '../farmContextService'
import { logInference } from '../inferenceLogger'
import { ollamaService } from '../ollamaService'
import { agentTools } from './tools'
import { planAgentTools, type ConversationTurn } from './toolPlanner'
import { classifyGoal, GOAL_TOOL_PLANS } from './goalPlans'
import type {
  AgentAction,
  AgentContext,
  AgentDataCard,
  AgentGoal,
  AgentRunResult,
  ToolInvocation,
} from './types'

export { classifyGoal, GOAL_TOOL_PLANS }

async function executeTool(
  ctx: AgentContext,
  toolName: string,
  params: Record<string, unknown>
): Promise<ToolInvocation & { data?: unknown }> {
  const start = Date.now()
  const tool = agentTools[toolName]
  if (!tool) {
    return {
      tool: toolName,
      params,
      status: 'failed',
      durationMs: Date.now() - start,
      error: `Unknown tool: ${toolName}`,
    }
  }
  try {
    const result = await tool.execute(ctx, params)
    return {
      tool: toolName,
      params,
      status: 'completed',
      durationMs: Date.now() - start,
      summary: result.summary,
      data: result.data,
    }
  } catch (err) {
    return {
      tool: toolName,
      params,
      status: 'failed',
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Tool failed',
    }
  }
}

function buildDataCards(invocations: ToolInvocation[]): AgentDataCard[] {
  const cards: AgentDataCard[] = []
  for (const inv of invocations) {
    if (inv.status !== 'completed' || !('data' in inv)) continue
    const data = (inv as ToolInvocation & { data?: unknown }).data

    if (inv.tool === 'score_batches' && Array.isArray(data)) {
      cards.push({ type: 'BATCH', title: 'Batch Health Scores', content: data })
    }
    if (inv.tool === 'generate_alerts' && data && typeof data === 'object') {
      const alerts = (data as { alerts?: unknown[] }).alerts
      if (alerts?.length) {
        cards.push({ type: 'ALERT', title: 'Active Alerts', content: alerts.slice(0, 5) })
      }
    }
    if (inv.tool === 'get_farm_overview') {
      cards.push({ type: 'METRIC', title: 'Farm Overview', content: data })
    }
    if (inv.tool === 'predict_yield' && data) {
      cards.push({ type: 'CHART', title: 'Yield Forecast', content: data })
    }
    if (inv.tool === 'get_demand_forecast' && data) {
      cards.push({ type: 'CHART', title: 'Demand Forecast', content: data })
    }
    if (inv.tool === 'optimize_resources' && data) {
      cards.push({ type: 'LIST', title: 'Resource Optimization', content: data })
    }
    if (inv.tool === 'get_weather' && data) {
      cards.push({ type: 'WEATHER', title: 'Weather & Growing Conditions', content: data })
    }
    if (inv.tool === 'create_task' && data) {
      cards.push({ type: 'TASK', title: 'Task Created', content: data })
    }
    if (inv.tool === 'get_quality_summary' && data) {
      cards.push({ type: 'LIST', title: 'Quality Inspections', content: data })
    }
    if (inv.tool === 'get_plant_scan_history' && Array.isArray(data)) {
      cards.push({ type: 'LIST', title: 'Recent Plant Scans', content: data })
    }
  }
  return cards
}

function buildActions(invocations: ToolInvocation[]): AgentAction[] {
  return invocations
    .filter((i) => i.status === 'completed')
    .map((i) => ({
      type: i.tool,
      description: i.summary || i.tool,
      status: 'COMPLETED' as const,
      result: (i as ToolInvocation & { data?: unknown }).data,
    }))
}

function synthesizeAnswer(
  goal: AgentGoal,
  invocations: ToolInvocation[],
  farmName: string
): { answer: string; insights: string[]; confidence: number } {
  const completed = invocations.filter((i) => i.status === 'completed')
  const insights: string[] = completed.map((i) => i.summary || '').filter(Boolean)

  if (completed.length === 0) {
    return {
      answer: `I couldn't gather live data for ${farmName} right now. Please try again or check farm connectivity.`,
      insights: [],
      confidence: 0.4,
    }
  }

  const parts: string[] = [`**${farmName} — Agent Report**\n`]
  for (const inv of completed) {
    if (inv.summary) parts.push(`• ${inv.summary}`)
  }

  if (goal === 'create_task') {
    const taskInv = completed.find((i) => i.tool === 'create_task')
    if (taskInv?.summary) parts.push(`\n✅ ${taskInv.summary}`)
  }

  if (goal === 'plant') {
    parts.push('\n📷 Use **Plant Vision Scan** (/mobile/plant-scan) to capture a new field photo.')
  }

  if (goal === 'recommend' || goal === 'analyze') {
    parts.push('\n**Recommended focus:**')
    const alertInv = completed.find((i) => i.tool === 'generate_alerts')
    const scoreInv = completed.find((i) => i.tool === 'score_batches')
    if (alertInv?.summary) parts.push(`1. Address alerts — ${alertInv.summary}`)
    if (scoreInv?.summary) parts.push(`2. Batch health — ${scoreInv.summary}`)
    parts.push('3. Review resource optimization for cost savings')
  }

  const confidence = Math.min(
    0.95,
    0.65 + completed.length * 0.08 - invocations.filter((i) => i.status === 'failed').length * 0.1
  )

  return {
    answer: parts.join('\n'),
    insights,
    confidence: Math.round(confidence * 100) / 100,
  }
}

async function enhanceWithLlm(
  answer: string,
  message: string,
  insights: string[],
  history: ConversationTurn[]
): Promise<string> {
  const available = await ollamaService.checkHealth()
  if (!available) return answer

  const historyBlock =
    history.length > 0
      ? `Conversation:\n${history.slice(-3).map((t) => `${t.role}: ${t.content.slice(0, 150)}`).join('\n')}\n\n`
      : ''

  try {
    const prompt = `You are OFMS Farm Agent — auditable operations intelligence for organic farms.
Refine this agent report into 3-6 concise, actionable sentences. Keep all facts and numbers.
${historyBlock}User asked: "${message}"

Facts:
${insights.join('\n')}

Draft:
${answer}

Refined response:`
    const refined = await ollamaService.generateCompletion(prompt)
    return refined.trim() || answer
  } catch {
    return answer
  }
}

export async function runAgent(params: {
  message: string
  farmId: string
  userId: string
  userName?: string
  goal?: AgentGoal
  useLlm?: boolean
  conversationHistory?: ConversationTurn[]
  toolPlan?: Array<{ tool: string; params?: Record<string, unknown> }>
}): Promise<AgentRunResult> {
  const farmContext = await loadFarmContext(params.farmId)
  const goal = params.goal || classifyGoal(params.message)
  const history = params.conversationHistory || []

  const ctx: AgentContext = {
    farmId: params.farmId,
    userId: params.userId,
    userName: params.userName || 'Operator',
    farmContext,
  }

  const plan =
    params.toolPlan?.map((p) => ({
      tool: p.tool,
      params: p.params || {},
    })) ||
      (await planAgentTools(params.message, goal, history, {
        preferGoalPlan: params.useLlm === false,
      }))

  const invocations: ToolInvocation[] = []
  for (const { tool, params: toolParams } of plan) {
    const inv = await executeTool(ctx, tool, toolParams)
    invocations.push(inv)
  }

  let { answer, insights, confidence } = synthesizeAnswer(
    goal,
    invocations,
    farmContext.farmName
  )

  if (params.useLlm !== false) {
    answer = await enhanceWithLlm(answer, params.message, insights, history)
  }

  const suggestions = buildSuggestions(goal, farmContext.farmName)

  const result: AgentRunResult = {
    answer,
    goal: params.message,
    confidence,
    toolsUsed: invocations,
    dataCards: buildDataCards(invocations),
    actions: buildActions(invocations),
    suggestions,
    insights,
  }

  await logInference({
    farmId: params.farmId,
    userId: params.userId,
    action: 'AI_AGENT_RUN',
    entity: 'Agent',
    details: {
      goal,
      tools: invocations.map((i) => i.tool),
      confidence,
      messagePreview: params.message.slice(0, 100),
      plannedTools: plan.map((p) => p.tool),
    },
  })

  return result
}

function buildSuggestions(goal: AgentGoal, farmName: string): string[] {
  const base = [
    `How is ${farmName} doing today?`,
    'Score active batches',
    'Any critical alerts?',
    'Optimize resources',
    'Open Plant Vision Scan',
  ]
  if (goal === 'plant') {
    return ['Scan a plant photo', 'Show recent plant scans', ...base.slice(1)]
  }
  if (goal === 'forecast') {
    return ['Demand forecast for top crop', 'Predict harvest yield', ...base]
  }
  return base
}

export async function generateAgentInsight(farmId: string, userId: string): Promise<string> {
  const result = await runAgent({
    message: 'Give a 2-sentence executive summary of farm status and top priority action',
    farmId,
    userId,
    goal: 'recommend',
    useLlm: false,
  })
  return result.insights.slice(0, 2).join(' ') || result.answer.slice(0, 280)
}

export const agentOrchestrator = { runAgent, classifyGoal, generateAgentInsight }
