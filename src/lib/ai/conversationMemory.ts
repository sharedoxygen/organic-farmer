import { prisma } from '@/lib/db'
import { logInference } from './inferenceLogger'

export interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  toolsUsed?: string[]
}

const MAX_TURNS = 20

export async function loadConversationHistory(
  farmId: string,
  userId: string,
  limit = 10
): Promise<ConversationTurn[]> {
  const rows = await prisma.audit_logs.findMany({
    where: {
      farm_id: farmId,
      userId,
      action: 'AI_CONVERSATION_TURN',
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
  })

  const turns: ConversationTurn[] = []
  for (const row of rows.reverse()) {
    const d = row.details as Record<string, unknown> | null
    if (!d) continue
    if (typeof d.userMessage === 'string') {
      turns.push({
        role: 'user',
        content: d.userMessage,
        timestamp: row.timestamp,
      })
    }
    if (typeof d.assistantMessage === 'string') {
      turns.push({
        role: 'assistant',
        content: d.assistantMessage,
        timestamp: row.timestamp,
        toolsUsed: Array.isArray(d.toolsUsed)
          ? (d.toolsUsed as string[])
          : undefined,
      })
    }
  }
  return turns.slice(-MAX_TURNS)
}

export async function saveConversationTurn(
  farmId: string,
  userId: string,
  userMessage: string,
  assistantMessage: string,
  toolsUsed?: string[]
): Promise<void> {
  await logInference({
    farmId,
    userId,
    action: 'AI_CONVERSATION_TURN',
    entity: 'Conversation',
    details: {
      userMessage: userMessage.slice(0, 2000),
      assistantMessage: assistantMessage.slice(0, 4000),
      toolsUsed,
    },
  })
}
