import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

export async function GET(req: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(req);

        const suppliers = await prisma.suppliers.findMany({
            where: { farm_id: farmId },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({ success: true, data: suppliers });
    } catch (error) {
        console.error('GET /api/suppliers error:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { farmId, user } = await ensureFarmAccess(req);
        const body = await req.json();

        if (!body.name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const supplier = await prisma.suppliers.create({
            data: {
                name: body.name,
                contact: body.contact || null,
                email: body.email || null,
                phone: body.phone || null,
                address: body.address || null,
                farm_id: farmId,
            },
        });

        return NextResponse.json({ success: true, data: supplier }, { status: 201 });
    } catch (error) {
        console.error('POST /api/suppliers error:', error);
        return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
    }
}
