import { NextRequest, NextResponse } from 'next/server'
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards'
import { loadFarmContext } from '@/lib/ai/farmContextService'
import { alertEngine } from '@/lib/ai/alertEngine'
import { acknowledgeAlert } from '@/lib/ai/alertAcknowledgmentService'
import { finalizeFarmAlerts } from '@/lib/ai/alertPipeline'
import { logInference } from '@/lib/ai/inferenceLogger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { farmId, user } = await ensureFarmAccess(request)
    const farmContext = await loadFarmContext(farmId)

    const rawAlerts = await alertEngine.generateFarmAlerts(
      farmId,
      farmContext.alertBatchData,
      farmContext.resourceData,
      farmContext.location
    )

    const alerts = await finalizeFarmAlerts(farmId, user.id, rawAlerts)
    const stats = alertEngine.getAlertStats(alerts)

    return NextResponse.json({
      success: true,
      alerts,
      stats,
      timestamp: new Date().toISOString(),
      farmId,
    })
  } catch (error) {
    return errorResponse(error, 'Failed to generate alerts')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { farmId, user } = await ensureFarmAccess(request)
    const body = await request.json()
    const alertId = body.alertId

    if (!alertId) {
      return NextResponse.json(
        { success: false, error: 'alertId is required' },
        { status: 400 }
      )
    }

    await acknowledgeAlert(farmId, user.id, alertId)

    await logInference({
      farmId,
      userId: user.id,
      action: 'AI_ALERT_ACK',
      entity: 'Alert',
      entityId: alertId,
      details: { acknowledged: true, alertId },
    })

    return NextResponse.json({
      success: true,
      alertId,
      acknowledged: true,
      acknowledgedAt: new Date().toISOString(),
      farmId,
    })
  } catch (error) {
    return errorResponse(error, 'Failed to acknowledge alert')
  }
}
