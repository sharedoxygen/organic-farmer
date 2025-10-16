import { NextRequest, NextResponse } from 'next/server';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import PartyService from '@/lib/services/partyService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/party - List parties with role filter
 * Query params:
 *   - role: CUSTOMER_B2B, CUSTOMER_B2C, SUPPLIER, EMPLOYEE, etc.
 *   - type: B2B, B2C (for customers)
 *   - page, limit: pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { farmId } = await ensureFarmAccess(request);
    const { searchParams } = new URL(request.url);
    
    const role = searchParams.get('role');
    const type = searchParams.get('type'); // B2B or B2C for customers
    
    console.log('📋 Fetching parties for farm:', farmId, 'Role:', role, 'Type:', type);

    let parties;

    if (role) {
      parties = await PartyService.getPartiesByRole(farmId, role as any);
    } else if (type) {
      // Get customers by type
      parties = await PartyService.getCustomers(farmId, type as 'B2B' | 'B2C');
    } else {
      // Get all customers by default (backward compatibility)
      parties = await PartyService.getCustomers(farmId);
    }

    console.log(`✅ Found ${parties.length} parties`);

    return NextResponse.json({
      success: true,
      data: parties
    });

  } catch (error) {
    console.error('Error fetching parties:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch parties',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/party - Create new party
 */
export async function POST(request: NextRequest) {
  try {
    const { farmId } = await ensureFarmAccess(request);
    const body = await request.json();

    console.log('📋 Creating party for farm:', farmId);

    // Validate required fields
    if (!body.displayName || !body.partyType || !body.roles || body.roles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: displayName, partyType, roles'
        },
        { status: 400 }
      );
    }

    // Ensure roles have farm_id set
    const roles = body.roles.map((role: any) => ({
      ...role,
      farm_id: role.farm_id || farmId
    }));

    const party = await PartyService.createParty({
      displayName: body.displayName,
      legalName: body.legalName,
      partyType: body.partyType,
      roles,
      contacts: body.contacts || []
    });

    console.log('✅ Created party:', party.id);

    return NextResponse.json({
      success: true,
      data: party
    });

  } catch (error) {
    console.error('Error creating party:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create party'
      },
      { status: 500 }
    );
  }
}

