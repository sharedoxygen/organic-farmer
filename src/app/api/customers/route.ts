import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import PartyService from '@/lib/services/partyService';
import crypto from 'crypto';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// use shared prisma from lib/db

interface CustomerCreateRequest {
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
    // Legacy fields for backward compatibility
    company?: string;
    address?: string;
    customerType?: string;
    taxId?: string;
    preferences?: string;
    dietaryRestrictions?: string;
    marketingConsent?: boolean;
    communicationPrefs?: string;
}

// GET /api/customers - List all customers with filtering (PARTY MODEL)
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Enforce auth and multi-tenant scoping
        const { farmId } = await ensureFarmAccess(request);

        console.log('🏢 Fetching customers for farm:', farmId, '(using Party Model)');

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type') || '';
        const status = searchParams.get('status') || '';

        const skip = (page - 1) * limit;

        // Use Party Model: Get customers via party_roles
        const roleTypes = type === 'B2B' ? ['CUSTOMER_B2B'] : type === 'B2C' ? ['CUSTOMER_B2C'] : ['CUSTOMER_B2B', 'CUSTOMER_B2C'];

        const where: Record<string, unknown> = {
            roles: {
                some: {
                    farm_id: farmId,
                    roleType: { in: roleTypes }
                }
            }
        };

        // Add search filter
        if (search) {
            where.OR = [
                { displayName: { contains: search, mode: 'insensitive' } },
                { legalName: { contains: search, mode: 'insensitive' } },
                { contacts: { some: { value: { contains: search, mode: 'insensitive' } } } }
            ];
        }

        // Get total count
        const total = await prisma.parties.count({ where });

        // Get parties with roles and contacts
        const parties = await prisma.parties.findMany({
            where,
            skip,
            take: limit,
            include: {
                roles: {
                    where: { farm_id: farmId }
                },
                contacts: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Get orders for each party separately
        const partiesWithOrders = await Promise.all(
            parties.map(async (party) => {
                const orders = await prisma.orders.findMany({
                    where: {
                        customerPartyId: party.id,
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
                return { ...party, orders };
            })
        );

        // Transform party data to customer format (backward compatibility)
        const enrichedData = partiesWithOrders.map((party: Record<string, unknown>) => {
            const role = (party.roles as any[])?.[0] || {};
            const metadata = role.metadata || {};
            const primaryEmail = (party.contacts as any[])?.find((c: any) => c.type === 'EMAIL' && c.isPrimary);
            const primaryPhone = (party.contacts as any[])?.find((c: any) => c.type === 'PHONE' && c.isPrimary);
            const address = (party.contacts as any[])?.find((c: any) => c.type === 'ADDRESS' && c.isPrimary);
            
            const orders = (party.orders as any[]) || [];
            const customer: Record<string, unknown> = {
                id: party.id,
                partyId: party.id,
                name: party.displayName,
                businessName: party.legalName || party.displayName,
                email: primaryEmail?.value || '',
                phone: primaryPhone?.value || '',
                address: address?.value || '',
                type: role.roleType === 'CUSTOMER_B2B' ? 'B2B' : 'B2C',
                status: metadata.status || 'ACTIVE',
                taxId: metadata.taxId,
                paymentTerms: metadata.paymentTerms,
                creditLimit: metadata.creditLimit,
                orderFrequency: metadata.orderFrequency,
                preferredVarieties: metadata.preferredVarieties,
                businessType: metadata.businessType,
                orders: orders,
                createdAt: party.createdAt,
                updatedAt: party.updatedAt
            };
            
            return customer;
        });

        // Calculate statistics for each customer  
        const customersWithStats = enrichedData.map((customer: Record<string, unknown>) => {
            let preferredVarieties = [];
            try {
                if (customer.preferredVarieties && typeof customer.preferredVarieties === 'string') {
                    preferredVarieties = JSON.parse(customer.preferredVarieties as string);
                }
            } catch (e) {
                // If JSON parsing fails, treat as comma-separated string
                preferredVarieties = customer.preferredVarieties ?
                    (customer.preferredVarieties as string).split(',').map(v => v.trim()) : [];
            }

            const orders = customer.orders as any[] || [];
            const totalOrders = orders.length;
            const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
            const lastOrderDate = orders.length > 0 ? orders[0].orderDate : null;
            const recentOrders = orders.slice(0, 3);

            return {
                ...customer,
                preferredVarieties,
                totalOrders,
                totalSpent,
                lastOrderDate,
                recentOrders,
                orders: undefined // Remove orders from response to keep it clean
            };
        });

        return NextResponse.json({
            success: true,
            data: customersWithStats,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching customers:', error);
        return NextResponse.json(
            {
                success: false,
                error: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                data: []
            },
            { status: 500 }
        );
    }
}

// POST /api/customers - Create new customer (PARTY MODEL)
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Enforce auth and multi-tenant scoping
        const { farmId, user } = await ensureFarmAccess(request);

        const body = await request.json() as CustomerCreateRequest;

        // Handle both new and legacy field names
        const displayName = body.businessName || body.name;
        const email = body.email;
        const customerType = body.type || body.customerType || body.businessType;

        // Validate required fields
        if (!displayName || !email || !customerType) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Business name, email, and customer type are required'
                },
                { status: 400 }
            );
        }

        // Check for duplicate email via party contacts
        const existingParty = await (prisma as any).parties.findFirst({
            where: {
                roles: {
                    some: {
                        farm_id: farmId,
                        roleType: { in: ['CUSTOMER_B2B', 'CUSTOMER_B2C'] }
                    }
                },
                contacts: {
                    some: {
                        type: 'EMAIL',
                        value: email
                    }
                }
            }
        });

        if (existingParty) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Customer with this email already exists in this farm'
                },
                { status: 409 }
            );
        }

        // Create party with role and contacts
        const partyType = customerType === 'B2B' || body.businessName ? 'ORGANIZATION' : 'PERSON';
        const roleType = customerType === 'B2B' ? 'CUSTOMER_B2B' : 'CUSTOMER_B2C';

        const contacts = [
            {
                type: 'EMAIL',
                label: 'Business Email',
                value: email,
                isPrimary: true
            }
        ];

        if (body.phone) {
            contacts.push({
                type: 'PHONE',
                label: 'Business Phone',
                value: body.phone,
                isPrimary: false
            });
        }

        if (body.street || body.city || body.state) {
            const addressValue = [
                body.street || body.address,
                body.city,
                body.state,
                body.zipCode,
                body.country || 'USA'
            ].filter(Boolean).join(', ');

            if (addressValue) {
                contacts.push({
                    type: 'ADDRESS',
                    label: 'Business Address',
                    value: addressValue,
                    isPrimary: true
                });
            }
        }

        const party = await PartyService.createParty({
            displayName,
            legalName: displayName,
            partyType,
            roles: [{
                roleType,
                farm_id: farmId,
                metadata: {
                    taxId: body.taxId,
                    paymentTerms: body.paymentTerms || 'NET_30',
                    creditLimit: body.creditLimit || 0,
                    orderFrequency: body.orderFrequency || 'WEEKLY',
                    preferredVarieties: body.preferredVarieties || '',
                    businessType: body.businessType,
                    packagingReqs: body.packagingReqs,
                    contactPerson: body.contactPerson,
                    status: body.status || 'ACTIVE'
                }
            }],
            contacts: contacts as any
        });

        // Also create legacy customer record for backward compatibility
        const legacyCustomer = await (prisma as any).customers.create({
            data: {
                id: crypto.randomUUID(),
                partyId: party.id,
                farm_id: farmId,
                name: displayName,
                type: customerType,
                email: email,
                phone: body.phone || '',
                street: body.street || body.address || '',
                city: body.city || '',
                state: body.state || '',
                zipCode: body.zipCode || '',
                country: body.country || 'USA',
                businessName: body.businessName || body.company || displayName,
                taxId: body.taxId || '',
                contactPerson: body.contactPerson || displayName,
                businessType: body.businessType || body.customerType || customerType,
                preferredVarieties: body.preferredVarieties || 'Mixed varieties',
                orderFrequency: body.orderFrequency || 'Weekly',
                packagingReqs: body.preferences || '',
                status: body.status || 'ACTIVE',
                creditLimit: body.creditLimit || 5000,
                paymentTerms: body.paymentTerms || 'Net 30',
                createdBy: user.id,
                updatedBy: user.id,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        console.log('✅ Created customer:', party.id, '(Party Model)');

        return NextResponse.json({
            success: true,
            data: {
                id: party.id,
                partyId: party.id,
                name: party.displayName,
                businessName: party.legalName,
                email,
                phone: body.phone,
                type: customerType,
                status: body.status || 'ACTIVE',
                createdAt: party.createdAt,
                updatedAt: party.updatedAt
            }
        });

    } catch (error) {
        console.error('Error creating customer:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create customer'
            },
            { status: 500 }
        );
    }
} 