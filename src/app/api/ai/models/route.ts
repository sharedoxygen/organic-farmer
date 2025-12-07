import { NextRequest, NextResponse } from 'next/server';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import { ollamaService } from '@/lib/ai/ollamaService';

export const dynamic = 'force-dynamic';

// GET /api/ai/models - list available Ollama models
export async function GET(request: NextRequest) {
    try {
        console.log('🔍 AI Models API called');
        const farmId = request.headers.get('X-Farm-ID');
        const auth = request.headers.get('Authorization');
        console.log('📋 Headers - Farm:', farmId, 'Auth:', auth ? 'present' : 'missing');

        await ensureFarmAccess(request); // auth only; list is not per-farm
        console.log('✅ Auth passed, fetching models from Ollama...');

        const models = await ollamaService.getAvailableModels();
        console.log('📦 Ollama returned', models.length, 'models');

        return NextResponse.json({ success: true, models });
    } catch (error: any) {
        console.error('❌ Failed to list models:', error?.message || error);
        const status = error?.status || 500;
        const message = error?.message || 'Failed to list models';
        return NextResponse.json({ success: false, error: message }, { status });
    }
}

// POST /api/ai/models - pull a model by name
export async function POST(request: NextRequest) {
    try {
        await ensureFarmAccess(request);
        const { name } = await request.json();
        if (!name) return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
        const ok = await ollamaService.pullModel(name);
        return NextResponse.json({ success: ok });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to pull model' }, { status: 500 });
    }
}



