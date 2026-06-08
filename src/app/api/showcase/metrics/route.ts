import { NextRequest, NextResponse } from 'next/server'
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards'
import { generateAgentInsight } from '@/lib/ai/agent'
import { getShowcaseMetrics } from '@/lib/showcase/farmMetrics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { farmId, user } = await ensureFarmAccess(request)
    const metrics = await getShowcaseMetrics(farmId)
    try {
      metrics.aiSummary = await generateAgentInsight(farmId, user.id)
    } catch {
      // keep template summary from farmMetrics
    }
    return NextResponse.json({ success: true, data: metrics })
  } catch (error) {
    return errorResponse(
      error,
      'Failed to load showcase metrics',
      'Showcase metrics error:'
    )
  }
}
