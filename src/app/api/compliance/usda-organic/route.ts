import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import AuditService from '@/lib/services/auditService';

// Force dynamic as we rely on headers
export const dynamic = 'force-dynamic';

// GET: Fetch USDA Organic compliance entries for the current farm
export async function GET(req: NextRequest) {
  try {
    const { farmId, user } = await ensureFarmAccess(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const area = searchParams.get('area') || undefined;

    const where: any = { farm_id: farmId };
    if (status) where.status = status;
    if (area) where.compliance_area = area;

    const records = await prisma.organic_compliance.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });

    // Best-effort audit (will be a no-op if farmId not passed through refactored service)
    try {
      await AuditService.logGenericOperation(
        {
          action: 'FETCH_USDA_ORGANIC_COMPLIANCE',
          entityType: 'organic_compliance',
          newData: { count: records.length }
        },
        user.id,
        farmId
      );
    } catch {}

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// POST: Create or update USDA Organic compliance data
export async function POST(req: NextRequest) {
  try {
    const { farmId, user } = await ensureFarmAccess(req);
    const body = await req.json();

    // If id provided and belongs to farm, update; else create new
    const id = body?.id as string | undefined;
    let record;
    if (id) {
      const existing = await prisma.organic_compliance.findFirst({ where: { id, farm_id: farmId } });
      if (!existing) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }
      record = await prisma.organic_compliance.update({
        where: { id },
        data: {
          compliance_area: body.compliance_area ?? existing.compliance_area,
          title: body.title ?? existing.title,
          status: body.status ?? existing.status,
          details: body.details ?? existing.details,
          cert_number: body.cert_number ?? existing.cert_number,
          expiry_date: body.expiry_date ? new Date(body.expiry_date) : existing.expiry_date,
          notes: body.notes ?? existing.notes,
          updated_at: new Date(),
          updated_by: user.id
        }
      });
    } else {
      record = await prisma.organic_compliance.create({
        data: {
          id: crypto.randomUUID(),
          farm_id: farmId,
          compliance_area: body.compliance_area ?? 'GENERAL',
          title: body.title ?? 'Compliance Record',
          status: body.status ?? 'compliant',
          details: body.details ?? null,
          cert_number: body.cert_number ?? null,
          expiry_date: body.expiry_date ? new Date(body.expiry_date) : null,
          notes: body.notes ?? null,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: user.id,
          updated_by: user.id
        }
      });
    }

    try {
      await AuditService.logGenericOperation(
        {
          action: id ? 'UPSERT_USDA_ORGANIC_COMPLIANCE_UPDATE' : 'UPSERT_USDA_ORGANIC_COMPLIANCE_CREATE',
          entityType: 'organic_compliance',
          entityId: record.id,
          newData: { id: record.id }
        },
        user.id,
        farmId
      );
    } catch {}

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
