import { NextRequest, NextResponse } from 'next/server'
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards'
import { loadFarmContext } from '@/lib/ai/farmContextService'
import { runAgent } from '@/lib/ai/agent'
import {
  loadConversationHistory,
  saveConversationTurn,
} from '@/lib/ai/conversationMemory'
import { farmAssistant, ConversationMessage } from '@/lib/ai/farmAssistant'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { farmId, user } = await ensureFarmAccess(request)
    const body = await request.json()
    const message = body.message?.trim()

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    const farmContext = await loadFarmContext(farmId)
    const userName = user.email
    const priorTurns = await loadConversationHistory(farmId, user.id, 6)
    const clientHistory = Array.isArray(body.conversationHistory)
      ? body.conversationHistory
      : []
    const conversationHistory = [
      ...priorTurns.map((t) => ({
        role: t.role as 'user' | 'assistant',
        content: t.content,
      })),
      ...clientHistory.slice(-4).map((m: { role: string; content: string }) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: String(m.content || ''),
      })),
    ].slice(-8)

    const agentResult = await runAgent({
      message,
      farmId,
      userId: user.id,
      userName,
      useLlm: body.useLlm !== false,
      conversationHistory,
    })

    const response = {
      message: agentResult.answer,
      intent: 'UNKNOWN' as const,
      confidence: agentResult.confidence,
      actions: agentResult.actions,
      suggestions: agentResult.suggestions,
      dataCards: agentResult.dataCards,
      quickReplies: agentResult.suggestions,
      agent: {
        toolsUsed: agentResult.toolsUsed,
        insights: agentResult.insights,
      },
    }

    if (/^help$|what can you|capabilities/i.test(message)) {
      const help = await farmAssistant.processMessage(message, {
        farmId,
        farmName: farmContext.farmName,
        location: farmContext.location,
        userId: user.id,
        userName,
        conversationHistory: body.conversationHistory || [],
        currentData: farmContext.assistantData,
      })
      if (help.intent === 'GENERAL_HELP') {
        response.message = help.message
      }
    }

    const userMessage: ConversationMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    }

    const assistantMessage: ConversationMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: response.message,
      timestamp: new Date(),
      metadata: {
        intent: response.intent,
        confidence: response.confidence,
        actionsTaken: response.actions,
      },
    }

    const toolsUsed = agentResult.toolsUsed
      .filter(t => t.status === 'completed')
      .map(t => t.tool)
    await saveConversationTurn(
      farmId,
      user.id,
      message,
      response.message,
      toolsUsed
    )

    return NextResponse.json({
      success: true,
      response,
      messages: [userMessage, assistantMessage],
      conversationHistory: priorTurns,
      timestamp: new Date().toISOString(),
      farmId,
    })
  } catch (error) {
    return errorResponse(error, 'Assistant failed to process message')
  }
}

export async function GET(request: NextRequest) {
  try {
    const { farmId } = await ensureFarmAccess(request)

    return NextResponse.json({
      success: true,
      assistant: {
        name: 'OFMS Farm Agent',
        version: '2.0.0',
        mode: 'agentic',
        capabilities: [
          'LLM-planned multi-tool orchestration',
          'Conversation-aware reasoning',
          'Live DB-grounded farm context',
          'Batch scoring and yield prediction',
          'Plant Vision scan history and batch-linked field scans',
          'Persistent alert acknowledgment via audit trail',
          'Quality inspection summaries',
          'Proactive alert generation',
          'Resource optimization (real equipment & zones)',
          'Task creation',
          'Order-grounded demand forecasting',
          'Direct tool invoke: POST /api/ai/agent/tools/:name',
        ],
        sampleQueries: [
          "How's my farm doing?",
          'Score active batches',
          'What should I focus on today?',
          'Create task to inspect harvest readiness',
          'Any critical alerts?',
          'Optimize water and labor',
        ],
      },
      farmId,
    })
  } catch (error) {
    return errorResponse(error, 'Failed to get assistant info')
  }
}
