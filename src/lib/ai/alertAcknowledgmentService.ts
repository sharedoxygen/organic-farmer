import { prisma } from '@/lib/db'
import type { AIAlert, AlertType } from './alertEngine'

/** Deterministic alert IDs — must not include timestamps so acknowledgments persist across GETs */
export function buildStableAlertId(parts: {
  type: AlertType | string
  farmId: string
  batchId?: string
  resourceType?: string
  weatherId?: string
  cropType?: string
}): string {
  const { type, farmId, batchId, resourceType, weatherId, cropType } = parts
  if (batchId) return `${type}:${farmId}:${batchId}`
  if (weatherId) return `${type}:${farmId}:${weatherId}`
  if (resourceType) return `${type}:${farmId}:${resourceType}`
  if (cropType) return `${type}:${farmId}:${cropType}`
  return `${type}:${farmId}`
}

export interface AlertAckRecord {
  acknowledgedAt: Date
  acknowledgedBy: string
}

/** Latest acknowledgment per stable alert ID from audit trail */
export async function loadAlertAcknowledgments(
  farmId: string
): Promise<Map<string, AlertAckRecord>> {
  const rows = await prisma.audit_logs.findMany({
    where: {
      farm_id: farmId,
      action: { in: ['ALERT_ACKNOWLEDGED', 'AI_ALERT_ACK'] },
    },
    orderBy: { timestamp: 'desc' },
    take: 500,
  })

  const map = new Map<string, AlertAckRecord>()
  for (const row of rows) {
    const details = (row.details || {}) as Record<string, unknown>
    const alertId =
      (typeof row.entityId === 'string' && row.entityId) ||
      (typeof details.alertId === 'string' ? details.alertId : '')
    if (!alertId || map.has(alertId)) continue
    map.set(alertId, {
      acknowledgedAt: row.timestamp,
      acknowledgedBy: row.userId,
    })
  }
  return map
}

/** Apply persisted acknowledgments from audit_logs */
export function applyAlertAcknowledgments(
  alerts: AIAlert[],
  acks: Map<string, AlertAckRecord>
): AIAlert[] {
  return alerts.map((alert) => {
    const ack = acks.get(alert.id)
    if (!ack) return alert
    return {
      ...alert,
      acknowledged: true,
      acknowledgedAt: ack.acknowledgedAt,
      acknowledgedBy: ack.acknowledgedBy,
    }
  })
}

export async function acknowledgeAlert(
  farmId: string,
  userId: string,
  alertId: string
): Promise<void> {
  await prisma.audit_logs.create({
    data: {
      farm_id: farmId,
      userId,
      action: 'ALERT_ACKNOWLEDGED',
      entity: 'AIAlert',
      entityId: alertId,
      details: { alertId, acknowledged: true },
    },
  })
}
