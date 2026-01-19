import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import AuditService from '@/lib/services/auditService';

export const dynamic = 'force-dynamic';

/**
 * Evidence is stored as JSON in the organic_compliance.details or food_safety_checks.notes field.
 * This route handles adding/listing evidence entries for a compliance record.
 */

// GET: List evidence for a compliance record
export async function GET(req: NextRequest) {
  try {
    const { farmId } = await ensureFarmAccess(req);
    const { searchParams } = new URL(req.url);
    const complianceId = searchParams.get('complianceId');
    const complianceType = searchParams.get('type') || 'organic'; // 'organic' or 'fsma'

    if (!complianceId) {
      return NextResponse.json({ error: 'complianceId is required' }, { status: 400 });
    }

    let record: any = null;
    if (complianceType === 'fsma') {
      record = await prisma.food_safety_checks.findFirst({
        where: { id: complianceId, farm_id: farmId },
      });
    } else {
      record = await prisma.organic_compliance.findFirst({
        where: { id: complianceId, farm_id: farmId },
      });
    }

    if (!record) {
      return NextResponse.json({ error: 'Compliance record not found' }, { status: 404 });
    }

    // Parse evidence from details/notes JSON
    let evidence: any[] = [];
    try {
      const detailsField = complianceType === 'fsma' ? record.notes : record.details;
      if (detailsField) {
        const parsed = typeof detailsField === 'string' ? JSON.parse(detailsField) : detailsField;
        evidence = parsed?.evidence || [];
      }
    } catch {
      evidence = [];
    }

    return NextResponse.json({ success: true, data: evidence });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// POST: Add evidence to a compliance record
export async function POST(req: NextRequest) {
  try {
    const { farmId, user } = await ensureFarmAccess(req);
    const body = await req.json();

    const { complianceId, complianceType, fileUrl, fileType, description } = body;
    if (!complianceId || !fileUrl) {
      return NextResponse.json({ error: 'complianceId and fileUrl are required' }, { status: 400 });
    }

    const type = complianceType || 'organic';
    let record: any = null;

    if (type === 'fsma') {
      record = await prisma.food_safety_checks.findFirst({
        where: { id: complianceId, farm_id: farmId },
      });
    } else {
      record = await prisma.organic_compliance.findFirst({
        where: { id: complianceId, farm_id: farmId },
      });
    }

    if (!record) {
      return NextResponse.json({ error: 'Compliance record not found' }, { status: 404 });
    }

    // Parse existing evidence
    const detailsField = type === 'fsma' ? record.notes : record.details;
    let details: any = {};
    try {
      if (detailsField) {
        details = typeof detailsField === 'string' ? JSON.parse(detailsField) : detailsField;
      }
    } catch {
      details = {};
    }

    // Add new evidence entry
    const newEvidence = {
      id: crypto.randomUUID(),
      fileUrl,
      fileType: fileType || 'document',
      description: description || '',
      uploadedBy: user.id,
      uploadedAt: new Date().toISOString(),
    };

    details.evidence = [...(details.evidence || []), newEvidence];

    // Update the record
    if (type === 'fsma') {
      await prisma.food_safety_checks.update({
        where: { id: complianceId },
        data: { notes: JSON.stringify(details), updated_at: new Date(), updated_by: user.id },
      });
    } else {
      await prisma.organic_compliance.update({
        where: { id: complianceId },
        data: { details: JSON.stringify(details), updated_at: new Date(), updated_by: user.id },
      });
    }

    try {
      await AuditService.logGenericOperation(
        {
          action: 'UPLOAD_COMPLIANCE_EVIDENCE',
          entityType: type === 'fsma' ? 'food_safety_checks' : 'organic_compliance',
          entityId: complianceId,
          newData: { evidenceId: newEvidence.id, fileUrl },
        },
        user.id,
        farmId
      );
    } catch { }

    return NextResponse.json({ success: true, data: newEvidence });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// DELETE: Remove evidence from a compliance record
export async function DELETE(req: NextRequest) {
  try {
    const { farmId, user } = await ensureFarmAccess(req);
    const body = await req.json().catch(() => ({}));

    const { complianceId, complianceType, evidenceId } = body;
    if (!complianceId || !evidenceId) {
      return NextResponse.json({ error: 'complianceId and evidenceId are required' }, { status: 400 });
    }

    const type = complianceType || 'organic';
    let record: any = null;

    if (type === 'fsma') {
      record = await prisma.food_safety_checks.findFirst({
        where: { id: complianceId, farm_id: farmId },
      });
    } else {
      record = await prisma.organic_compliance.findFirst({
        where: { id: complianceId, farm_id: farmId },
      });
    }

    if (!record) {
      return NextResponse.json({ error: 'Compliance record not found' }, { status: 404 });
    }

    // Parse existing evidence
    const detailsField = type === 'fsma' ? record.notes : record.details;
    let details: any = {};
    try {
      if (detailsField) {
        details = typeof detailsField === 'string' ? JSON.parse(detailsField) : detailsField;
      }
    } catch {
      details = {};
    }

    // Remove evidence entry
    details.evidence = (details.evidence || []).filter((e: any) => e.id !== evidenceId);

    // Update the record
    if (type === 'fsma') {
      await prisma.food_safety_checks.update({
        where: { id: complianceId },
        data: { notes: JSON.stringify(details), updated_at: new Date(), updated_by: user.id },
      });
    } else {
      await prisma.organic_compliance.update({
        where: { id: complianceId },
        data: { details: JSON.stringify(details), updated_at: new Date(), updated_by: user.id },
      });
    }

    try {
      await AuditService.logGenericOperation(
        {
          action: 'DELETE_COMPLIANCE_EVIDENCE',
          entityType: type === 'fsma' ? 'food_safety_checks' : 'organic_compliance',
          entityId: complianceId,
          previousData: { evidenceId },
        },
        user.id,
        farmId
      );
    } catch { }

    return NextResponse.json({ success: true, message: 'Evidence deleted' });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
