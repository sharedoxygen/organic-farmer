import { NextRequest, NextResponse } from 'next/server';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
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
    console.error('Error fetching party:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch party'
      },
      { status: 500 }
    );
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
    console.error('Error updating party:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update party'
      },
      { status: 500 }
    );
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
    console.error('Error deleting party:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete party'
      },
      { status: 500 }
    );
  }
}

