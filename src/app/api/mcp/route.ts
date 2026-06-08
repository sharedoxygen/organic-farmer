import { NextRequest, NextResponse } from 'next/server'
import {
  handleMcpJsonRpc,
  jsonRpcError,
  parseJsonRpcBody,
} from '@/lib/ai/agent/mcpServer'
import { logInference } from '@/lib/ai/inferenceLogger'
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards'

export const dynamic = 'force-dynamic'

const MCP_PROTOCOL_HEADER = 'MCP-Protocol-Version'

/**
 * Streamable HTTP MCP endpoint (JSON-RPC 2.0)
 * POST /api/mcp — initialize | tools/list | tools/call
 * Auth: same session cookie + X-Farm-ID as OFMS UI
 */
export async function POST(request: NextRequest) {
  try {
    const { farmId, user } = await ensureFarmAccess(request)
    const body = await request.json()
    const rpc = parseJsonRpcBody(body)

    if (!rpc) {
      return NextResponse.json(
        jsonRpcError(null, -32600, 'Invalid JSON-RPC 2.0 request'),
        { status: 400 }
      )
    }

    const start = Date.now()
    const response = await handleMcpJsonRpc(rpc, {
      farmId,
      userId: user.id,
      userEmail: user.email,
    })

    if (rpc.method === 'tools/call') {
      const toolName = String((rpc.params as Record<string, unknown>)?.name || '')
      await logInference({
        farmId,
        userId: user.id,
        action: 'AI_MCP_TOOL_CALL',
        entity: toolName,
        details: {
          method: rpc.method,
          durationMs: Date.now() - start,
        },
      })
    }

    return NextResponse.json(response, {
      headers: {
        [MCP_PROTOCOL_HEADER]: '2025-06-18',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    return errorResponse(error, 'MCP request failed')
  }
}

/** Optional SSE stream placeholder — clients may GET to probe capability */
export async function GET() {
  return NextResponse.json({
    name: 'ofms-farm-agent',
    protocol: 'mcp-streamable-http',
    version: '2.0.0',
    mcpEndpoint: 'POST /api/mcp',
    methods: ['initialize', 'tools/list', 'tools/call', 'ping'],
    auth: 'JWT session cookie + X-Farm-ID header',
  })
}
