import { ollamaService } from '../ollamaService'
import { agentTools, getToolNames } from './tools'
import { GOAL_TOOL_PLANS } from './goalPlans'
import type { AgentGoal } from './types'

export interface ToolPlanItem {
  tool: string
  params: Record<string, unknown>
}

export interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
}

const TOOL_CATALOG = getToolNames()
  .map((name) => {
    const t = agentTools[name]
    return `- ${name}: ${t?.description || ''}`
  })
  .join('\n')

function defaultPlan(goal: AgentGoal, message: string): ToolPlanItem[] {
  const tools = GOAL_TOOL_PLANS[goal] || GOAL_TOOL_PLANS.general
  return tools.map((tool) => ({
    tool,
    params: tool === 'create_task' ? extractTaskParams(message) : {},
  }))
}

function extractTaskParams(message: string): Record<string, unknown> {
  const titleMatch = message.match(/(?:task|remind(?:er)?)\s+(?:to\s+)?(.+)/i)
  return {
    title: titleMatch?.[1]?.slice(0, 120) || 'Follow up on AI recommendation',
    description: `Agent-created from: "${message.slice(0, 200)}"`,
    category: /harvest/i.test(message)
      ? 'HARVESTING'
      : /water|irrigat/i.test(message)
        ? 'WATERING'
        : 'MONITORING',
    priority: /urgent|critical|asap/i.test(message) ? 'HIGH' : 'MEDIUM',
  }
}

function parseLlmPlan(text: string, message: string): ToolPlanItem[] | null {
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return null
  try {
    const arr = JSON.parse(match[0]) as Array<{
      tool?: string
      params?: Record<string, unknown>
    }>
    const plan: ToolPlanItem[] = []
    for (const item of arr) {
      if (!item.tool || !agentTools[item.tool]) continue
      if (!agentTools[item.tool]) continue
      plan.push({
        tool: item.tool,
        params: item.params || {},
      })
    }
    if (plan.length === 0) return null
    if (!plan.some((p) => p.tool === 'create_task') && /create.*task|add.*task|remind/i.test(message)) {
      plan.push({ tool: 'create_task', params: extractTaskParams(message) })
    }
    return plan.slice(0, 6)
  } catch {
    return null
  }
}

/**
 * Plan which agent tools to run — LLM selection when Ollama is up, else goal-based defaults.
 */
export async function planAgentTools(
  message: string,
  goal: AgentGoal,
  history: ConversationTurn[] = [],
  options?: { preferGoalPlan?: boolean }
): Promise<ToolPlanItem[]> {
  const fallback = defaultPlan(goal, message)

  if (options?.preferGoalPlan) return fallback

  const healthy = await ollamaService.checkHealth()
  if (!healthy) return fallback

  const historyBlock =
    history.length > 0
      ? `\nRecent conversation:\n${history
          .slice(-4)
          .map((t) => `${t.role}: ${t.content.slice(0, 200)}`)
          .join('\n')}\n`
      : ''

  const prompt = `You are the OFMS farm operations agent planner. Select 1-5 tools to answer the user.

Available tools:
${TOOL_CATALOG}

User message: "${message}"
Classified goal: ${goal}
${historyBlock}

Respond with JSON array only, e.g.:
[{"tool":"get_farm_overview","params":{}},{"tool":"score_batches","params":{"limit":5}}]

Rules:
- Pick minimal tools needed
- Use create_task only when user asks to create/remind/schedule a task
- Use score_batches for batch health; predict_yield for harvest; generate_alerts for warnings
- Use get_plant_scan_history for past plant photo analyses
- params must be JSON objects`

  try {
    const raw = await ollamaService.generateCompletion(prompt)
    const llmPlan = parseLlmPlan(raw, message)
    if (llmPlan && llmPlan.length > 0) return llmPlan
  } catch {
    // use fallback
  }

  return fallback
}
