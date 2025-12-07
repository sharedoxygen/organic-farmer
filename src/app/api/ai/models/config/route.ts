import { NextRequest, NextResponse } from 'next/server';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface AIConfig {
    reasoningModel: string;
    visionModel: string;
    textModel: string;
}

const DEFAULT_CONFIG: AIConfig = {
    reasoningModel: 'deepseek-r1:latest',
    visionModel: 'qwen3:latest',
    textModel: 'gemma3:27b'
};

export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        // Fetch farm settings from database
        const farm = await prisma.farms.findUnique({
            where: { id: farmId },
            select: { settings: true }
        });

        const settings = farm?.settings as Record<string, unknown> | null;
        const config = settings?.aiConfig as AIConfig | undefined;

        return NextResponse.json({ success: true, config: config || null });
    } catch (error) {
        console.error('❌ Failed to load AI config:', error);
        return NextResponse.json({ success: false, error: 'Failed to load config' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        const body = await request.json();

        console.log('💾 Saving AI config for farm:', farmId, body);

        const cfg: AIConfig = {
            reasoningModel: String(body.reasoningModel || DEFAULT_CONFIG.reasoningModel),
            visionModel: String(body.visionModel || DEFAULT_CONFIG.visionModel),
            textModel: String(body.textModel || DEFAULT_CONFIG.textModel)
        };

        // Fetch current settings to merge
        const farm = await prisma.farms.findUnique({
            where: { id: farmId },
            select: { settings: true }
        });

        const currentSettings = (farm?.settings as Record<string, unknown>) || {};

        // Update farm settings with AI config
        const updatedSettings = {
            ...currentSettings,
            aiConfig: cfg
        };

        await prisma.farms.update({
            where: { id: farmId },
            data: {
                settings: updatedSettings as object
            }
        });

        console.log('✅ AI config saved to database successfully');
        return NextResponse.json({ success: true, config: cfg });
    } catch (error: any) {
        console.error('❌ Failed to save AI config:', error);
        return NextResponse.json({
            success: false,
            error: error?.message || 'Failed to save config'
        }, { status: error?.status || 500 });
    }
}



