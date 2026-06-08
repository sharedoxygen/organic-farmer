import { loadFarmContext } from '../farmContextService'
import { agentTools, getToolNames } from './tools'
import { getMcpToolDescriptors } from './mcpTools'
import type { AgentContext } from './types'

export interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: Record<string, unknown>
}

export interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: string | number | null
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

const PROTOCOL_VERSION = '2025-06-18'

export function parseJsonRpcBody(body: unknown): JsonRpcRequest | null {
  if (!body || typeof body !== 'object') return null
  const req = body as JsonRpcRequest
  if (req.jsonrpc !== '2.0' || typeof req.method !== 'string') return null
  return req
}

export function jsonRpcResult(
  id: string | number | null,
  result: unknown
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result }
}

export function jsonRpcError(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message, data } }
}

export async function handleMcpJsonRpc(
  request: JsonRpcRequest,
  ctx: { farmId: string; userId: string; userEmail: string }
): Promise<JsonRpcResponse> {
  const id = request.id ?? null

  switch (request.method) {
    case 'initialize':
      return jsonRpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: {
          name: 'ofms-farm-agent',
          version: '2.0.0',
        },
      })

    case 'tools/list':
      return jsonRpcResult(id, { tools: getMcpToolDescriptors() })

    case 'tools/call': {
      const params = request.params || {}
      const name = String(params.name || '')
      const args = (params.arguments || {}) as Record<string, unknown>

      if (!getToolNames().includes(name)) {
        return jsonRpcError(id, -32602, `Unknown tool: ${name}`, {
          available: getToolNames(),
        })
      }

      const farmContext = await loadFarmContext(ctx.farmId)
      const agentCtx: AgentContext = {
        farmId: ctx.farmId,
        userId: ctx.userId,
        userName: ctx.userEmail,
        farmContext,
      }

      const start = Date.now()
      const toolResult = await agentTools[name].execute(agentCtx, args)

      return jsonRpcResult(id, {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                summary: toolResult.summary,
                data: toolResult.data,
                durationMs: Date.now() - start,
              },
              null,
              2
            ),
          },
        ],
        isError: false,
      })
    }

    case 'ping':
      return jsonRpcResult(id, {})

    default:
      return jsonRpcError(id, -32601, `Method not found: ${request.method}`)
  }
}
