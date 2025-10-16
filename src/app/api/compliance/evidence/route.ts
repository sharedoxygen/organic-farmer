import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import { AuditService } from '@/lib/services/auditService';

// POST: Upload evidence file and link to compliance record
export async function POST(req: NextRequest) {
  const { user, farmId } = await ensureFarmAccess(req);

  // This is a placeholder for actual file upload logic
  // In production, handle multipart/form-data and store file (e.g., S3)
  // Here, we simulate linking an uploaded file to a compliance entity

  const { complianceId, fileUrl, fileType, description } = await req.json();
  if (!complianceId || !fileUrl) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

  const evidence = await prisma.compliance_evidence.create({
    data: {
      compliance_id: complianceId,
      file_url: fileUrl,
      file_type: fileType || 'document',
      description: description || '',
      uploaded_by: user.id,
    },
  });

  await AuditService.logGenericOperation({
    action: 'UPLOAD_COMPLIANCE_EVIDENCE',
    entityType: 'compliance_evidence',
    entityId: evidence.id,
    newData: { fileUrl, fileType, description },
    farmId,
  }, user.id);

  return NextResponse.json(evidence);
}
