import { NextRequest, NextResponse } from 'next/server';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import { ollamaService } from '@/lib/ai/ollamaService';

export const dynamic = 'force-dynamic';

// GET /api/ai/models - list available Ollama models
export async function GET(request: NextRequest) {
    try {
        await ensureFarmAccess(request); // auth only; list is not per-farm
        const models = await ollamaService.getAvailableModels();
        return NextResponse.json({ success: true, models });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to list models' }, { status: 500 });
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



