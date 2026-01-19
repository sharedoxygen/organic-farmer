import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { farmId } = await ensureFarmAccess(req);
        const { id } = await params;

        const supplier = await prisma.suppliers.findFirst({
            where: { id, farm_id: farmId },
        });

        if (!supplier) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: supplier });
    } catch (error) {
        console.error('GET /api/suppliers/[id] error:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { farmId } = await ensureFarmAccess(req);
        const { id } = await params;
        const body = await req.json();

        const existing = await prisma.suppliers.findFirst({
            where: { id, farm_id: farmId },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
        }

        const supplier = await prisma.suppliers.update({
            where: { id },
            data: {
                name: body.name || existing.name,
                contact: body.contact ?? existing.contact,
                email: body.email ?? existing.email,
                phone: body.phone ?? existing.phone,
                address: body.address ?? existing.address,
            },
        });

        return NextResponse.json({ success: true, data: supplier });
    } catch (error) {
        console.error('PUT /api/suppliers/[id] error:', error);
        return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { farmId } = await ensureFarmAccess(req);
        const { id } = await params;

        const existing = await prisma.suppliers.findFirst({
            where: { id, farm_id: farmId },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
        }

        await prisma.suppliers.delete({ where: { id } });

        return NextResponse.json({ success: true, message: 'Supplier deleted' });
    } catch (error) {
        console.error('DELETE /api/suppliers/[id] error:', error);
        return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
    }
}
