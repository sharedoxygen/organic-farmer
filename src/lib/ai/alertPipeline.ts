import {
  applyAlertAcknowledgments,
  loadAlertAcknowledgments,
} from './alertAcknowledgmentService'
import {
  filterAlertsByCooldown,
  loadAlertEmissions,
  recordAlertEmissions,
} from './alertCooldownService'
import type { AIAlert } from './alertEngine'

/** Acknowledgments + DB cooldown + emission logging for alert GET/agent paths */
export async function finalizeFarmAlerts(
  farmId: string,
  userId: string,
  rawAlerts: AIAlert[]
): Promise<AIAlert[]> {
  const [acks, emissions] = await Promise.all([
    loadAlertAcknowledgments(farmId),
    loadAlertEmissions(farmId),
  ])

  const withAcks = applyAlertAcknowledgments(rawAlerts, acks)
  const visible = filterAlertsByCooldown(withAcks, emissions)
  await recordAlertEmissions(farmId, userId, visible)
  return visible
}
