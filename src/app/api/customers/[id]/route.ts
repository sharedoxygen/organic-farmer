import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import PartyService from '@/lib/services/partyService';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

interface CustomerUpdateRequest {
    name?: string;
    email?: string;
    phone?: string;
    businessName?: string;
    businessType?: string;
    contactPerson?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    paymentTerms?: string;
    creditLimit?: number;
    orderFrequency?: string;
    preferredVarieties?: string;
    status?: string;
    type?: string;
}

// GET /api/customers/[id] - Get single customer (PARTY MODEL)
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    try {
        const { farmId } = await ensureFarmAccess(request);

        console.log('🔍 Fetching customer:', params.id, 'for farm:', farmId);

        const party = await PartyService.getParty(params.id);

        if (!party) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Customer not found'
                },
                { status: 404 }
            );
        }

        // Verify party has customer role for this farm
        const hasCustomerRole = party.roles.some(r => 
            r.farm_id === farmId && (r.roleType === 'CUSTOMER_B2B' || r.roleType === 'CUSTOMER_B2C')
        );

        if (!hasCustomerRole) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Customer not found in this farm'
                },
                { status: 404 }
            );
        }

        // Get orders for this party
        const orders = await (prisma as any).orders.findMany({
            where: {
                customerPartyId: params.id,
                farm_id: farmId
            },
            select: {
                id: true,
                orderNumber: true,
                orderDate: true,
                total: true,
                status: true
            },
            orderBy: { orderDate: 'desc' }
        });

        // Calculate statistics
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
        const lastOrderDate = orders.length > 0 ? orders[0].orderDate : null;

        // Extract primary contacts
        const primaryEmail = party.contacts.find((c: any) => c.type === 'EMAIL' && c.isPrimary);
        const primaryPhone = party.contacts.find((c: any) => c.type === 'PHONE' && c.isPrimary);
        const primaryAddress = party.contacts.find((c: any) => c.type === 'ADDRESS' && c.isPrimary);

        const role = party.roles[0];
        const metadata = role.metadata || {};

        return NextResponse.json({
            success: true,
            data: {
                id: party.id,
                partyId: party.id,
                name: party.displayName,
                businessName: party.legalName || party.displayName,
                email: primaryEmail?.value || '',
                phone: primaryPhone?.value || '',
                address: primaryAddress?.value || '',
                type: role.roleType === 'CUSTOMER_B2B' ? 'B2B' : 'B2C',
                status: metadata.status || 'ACTIVE',
                taxId: metadata.taxId,
                paymentTerms: metadata.paymentTerms,
                creditLimit: metadata.creditLimit,
                orderFrequency: metadata.orderFrequency,
                preferredVarieties: metadata.preferredVarieties,
                businessType: metadata.businessType,
                totalOrders,
                totalSpent,
                lastOrderDate,
                createdAt: party.createdAt,
                updatedAt: party.updatedAt
            }
        });

    } catch (error) {
        console.error('Error fetching customer:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch customer'
            },
            { status: 500 }
        );
    }
}

// PUT /api/customers/[id] - Update customer (PARTY MODEL)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    try {
        const { farmId, user } = await ensureFarmAccess(request);

        const body = await request.json() as CustomerUpdateRequest;

        console.log('✏️ Updating customer party:', params.id);

        // Get existing party
        const party = await PartyService.getParty(params.id);

        if (!party) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Customer not found'
                },
                { status: 404 }
            );
        }

        // Verify access to this farm
        const hasAccess = party.roles.some(r => r.farm_id === farmId);
        if (!hasAccess) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Customer not found in this farm'
                },
                { status: 404 }
            );
        }

        // Check for duplicate email (if email is being changed)
        if (body.email) {
            const emailExists = await (prisma as any).parties.findFirst({
                where: {
                    id: { not: params.id },
                    roles: { some: { farm_id: farmId } },
                    contacts: { some: { type: 'EMAIL', value: body.email } }
                }
            });

            if (emailExists) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Email already exists for another customer'
                    },
                    { status: 409 }
                );
            }
        }

        // Update party
        if (body.name || body.businessName) {
            await PartyService.updateParty(params.id, {
                displayName: body.businessName || body.name,
                legalName: body.businessName || body.name
            });
        }

        // Update contacts if provided
        if (body.email) {
            const emailContact = party.contacts.find((c: any) => c.type === 'EMAIL' && c.isPrimary);
            if (emailContact) {
                await PartyService.updateContact(emailContact.id, { value: body.email });
            }
        }

        if (body.phone) {
            const phoneContact = party.contacts.find((c: any) => c.type === 'PHONE');
            if (phoneContact) {
                await PartyService.updateContact(phoneContact.id, { value: body.phone });
            } else {
                await PartyService.addContact(params.id, 'PHONE', body.phone, 'Business Phone', false);
            }
        }

        // Update role metadata
        const role = party.roles[0];
        if (role) {
            await (prisma as any).party_roles.update({
                where: { id: role.id },
                data: {
                    metadata: {
                        ...role.metadata,
                        taxId: body.taxId,
                        paymentTerms: body.paymentTerms,
                        creditLimit: body.creditLimit,
                        orderFrequency: body.orderFrequency,
                        preferredVarieties: body.preferredVarieties,
                        businessType: body.businessType,
                        contactPerson: body.contactPerson,
                        status: body.status
                    }
                }
            });
        }

        // Also update legacy customer table
        await (prisma as any).customers.updateMany({
            where: { partyId: params.id, farm_id: farmId },
            data: {
                ...(body.name && { name: body.name }),
                ...(body.email && { email: body.email }),
                ...(body.phone && { phone: body.phone }),
                updatedBy: user.id,
                updatedAt: new Date()
            }
        });

        console.log('✅ Updated customer party:', params.id);

        return NextResponse.json({
            success: true,
            data: { id: params.id, updated: true }
        });

    } catch (error) {
        console.error('Error updating customer:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to update customer'
            },
            { status: 500 }
        );
    }
}

// DELETE /api/customers/[id] - Delete customer (PARTY MODEL)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    try {
        const { farmId } = await ensureFarmAccess(request);

        console.log('🗑️ Deleting customer party:', params.id);

        // Check if party exists and has customer role for this farm
        const party = await PartyService.getParty(params.id);

        if (!party) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Customer not found'
                },
                { status: 404 }
            );
        }

        const hasCustomerRole = party.roles.some(r => 
            r.farm_id === farmId && (r.roleType === 'CUSTOMER_B2B' || r.roleType === 'CUSTOMER_B2C')
        );

        if (!hasCustomerRole) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Customer not found in this farm'
                },
                { status: 404 }
            );
        }

        // Check if customer has orders
        const orderCount = await (prisma as any).orders.count({
            where: { customerPartyId: params.id, farm_id: farmId }
        });

        if (orderCount > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Cannot delete customer with existing orders. Please archive instead.'
                },
                { status: 400 }
            );
        }

        // Delete party (cascade deletes roles and contacts)
        await PartyService.deleteParty(params.id);

        // Delete legacy customer record
        await (prisma as any).customers.deleteMany({
            where: { partyId: params.id, farm_id: farmId }
        });

        console.log('✅ Deleted customer party:', params.id);

        return NextResponse.json({
            success: true,
            message: 'Customer deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting customer:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to delete customer'
            },
            { status: 500 }
        );
    }
} 