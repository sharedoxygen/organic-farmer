import { execSync } from 'child_process'
import path from 'path'
import { prisma } from '@/lib/db'
import { runAgent } from '@/lib/ai/agent'
import type { AgentGoal } from '@/lib/ai/agent/types'
import { handleMcpJsonRpc } from '@/lib/ai/agent/mcpServer'
import { getMcpToolDescriptors } from '@/lib/ai/agent/mcpTools'
import { loadFarmContext } from '@/lib/ai/farmContextService'
import { getAiMetrics, getApiLatencyPercentiles } from '@/lib/ai/inferenceLogger'
import { getOperation } from './registry'
import { runMobileVerification } from './mobileVerify'
import type { OperationRunResult } from './types'

const ROOT = path.resolve(process.cwd())

const ALLOWED_NPM_SCRIPTS: Record<string, string> = {
  'data.seed-showcase': 'seed:showcase',
  'docs.user-guide': 'docs:user-guide',
  'mobile.configure': 'mobile:configure',
}

function str(v: unknown, fallback = ''): string {
  return v != null ? String(v) : fallback
}

function bool(v: unknown, fallback = false): boolean {
  if (typeof v === 'boolean') return v
  if (v === 'true') return true
  if (v === 'false') return false
  return fallback
}

function runNpmScript(scriptKey: string): { output: string; exitCode: number } {
  const script = ALLOWED_NPM_SCRIPTS[scriptKey]
  if (!script) throw new Error(`Script not allowlisted: ${scriptKey}`)
  try {
    const output = execSync(`npm run ${script}`, {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 300000,
      maxBuffer: 4 * 1024 * 1024,
    })
    return { output, exitCode: 0 }
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number }
    const output = [e.stdout, e.stderr].filter(Boolean).join('\n')
    return { output, exitCode: e.status ?? 1 }
  }
}

