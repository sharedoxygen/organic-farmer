import { NextRequest, NextResponse } from 'next/server'
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards'
import { getMcpToolDescriptors, MCP_SERVER_INFO } from '@/lib/ai/agent/mcpTools'

export const dynamic = 'force-dynamic'

/** GET /api/ai/agent/tools — MCP-compatible tool catalog for external agents */
export async function GET(request: NextRequest) {
  try {
    const { farmId } = await ensureFarmAccess(request)

    return NextResponse.json({
      success: true,
      server: MCP_SERVER_INFO,
      tools: getMcpToolDescriptors(),
      farmId,
      usage: {
        invoke: 'POST /api/ai/agent with { message: "your goal" }',
        example:
          'Score active batches and create a follow-up task if any score below 70',
      },
    })
  } catch (error) {
    return errorResponse(error, 'Failed to list agent tools')
  }
}
