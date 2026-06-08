import { NextRequest, NextResponse } from 'next/server'
import { loadFarmContext } from '@/lib/ai/farmContextService'
import { agentTools, getToolNames } from '@/lib/ai/agent/tools'
import { logInference } from '@/lib/ai/inferenceLogger'
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards'
import type { AgentContext } from '@/lib/ai/agent/types'

export const dynamic = 'force-dynamic'

/** POST /api/ai/agent/tools/:name — Direct tool invocation for agents and integrations */
export async function POST(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { farmId, user } = await ensureFarmAccess(request)
    const toolName = params.name

    if (!getToolNames().includes(toolName)) {
      return NextResponse.json(
        { error: `Unknown tool: ${toolName}`, available: getToolNames() },
        { status: 404 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const toolParams = (body.params || body) as Record<string, unknown>

    const farmContext = await loadFarmContext(farmId)
    const ctx: AgentContext = {
      farmId,
      userId: user.id,
      userName: user.email,
      farmContext,
    }

    const start = Date.now()
    const result = await agentTools[toolName].execute(ctx, toolParams)

    await logInference({
      farmId,
      userId: user.id,
      action: 'AI_TOOL_INVOKE',
      entity: toolName,
      details: {
        tool: toolName,
        params: toolParams,
        durationMs: Date.now() - start,
      },
    })

    return NextResponse.json({
      success: true,
      tool: toolName,
      summary: result.summary,
      data: result.data,
      durationMs: Date.now() - start,
      farmId,
    })
  } catch (error) {
    return errorResponse(error, 'Tool invocation failed')
  }
}

/** GET /api/ai/agent/tools/:name — Tool metadata */
export async function GET(
  _request: NextRequest,
  { params }: { params: { name: string } }
) {
  const tool = agentTools[params.name]
  if (!tool) {
    return NextResponse.json(
      { error: `Unknown tool: ${params.name}`, available: getToolNames() },
      { status: 404 }
    )
  }
  return NextResponse.json({
    name: tool.name,
    description: tool.description,
    invoke: `POST /api/ai/agent/tools/${tool.name}`,
  })
}
