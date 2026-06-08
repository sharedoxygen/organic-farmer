import { prisma } from '@/lib/db';

export interface CustodyEventRecord {
    id: string;
    entityType: string;
    entityId: string;
    stage: string;
    timestamp: Date;
    performedBy: string;
    location: string;
    notes: string | null;
    signature: string | null;
}

function formatPerformer(user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
} | null): string {
    if (!user) return 'Unknown';
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.email;
}

export function formatCustodyEvent(event: {
    id: string;
    entityType: string;
    entityId: string;
    stage: string;
    timestamp: Date;
    location: string | null;
    notes: string | null;
    signature: string | null;
    users: {
        firstName: string | null;
        lastName: string | null;
        email: string;
    } | null;
}): CustodyEventRecord {
    return {
        id: event.id,
        entityType: event.entityType,
        entityId: event.entityId,
        stage: event.stage,
        timestamp: event.timestamp,
        performedBy: formatPerformer(event.users),
        location: event.location || 'Farm',
        notes: event.notes,
        signature: event.signature,
    };
}

export async function listCustodyEvents(params: {
    farmId: string;
    entityType?: string;
    entityId?: string;
    page?: number;
    limit?: number;
    order?: 'asc' | 'desc';
}): Promise<{ data: CustodyEventRecord[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 100;
    const order = params.order ?? 'desc';

    const where: { farm_id: string; entityType?: string; entityId?: string } = {
        farm_id: params.farmId,
    };
    if (params.entityType) where.entityType = params.entityType;
    if (params.entityId) where.entityId = params.entityId;

    const [total, events] = await Promise.all([
        prisma.custody_events.count({ where }),
        prisma.custody_events.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { timestamp: order },
            include: {
                users: {
                    select: { firstName: true, lastName: true, email: true },
                },
            },
        }),
    ]);

    return {
        data: events.map(formatCustodyEvent),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
}

export async function createCustodyEvent(params: {
    farmId: string;
    userId: string;
    entityType: string;
    entityId: string;
    stage: string;
    location?: string | null;
    notes?: string | null;
    signature?: string | null;
    timestamp?: Date;
}): Promise<CustodyEventRecord> {
    const event = await prisma.custody_events.create({
        data: {
            farm_id: params.farmId,
            entityType: params.entityType,
            entityId: params.entityId,
            stage: params.stage,
            performedBy: params.userId,
            location: params.location ?? null,
            notes: params.notes ?? null,
            signature: params.signature ?? null,
            timestamp: params.timestamp ?? new Date(),
        },
        include: {
            users: {
                select: { firstName: true, lastName: true, email: true },
            },
        },
    });

    return formatCustodyEvent(event);
}
