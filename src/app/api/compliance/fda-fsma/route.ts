import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards';
import AuditService from '@/lib/services/auditService';

// GET: Fetch FSMA-related food safety checks for the current farm
export async function GET(req: NextRequest) {
  try {
    const { farmId, user } = await ensureFarmAccess(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const where: any = { farm_id: farmId, check_type: 'FSMA' };
    if (status) where.status = status;

    const records = await prisma.food_safety_checks.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    try {
      await AuditService.logGenericOperation(
        {
          action: 'FETCH_FSMA_CHECKS',
          entityType: 'food_safety_checks',
          newData: { count: records.length },
        },
        user.id,
        farmId
      );
    } catch { }

    return NextResponse.json({ success: true, data: records });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// POST: Create or update a FSMA food safety check
export async function POST(req: NextRequest) {
  try {
    const { farmId, user } = await ensureFarmAccess(req);
    const body = await req.json();

    const id = body?.id as string | undefined;
    const title = String(body?.title || '').trim();
    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const data: any = {
      check_type: 'FSMA',
      title,
      status: body?.status ?? 'compliant',
      frequency: body?.frequency ?? 'monthly',
      last_check_date: body?.last_check_date ? new Date(body.last_check_date) : null,
      next_due_date: body?.next_due_date ? new Date(body.next_due_date) : null,
      description: body?.description ?? null,
      notes: body?.notes ?? null,
      updated_at: new Date(),
      updated_by: user.id,
    };

    let record;
    if (id) {
      const existing = await prisma.food_safety_checks.findFirst({ where: { id, farm_id: farmId, check_type: 'FSMA' } });
      if (!existing) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

      record = await prisma.food_safety_checks.update({
        where: { id },
        data,
      });
    } else {
      record = await prisma.food_safety_checks.create({
        data: {
          id: crypto.randomUUID(),
          farm_id: farmId,
          created_at: new Date(),
          created_by: user.id,
          ...data,
        },
      });
    }

    try {
      await AuditService.logGenericOperation(
        {
          action: id ? 'UPSERT_FSMA_CHECK_UPDATE' : 'UPSERT_FSMA_CHECK_CREATE',
          entityType: 'food_safety_checks',
          entityId: record.id,
          newData: { id: record.id },
        },
        user.id,
        farmId
      );
    } catch { }

    return NextResponse.json({ success: true, data: record });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// DELETE: Delete a FSMA check by id
export async function DELETE(req: NextRequest) {
  try {
    const { farmId, user } = await ensureFarmAccess(req);
    const body = await req.json().catch(() => ({}));
    const id = body?.id || new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const existing = await prisma.food_safety_checks.findFirst({ where: { id, farm_id: farmId, check_type: 'FSMA' } });
    if (!existing) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    await prisma.food_safety_checks.delete({ where: { id } });

    try {
      await AuditService.logGenericOperation(
        {
          action: 'DELETE_FSMA_CHECK',
          entityType: 'food_safety_checks',
          entityId: id,
          previousData: { id },
        },
        user.id,
        farmId
      );
    } catch { }

    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
