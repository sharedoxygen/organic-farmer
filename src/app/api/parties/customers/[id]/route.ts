import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess, HttpError } from '@/lib/middleware/requestGuards';

export const dynamic = 'force-dynamic';

/**
 * GET /api/parties/customers/[id]
 * Get a specific customer by party ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { farmId } = await ensureFarmAccess(request);
    const { id } = params;

    const party = await prisma.parties.findUnique({
      where: { id },
      include: {
        roles: {
          where: {
            farm_id: farmId,
            roleType: { in: ['CUSTOMER_B2B', 'CUSTOMER_B2C'] }
          }
        },
        contacts: true
      }
    });

    if (!party || party.roles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get order statistics
    const orders = await prisma.orders.findMany({
      where: {
        farm_id: farmId,
        customerPartyId: id
      },
      select: {
        total: true,
        orderDate: true
      }
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const lastOrderDate = orders.length > 0
      ? orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())[0].orderDate.toISOString()
      : null;

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
        console.error('Failed to parse address for party', id, e);
        primaryAddress = null;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        party: {
          id: party.id,
          displayName: party.displayName,
          legalName: party.legalName,
          partyType: party.partyType,
          createdAt: party.createdAt.toISOString(),
          updatedAt: party.updatedAt.toISOString()
        },
        role: party.roles[0],
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
      }
    });
  } catch (error: any) {
    const status = error instanceof HttpError ? error.status : 500;
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch customer' },
      { status }
    );
  }
}

/**
 * PUT /api/parties/customers/[id]
 * Update a customer
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, farmId } = await ensureFarmAccess(request);
    const { id } = params;
    const body = await request.json();

    const {
      displayName,
      legalName,
      contacts,
      metadata
    } = body;

    // Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update party
      const party = await tx.parties.update({
        where: { id },
        data: {
          displayName,
          legalName: legalName || null,
          updatedAt: new Date()
        }
      });

      // Update role metadata
      const role = await tx.party_roles.findFirst({
        where: {
          partyId: id,
          farm_id: farmId,
          roleType: { in: ['CUSTOMER_B2B', 'CUSTOMER_B2C'] }
        }
      });

      if (role && metadata) {
        await tx.party_roles.update({
          where: { id: role.id },
          data: {
            metadata: metadata
          }
        });
      }

      // Update contacts - delete old ones and create new ones
      if (contacts) {
        await tx.party_contacts.deleteMany({
          where: { partyId: id }
        });

        await Promise.all(
          contacts.map((contact: any) =>
            tx.party_contacts.create({
              data: {
                partyId: id,
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
      }

      // Update customers table for backward compatibility
      const customer = await tx.customers.findUnique({
        where: { partyId: id }
      });

      if (customer) {
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

        await tx.customers.update({
          where: { id: customer.id },
          data: {
            name: displayName,
            businessName: party.partyType === 'ORGANIZATION' ? displayName : null,
            email: primaryEmail || customer.email,
            phone: primaryPhone || customer.phone,
            street: address.street || customer.street,
            city: address.city || customer.city,
            state: address.state || customer.state,
            zipCode: address.zipCode || customer.zipCode,
            country: address.country || customer.country,
            status: metadata?.status || customer.status,
            paymentTerms: metadata?.paymentTerms || customer.paymentTerms,
            creditLimit: metadata?.creditLimit ?? customer.creditLimit,
            orderFrequency: metadata?.orderFrequency || customer.orderFrequency,
            preferredVarieties: metadata?.preferredVarieties || customer.preferredVarieties,
            updatedBy: user.id,
            updatedAt: new Date()
          }
        });
      }

      return { party, role };
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    const status = error instanceof HttpError ? error.status : 500;
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update customer' },
      { status }
    );
  }
}

/**
 * DELETE /api/parties/customers/[id]
 * Delete a customer (soft delete by removing role)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { farmId } = await ensureFarmAccess(request);
    const { id } = params;

    // Check if customer has orders
    const orderCount = await prisma.orders.count({
      where: {
        farm_id: farmId,
        customerPartyId: id
      }
    });

    if (orderCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete customer with existing orders. Set status to INACTIVE instead.' },
        { status: 400 }
      );
    }

    // Delete customer role (soft delete - party remains)
    await prisma.party_roles.deleteMany({
      where: {
        partyId: id,
        farm_id: farmId,
        roleType: { in: ['CUSTOMER_B2B', 'CUSTOMER_B2C'] }
      }
    });

    // Also delete from customers table
    await prisma.customers.deleteMany({
      where: {
        partyId: id,
        farm_id: farmId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error: any) {
    const status = error instanceof HttpError ? error.status : 500;
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete customer' },
      { status }
    );
  }
}
