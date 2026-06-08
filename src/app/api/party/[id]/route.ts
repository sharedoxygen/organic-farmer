import { NextRequest, NextResponse } from 'next/server';
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards';
import PartyService from '@/lib/services/partyService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/party/[id] - Get single party with roles and contacts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureFarmAccess(request); // Ensure user is authenticated

    const partyId = params.id;
    console.log('📋 Fetching party:', partyId);

    const party = await PartyService.getParty(partyId);

    if (!party) {
      return NextResponse.json(
        {
          success: false,
          error: 'Party not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: party
    });

  } catch (error) {
        return errorResponse(error, 'Failed to fetch party');
    }
}

/**
 * PUT /api/party/[id] - Update party
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureFarmAccess(request);

    const partyId = params.id;
    const body = await request.json();

    console.log('📋 Updating party:', partyId);

    const party = await PartyService.updateParty(partyId, {
      displayName: body.displayName,
      legalName: body.legalName
    });

    console.log('✅ Updated party:', partyId);

    return NextResponse.json({
      success: true,
      data: party
    });

  } catch (error) {
        return errorResponse(error, 'Failed to update party');
    }
}

/**
 * DELETE /api/party/[id] - Delete party
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureFarmAccess(request);

    const partyId = params.id;
    console.log('📋 Deleting party:', partyId);

    await PartyService.deleteParty(partyId);

    console.log('✅ Deleted party:', partyId);

    return NextResponse.json({
      success: true
    });

  } catch (error) {
        return errorResponse(error, 'Failed to delete party');
    }
}

