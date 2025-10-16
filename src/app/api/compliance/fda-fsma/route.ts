import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import { AuditService } from '@/lib/services/auditService';

// GET: Fetch FDA FSMA compliance data for the current farm
export async function GET(req: NextRequest) {
  const { user, farmId } = await ensureFarmAccess(req);

  // Example: Fetch from fda_fsma_compliance table (adjust as needed)
  const compliance = await prisma.fda_fsma_compliance.findFirst({
    where: { farm_id: farmId },
  });
  if (!compliance) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await AuditService.logGenericOperation({
    action: 'FETCH_FDA_FSMA_COMPLIANCE',
    entityType: 'fda_fsma_compliance',
    entityId: compliance.id,
    farmId,
  }, user.id);

  return NextResponse.json(compliance);
}

// POST: Create or update FDA FSMA compliance data
export async function POST(req: NextRequest) {
  const { user, farmId } = await ensureFarmAccess(req);

  const body = await req.json();

  // Example: Upsert logic (adjust fields as needed)
  const compliance = await prisma.fda_fsma_compliance.upsert({
    where: { farm_id: farmId },
    update: { ...body, farm_id: farmId },
    create: { ...body, farm_id: farmId },
  });

  await AuditService.logGenericOperation({
    action: 'UPSERT_FDA_FSMA_COMPLIANCE',
    entityType: 'fda_fsma_compliance',
    entityId: compliance.id,
    newData: body,
    farmId,
  }, user.id);

  return NextResponse.json(compliance);
}
