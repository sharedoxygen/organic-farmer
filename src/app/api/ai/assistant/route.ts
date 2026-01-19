import { NextRequest, NextResponse } from 'next/server';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import { farmAssistant, AssistantContext, ConversationMessage } from '@/lib/ai/farmAssistant';

export const dynamic = 'force-dynamic';

// POST /api/ai/assistant - Send message to farm assistant
export async function POST(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        const body = await request.json();

        const {
            message,
            farmName,
            location,
            userId,
            userName,
            conversationHistory,
            currentData
        } = body;

        if (!message) {
            return NextResponse.json(
                { success: false, error: 'Message is required' },
                { status: 400 }
            );
        }

        console.log(`🤖 Farm Assistant processing: "${message.substring(0, 50)}..."`);

        const context: AssistantContext = {
            farmId,
            farmName: farmName || 'My Farm',
            location: location || 'New York, NY',
            userId: userId || 'anonymous',
            userName: userName || 'User',
            conversationHistory: conversationHistory || [],
            currentData
        };

        const response = await farmAssistant.processMessage(message, context);

        // Create conversation message record
        const userMessage: ConversationMessage = {
            id: `msg_${Date.now()}_user`,
            role: 'user',
            content: message,
            timestamp: new Date()
        };

        const assistantMessage: ConversationMessage = {
            id: `msg_${Date.now()}_assistant`,
            role: 'assistant',
            content: response.message,
            timestamp: new Date(),
            metadata: {
                intent: response.intent,
                confidence: response.confidence,
                actionsTaken: response.actions
            }
        };

        return NextResponse.json({
            success: true,
            response,
            messages: [userMessage, assistantMessage],
            timestamp: new Date().toISOString(),
            farmId
        });
    } catch (error: any) {
        console.error('❌ Farm Assistant error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Assistant failed to process message' },
            { status: 500 }
        );
    }
}

// GET /api/ai/assistant - Get assistant capabilities
export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        return NextResponse.json({
            success: true,
            assistant: {
                name: 'OFMS Farm Assistant',
                version: '1.0.0',
                capabilities: [
                    'Farm status queries',
                    'Weather information',
                    'Batch and crop management',
                    'Yield predictions',
                    'Quality assessments',
                    'Alert management',
                    'Resource optimization',
                    'Market forecasts',
                    'Task scheduling',
                    'Recommendations'
                ],
                sampleQueries: [
                    "How's my farm doing?",
                    "What's the weather forecast?",
                    "Show me active batches",
                    "Any alerts I should know about?",
                    "What should I focus on today?",
                    "Help me optimize resources"
                ]
            },
            farmId
        });
    } catch (error: any) {
        console.error('❌ Assistant info error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to get assistant info' },
            { status: 500 }
        );
    }
}
