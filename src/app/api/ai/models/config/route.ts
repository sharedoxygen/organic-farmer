import { NextRequest, NextResponse } from 'next/server';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

export const dynamic = 'force-dynamic';

// In-memory config map per process. Replace with DB table if needed.
const aiConfigByFarm: Map<string, { reasoningModel: string; visionModel: string; textModel: string }> = new Map();

export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        const config = aiConfigByFarm.get(farmId) || null;
        return NextResponse.json({ success: true, config });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to load config' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        const body = await request.json();
        
        console.log('💾 Saving AI config for farm:', farmId, body);
        
        const cfg = {
            reasoningModel: String(body.reasoningModel || 'deepseek-r1:latest'),
            visionModel: String(body.visionModel || 'qwen3:latest'),
            textModel: String(body.textModel || 'gemma3:27b')
        };
        aiConfigByFarm.set(farmId, cfg);
        
        console.log('✅ AI config saved successfully');
        return NextResponse.json({ success: true, config: cfg });
    } catch (error: any) {
        console.error('❌ Failed to save AI config:', error);
        return NextResponse.json({ 
            success: false, 
            error: error?.message || 'Failed to save config' 
        }, { status: error?.status || 500 });
    }
}



