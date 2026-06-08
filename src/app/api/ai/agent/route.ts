import { NextRequest, NextResponse } from 'next/server'
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards'
import { runAgent, classifyGoal } from '@/lib/ai/agent'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { farmId, user } = await ensureFarmAccess(request)
    const body = await request.json()
    const message = body.message?.trim()

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'message is required' },
        { status: 400 }
      )
    }

    const result = await runAgent({
      message,
      farmId,
      userId: user.id,
      userName: user.email,
      goal: body.goal,
      useLlm: body.useLlm,
    })

    return NextResponse.json({
      success: true,
      result,
      goal: classifyGoal(message),
      farmId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return errorResponse(error, 'Agent run failed')
  }
}

export async function GET(request: NextRequest) {
  try {
    const { farmId } = await ensureFarmAccess(request)

    return NextResponse.json({
      success: true,
      agent: {
        name: 'OFMS Farm Agent',
        version: '2.0.0',
        mode: 'agentic-llm-planned',
        tools: [
          'get_farm_overview',
          'score_batches',
          'predict_yield',
          'generate_alerts',
          'optimize_resources',
          'get_demand_forecast',
          'get_weather',
          'get_quality_summary',
          'get_plant_scan_history',
          'analyze_plant',
          'create_task',
        ],
        toolInvoke: 'POST /api/ai/agent/tools/{toolName}',
        sampleGoals: [
          "How's my farm doing?",
          'Score active batches',
          'What should I focus on today?',
          'Create task to check harvest readiness',
          'Optimize water and labor',
          'Any critical alerts?',
        ],
      },
      farmId,
    })
  } catch (error) {
    return errorResponse(error, 'Failed to get agent info')
  }
}
