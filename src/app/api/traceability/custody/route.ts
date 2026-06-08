import { NextRequest, NextResponse } from 'next/server';
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards';
import { createCustodyEvent, listCustodyEvents } from '@/lib/services/custodyService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);
        const { searchParams } = new URL(request.url);

        const entityType = searchParams.get('entityType') || undefined;
        const entityId = searchParams.get('entityId') || undefined;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '100', 10);
        const order = (searchParams.get('order') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

        const result = await listCustodyEvents({
            farmId,
            entityType,
            entityId,
            page,
            limit,
            order,
        });

        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        return errorResponse(error, 'Failed to fetch custody events', 'Error fetching custody events:');
    }
}

export async function POST(request: NextRequest) {
    try {
        const { user, farmId } = await ensureFarmAccess(request);
        const body = await request.json();

        if (!body.entityType || !body.entityId || !body.stage) {
            return NextResponse.json(
                { success: false, error: 'entityType, entityId, and stage are required' },
                { status: 400 }
            );
        }

        const data = await createCustodyEvent({
            farmId,
            userId: user.id,
            entityType: body.entityType,
            entityId: body.entityId,
            stage: body.stage,
            location: body.location,
            notes: body.notes,
            signature: body.signature,
            timestamp: body.timestamp ? new Date(body.timestamp) : undefined,
        });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return errorResponse(error, 'Failed to create custody event', 'Error creating custody event:');
    }
}