export async function executeOperation(
  operationId: string,
  params: Record<string, unknown>,
  ctx: { userId: string; userEmail: string; farmId: string }
): Promise<OperationRunResult> {
  const op = getOperation(operationId)
  if (!op) {
    return {
      success: false,
      operationId,
      summary: 'Unknown operation',
      durationMs: 0,
      error: `Operation not found: ${operationId}`,
    }
  }

  const start = Date.now()

  if (op.destructive && !bool(params.confirmDestructive)) {
    return {
      success: false,
      operationId,
      summary: 'Confirmation required',
      durationMs: Date.now() - start,
      error: 'Set confirmDestructive to run this operation',
    }
  }

  try {
    switch (operationId) {
      case 'agent.run': {
        const farmId = str(params.farmId, ctx.farmId)
        const message = str(params.message, 'What should I focus on today?')
        const result = await runAgent({
          message,
          farmId,
          userId: ctx.userId,
          userName: ctx.userEmail,
          goal: params.goal ? (str(params.goal) as AgentGoal) : undefined,
          useLlm: bool(params.useLlm),
        })
        return {
          success: true,
          operationId,
          summary: `Agent completed — ${result.toolsUsed.filter((t) => t.status === 'completed').length} tools`,
          output: result.answer,
          data: {
            toolsUsed: result.toolsUsed,
            confidence: result.confidence,
            dataCards: result.dataCards,
          },
          durationMs: Date.now() - start,
        }
      }

      case 'agent.verify': {
        const farmId = str(params.farmId, ctx.farmId)
        const farm = await prisma.farms.findUnique({
          where: { id: farmId },
          select: { owner_id: true, farm_name: true },
        })
        if (!farm) throw new Error('Farm not found')

        const fctx = await loadFarmContext(farmId)
        const result = await runAgent({
          message: str(params.message, 'What should I focus on today?'),
          farmId,
          userId: farm.owner_id,
          userName: 'operations-ui',
          useLlm: false,
        })
        const tools = result.toolsUsed
          .filter((t) => t.status === 'completed')
          .map((t) => t.tool)
        const ok = tools.length >= 2

        return {
          success: ok,
          operationId,
          summary: ok
            ? `Verified ${farm.farm_name}: ${tools.join(' → ')}`
            : `Agent verification failed (${tools.length} tools)`,
          data: {
            farmName: farm.farm_name,
            batches: fctx.allBatches.length,
            activeBatches: fctx.activeBatches.length,
            tools,
            confidence: result.confidence,
          },
          output: result.answer.slice(0, 500),
          durationMs: Date.now() - start,
        }
      }

      case 'mcp.tools-list': {
        const tools = getMcpToolDescriptors()
        return {
          success: true,
          operationId,
          summary: `${tools.length} MCP tools registered`,
          data: { tools },
          durationMs: Date.now() - start,
        }
      }

      case 'mcp.tools-call': {
        const farmId = str(params.farmId, ctx.farmId)
        const toolName = str(params.toolName)
        let args: Record<string, unknown> = {}
        if (params.arguments) {
          args =
            typeof params.arguments === 'string'
              ? (JSON.parse(params.arguments) as Record<string, unknown>)
              : (params.arguments as Record<string, unknown>)
        }
        const rpc = await handleMcpJsonRpc(
          {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: { name: toolName, arguments: args },
          },
          { farmId, userId: ctx.userId, userEmail: ctx.userEmail }
        )
        const err = rpc.error
        if (err) {
          return {
            success: false,
            operationId,
            summary: err.message,
            error: err.message,
            data: rpc,
            durationMs: Date.now() - start,
          }
        }
        return {
          success: true,
          operationId,
          summary: `Tool ${toolName} completed`,
          data: rpc.result,
          durationMs: Date.now() - start,
        }
      }

      case 'ai.typecheck': {
        try {
          const output = execSync('npm run type-check', {
            cwd: ROOT,
            encoding: 'utf8',
            timeout: 180000,
          })
          return {
            success: true,
            operationId,
            summary: 'TypeScript check passed',
            output,
            durationMs: Date.now() - start,
          }
        } catch (err: unknown) {
          const e = err as { stdout?: string; stderr?: string }
          return {
            success: false,
            operationId,
            summary: 'TypeScript check failed',
            output: [e.stdout, e.stderr].filter(Boolean).join('\n'),
            durationMs: Date.now() - start,
          }
        }
      }

      case 'ai.agent-tests': {
        const output = execSync(
          'npx jest __tests__/lib/ai --selectProjects node --coverage=false',
          { cwd: ROOT, encoding: 'utf8', timeout: 120000 }
        )
        return {
          success: true,
          operationId,
          summary: 'Agent unit tests passed',
          output,
          durationMs: Date.now() - start,
        }
      }

      case 'mobile.verify': {
        const checks = runMobileVerification()
        const failed = checks.filter((c) => !c.ok)
        return {
          success: failed.length === 0,
          operationId,
          summary: `${checks.length - failed.length}/${checks.length} mobile checks passed`,
          checks,
          durationMs: Date.now() - start,
        }
      }

      case 'mobile.configure':
      case 'data.seed-showcase':
      case 'docs.user-guide': {
        const { output, exitCode } = runNpmScript(operationId)
        return {
          success: exitCode === 0,
          operationId,
          summary: exitCode === 0 ? `${op.name} completed` : `${op.name} failed`,
          output: output.slice(-8000),
          durationMs: Date.now() - start,
        }
      }

      case 'observability.snapshot': {
        const farmId = str(params.farmId, ctx.farmId)
        const [aiMetrics, latency, audit24h] = await Promise.all([
          getAiMetrics(farmId),
          getApiLatencyPercentiles(farmId),
          prisma.audit_logs.count({
            where: {
              farm_id: farmId,
              timestamp: { gte: new Date(Date.now() - 86400000) },
            },
          }),
        ])
        return {
          success: true,
          operationId,
          summary: `${aiMetrics.inferenceCalls24h} AI inferences / 24h`,
          data: { aiMetrics, apiLatencyMs: latency, auditEvents24h: audit24h },
          durationMs: Date.now() - start,
        }
      }

      default:
        return {
          success: false,
          operationId,
          summary: 'Handler not implemented',
          durationMs: Date.now() - start,
          error: operationId,
        }
    }
  } catch (err) {
    return {
      success: false,
      operationId,
      summary: 'Operation failed',
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
