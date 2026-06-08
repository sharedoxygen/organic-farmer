import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAiMetrics, getApiLatencyPercentiles } from '@/lib/ai/inferenceLogger'
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { farmId } = await ensureFarmAccess(request)

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      audit24h,
      audit7d,
      batches,
      orders,
      tasks,
      qualityChecks,
      custodyEvents,
      recentAudit,
    ] = await Promise.all([
      prisma.audit_logs.count({
        where: { farm_id: farmId, timestamp: { gte: since24h } },
      }),
      prisma.audit_logs.count({
        where: { farm_id: farmId, timestamp: { gte: since7d } },
      }),
      prisma.batches.count({ where: { farm_id: farmId } }),
      prisma.orders.count({ where: { farm_id: farmId } }),
      prisma.tasks.count({ where: { farm_id: farmId } }),
      prisma.quality_checks.count({ where: { farm_id: farmId } }),
      prisma.custody_events.count({ where: { farm_id: farmId } }),
      prisma.audit_logs.findMany({
        where: { farm_id: farmId },
        orderBy: { timestamp: 'desc' },
        take: 12,
      }),
    ])

    const entityCounts = {
      batches,
      orders,
      tasks,
      qualityChecks,
      custodyEvents,
    }

    const healthScore = Math.min(
      100,
      70 +
        Math.min(audit7d, 50) * 0.3 +
        Math.min(custodyEvents, 30) * 0.5 +
        Math.min(qualityChecks, 20) * 0.4
    )

    const [aiMetrics, apiLatencyMs] = await Promise.all([
      getAiMetrics(farmId),
      getApiLatencyPercentiles(farmId),
    ])

    return NextResponse.json({
      success: true,
      data: {
        healthScore: Math.round(healthScore),
        auditEvents24h: audit24h,
        auditEvents7d: audit7d,
        entityCounts,
        apiLatencyMs,
        aiMetrics,
        recentAudit: recentAudit.map(row => ({
          id: row.id,
          action: row.action,
          entity: row.entity,
          timestamp: row.timestamp,
        })),
      },
    })
  } catch (error) {
    return errorResponse(
      error,
      'Failed to load observability metrics',
      'Observability error:'
    )
  }
}
