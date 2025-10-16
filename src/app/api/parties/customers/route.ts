import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess, HttpError } from '@/lib/middleware/requestGuards';

export const dynamic = 'force-dynamic';

/**
 * GET /api/parties/customers
 * Fetch all customers (parties with customer roles) for the current farm
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API] GET /api/parties/customers - Starting');
    const { farmId } = await ensureFarmAccess(request);
    console.log('[API] Farm ID:', farmId);

    // Fetch parties with customer roles
    const parties = await prisma.parties.findMany({
      where: {
        roles: {
          some: {
            farm_id: farmId,
            roleType: { in: ['CUSTOMER_B2B', 'CUSTOMER_B2C'] }
          }
        }
      },
      include: {
        roles: {
          where: {
            farm_id: farmId,
            roleType: { in: ['CUSTOMER_B2B', 'CUSTOMER_B2C'] }
          }
        },
        contacts: true
      },
      orderBy: {
        displayName: 'asc'
      }
    });

    // Get order statistics for each customer
    const customersWithStats = await Promise.all(
      parties.map(async (party) => {
        // Get orders for this party
        const orders = await prisma.orders.findMany({
          where: {
            farm_id: farmId,
            customerPartyId: party.id
          },
          select: {
            total: true,
            orderDate: true
          }
        });

        // Calculate stats
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
        const lastOrderDate = orders.length > 0
          ? orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())[0].orderDate.toISOString()
          : null;

        // Get primary contacts
        const primaryEmail = party.contacts.find(c => c.type === 'EMAIL' && c.isPrimary)?.value;
        const primaryPhone = party.contacts.find(c => c.type === 'PHONE' && c.isPrimary)?.value || 
                            party.contacts.find(c => c.type === 'MOBILE' && c.isPrimary)?.value;
        const primaryAddressRaw = party.contacts.find(c => c.type === 'ADDRESS' && c.isPrimary)?.value;
        
        // Parse address safely
        let primaryAddress = null;
        if (primaryAddressRaw) {
          try {
            primaryAddress = typeof primaryAddressRaw === 'string' ? JSON.parse(primaryAddressRaw) : primaryAddressRaw;
          } catch (e) {
            console.error('Failed to parse address for party', party.id, e);
            primaryAddress = null;
          }
        }

        return {
          party: {
            id: party.id,
            displayName: party.displayName,
            legalName: party.legalName,
            partyType: party.partyType,
            createdAt: party.createdAt.toISOString(),
            updatedAt: party.updatedAt.toISOString()
          },
          role: party.roles[0], // Should only be one customer role per farm
          contacts: party.contacts.map(c => ({
            id: c.id,
            type: c.type,
            label: c.label,
            value: c.value,
            isPrimary: c.isPrimary
          })),
          primaryEmail,
          primaryPhone,
          primaryAddress,
          totalOrders,
          totalRevenue,
          lastOrderDate
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: customersWithStats
    });
  } catch (error: any) {
    console.error('[API] Error in GET /api/parties/customers:', error);
    const status = error instanceof HttpError ? error.status : 500;
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch customers' },
      { status }
    );
  }
}

/**
 * POST /api/parties/customers
 * Create a new customer (party with customer role)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, farmId } = await ensureFarmAccess(request);
    const body = await request.json();

    const {
      displayName,
      legalName,
      partyType,
      roleType,
      contacts,
      metadata
    } = body;

    // Validate required fields
    if (!displayName || !roleType || !partyType) {
      return NextResponse.json(
        { success: false, error: 'displayName, partyType, and roleType are required' },
        { status: 400 }
      );
    }

    if (!['CUSTOMER_B2B', 'CUSTOMER_B2C'].includes(roleType)) {
      return NextResponse.json(
        { success: false, error: 'roleType must be CUSTOMER_B2B or CUSTOMER_B2C' },
        { status: 400 }
      );
    }

    // Create party with role and contacts in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create party
      const party = await tx.parties.create({
        data: {
          displayName,
          legalName: legalName || null,
          partyType,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Create party role
      const role = await tx.party_roles.create({
        data: {
          partyId: party.id,
          roleType,
          farm_id: farmId,
          metadata: metadata || {},
          createdAt: new Date()
        }
      });

      // Create contacts
      const createdContacts = await Promise.all(
        (contacts || []).map((contact: any) =>
          tx.party_contacts.create({
            data: {
              partyId: party.id,
              type: contact.type,
              label: contact.label || null,
              value: contact.value,
              isPrimary: contact.isPrimary || false,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
        )
      );

      // Also create in customers table for backward compatibility
      const primaryEmail = contacts?.find((c: any) => c.type === 'EMAIL')?.value;
      const primaryPhone = contacts?.find((c: any) => c.type === 'PHONE' || c.type === 'MOBILE')?.value;
      const addressContact = contacts?.find((c: any) => c.type === 'ADDRESS');
      
      let address = { street: '', city: '', state: '', zipCode: '', country: 'USA' };
      if (addressContact) {
        try {
          address = JSON.parse(addressContact.value);
        } catch (e) {
          console.error('Failed to parse address:', e);
        }
      }

      if (primaryEmail) {
        await tx.customers.create({
          data: {
            id: party.id, // Use same ID for easy linking
            partyId: party.id,
            name: displayName,
            email: primaryEmail,
            phone: primaryPhone || '',
            businessName: partyType === 'ORGANIZATION' ? displayName : null,
            type: roleType === 'CUSTOMER_B2B' ? 'B2B' : 'B2C',
            street: address.street || '',
            city: address.city || '',
            state: address.state || '',
            zipCode: address.zipCode || '',
            country: address.country || 'USA',
            status: metadata?.status || 'ACTIVE',
            paymentTerms: metadata?.paymentTerms || 'NET_30',
            creditLimit: metadata?.creditLimit || 0,
            orderFrequency: metadata?.orderFrequency || 'WEEKLY',
            preferredVarieties: metadata?.preferredVarieties || '',
            createdBy: user.id,
            updatedBy: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            farm_id: farmId
          }
        });
      }

      return { party, role, contacts: createdContacts };
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    const status = error instanceof HttpError ? error.status : 500;
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create customer' },
      { status }
    );
  }
}
