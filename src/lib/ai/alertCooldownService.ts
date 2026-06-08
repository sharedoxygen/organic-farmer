import { prisma } from '@/lib/db'
import type { AIAlert, AlertType } from './alertEngine'

export const ALERT_COOLDOWN_MINUTES: Partial<Record<AlertType, number>> = {
  DISEASE_OUTBREAK: 60,
  HARVEST_OPTIMAL: 1440,
  MARKET_OPPORTUNITY: 720,
  RESOURCE_LOW: 1440,
  WEATHER_WARNING: 360,
  BATCH_ATTENTION: 120,
  QUALITY_ISSUE: 240,
  YIELD_ANOMALY: 360,
  COMPLIANCE_REMINDER: 1440,
  MAINTENANCE_DUE: 720,
}

const DEFAULT_COOLDOWN_MINUTES = 60
const MAX_LOOKBACK_MINUTES = 1440

function cooldownMs(type: AlertType): number {
  const minutes = ALERT_COOLDOWN_MINUTES[type] ?? DEFAULT_COOLDOWN_MINUTES
  return minutes * 60 * 1000
}

/** Load most recent ALERT_EMITTED timestamp per stable alert ID */
export async function loadAlertEmissions(
  farmId: string
): Promise<Map<string, Date>> {
  const since = new Date(Date.now() - MAX_LOOKBACK_MINUTES * 60 * 1000)
  const rows = await prisma.audit_logs.findMany({
    where: {
      farm_id: farmId,
      action: 'ALERT_EMITTED',
      timestamp: { gte: since },
    },
    orderBy: { timestamp: 'desc' },
    take: 500,
  })

  const map = new Map<string, Date>()
  for (const row of rows) {
    const alertId = row.entityId
    if (alertId && !map.has(alertId)) {
      map.set(alertId, row.timestamp)
    }
  }
  return map
}

/** Suppress alerts still inside DB-backed cooldown window */
export function filterAlertsByCooldown(
  alerts: AIAlert[],
  emissions: Map<string, Date>
): AIAlert[] {
  const now = Date.now()
  return alerts.filter((alert) => {
    const emittedAt = emissions.get(alert.id)
    if (!emittedAt) return true
    return now - emittedAt.getTime() >= cooldownMs(alert.type)
  })
}

/** Record emissions for alerts returned to clients (persists across serverless instances) */
export async function recordAlertEmissions(
  farmId: string,
  userId: string,
  alerts: AIAlert[]
): Promise<void> {
  if (alerts.length === 0) return

  await prisma.audit_logs.createMany({
    data: alerts.map((alert) => ({
      farm_id: farmId,
      userId,
      action: 'ALERT_EMITTED',
      entity: 'AIAlert',
      entityId: alert.id,
      details: {
        alertId: alert.id,
        type: alert.type,
        severity: alert.severity,
        batchId: alert.batchId,
      },
    })),
  })
}
