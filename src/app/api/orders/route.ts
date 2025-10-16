import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';
import DataIntegrityService from '@/lib/services/dataIntegrityService';

// 🔧 Fix Next.js static generation error  
// This route uses request.headers so it must be dynamic
export const dynamic = 'force-dynamic';

// GET /api/orders - List all orders for a farm
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { farmId, user } = await ensureFarmAccess(request);

        console.log('🔒 SECURE: Fetching orders for farm:', farmId);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const status = searchParams.get('status') || '';
        const customerId = searchParams.get('customerId') || '';

        const skip = (page - 1) * limit;

        // 🔒 SECURITY FIX: Database-level filtering ONLY
        // Build proper where clause to never fetch other farms' data
        const where: any = {
            farm_id: farmId  // Database enforces multi-tenant isolation
        };

        // Apply additional filters at database level
        if (status) {
            where.status = status;
        }

        if (customerId) {
            // Support both legacy customerId and new customerPartyId
            where.OR = [
                { customerId: customerId },
                { customerPartyId: customerId }
            ];
        }

        // Get total count for pagination (with farm filter)
        const total = await prisma.orders.count({ where });

        // Get orders with proper database-level filtering
        const orders = await prisma.orders.findMany({
            where,
            include: {
                customers: {
                    select: {
                        name: true,
                        email: true,
                        type: true,
                        businessName: true
                    }
                },
                users_orders_createdByTousers: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                order_items: {
                    select: {
                        id: true,
                        productName: true,
                        quantity: true,
                        unitPrice: true,
                        totalPrice: true,
                        unit: true,
                        seedVarietyId: true,
                        qualityRequirements: true,
                        seed_varieties: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { orderDate: 'desc' }
        }) as any[];

        console.log(`✅ SECURE: Found ${orders.length} orders for farm ${farmId}`);

        return NextResponse.json(orders, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString(),
                'X-Total-Count': total.toString(),
                'X-Page': page.toString(),
                'X-Pages': Math.ceil(total / limit).toString(),
                'X-Farm-ID': farmId  // Track which farm this data belongs to
            }
        });

    } catch (error) {
        console.error('❌ Error fetching orders:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { farmId } = await ensureFarmAccess(request);

        console.log('🔒 SECURE: Creating order for farm:', farmId);

        const body = await request.json();

        // Validate required fields
        if (!body.customerId) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }

        if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
            return NextResponse.json({ error: 'At least one order item is required' }, { status: 400 });
        }

        // Check if order number already exists (if provided)
        if (body.orderNumber) {
            const existingOrder = await prisma.orders.findUnique({
                where: { orderNumber: body.orderNumber }
            });

            if (existingOrder) {
                return NextResponse.json({ error: 'Order number already exists' }, { status: 409 });
            }
        }

        // Validate customer exists and belongs to farm
        const customer = await prisma.customers.findUnique({
            where: { id: body.customerId }
        }) as any;

        if (!customer) {
            return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
        }

        if (customer.farm_id !== farmId) {
            return NextResponse.json({ error: 'Customer does not belong to this farm' }, { status: 403 });
        }

        // Validate order items and seed varieties
        for (const item of body.items) {
            if (!item.productName || !item.quantity || !item.unitPrice || !item.unit) {
                return NextResponse.json({
                    error: 'Each order item must have productName, quantity, unitPrice, and unit'
                }, { status: 400 });
            }

            // Check if seedVarietyId exists and belongs to farm (if provided)
            if (item.seedVarietyId) {
                const seedVariety = await prisma.seed_varieties.findUnique({
                    where: { id: item.seedVarietyId }
                }) as any;

                if (!seedVariety) {
                    return NextResponse.json({
                        error: `Invalid seed variety ID: ${item.seedVarietyId}`
                    }, { status: 400 });
                }

                if (seedVariety.farm_id !== farmId) {
                    return NextResponse.json({
                        error: `Seed variety ${item.seedVarietyId} does not belong to this farm`
                    }, { status: 403 });
                }
            }
        }

        // Validate order payload
        const orderIntegrity = DataIntegrityService.validateOrderData({
            subtotal: body.totalAmount,
            shippingCost: body.shippingCost,
            taxAmount: body.taxAmount,
            requestedDeliveryDate: body.deliveryDate,
            actualDeliveryDate: body.actualDeliveryDate
        });
        if (!orderIntegrity.valid) {
            return NextResponse.json({ error: 'Validation failed', violations: orderIntegrity.violations }, { status: 422 });
        }

        for (const item of body.items) {
            const itemIntegrity = DataIntegrityService.validateOrderItemData({
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice ?? (item.quantity * item.unitPrice)
            });
            if (!itemIntegrity.valid) {
                return NextResponse.json({ error: 'Invalid order item', violations: itemIntegrity.violations }, { status: 422 });
            }
        }

        // Use a transaction to create order and order items atomically
        const result = await prisma.$transaction(async (tx) => {
            // Transform frontend data to database format
            const orderData: any = {
                id: crypto.randomUUID(),
                farm_id: farmId,  // Enforce farm isolation at creation
                orderNumber: body.orderNumber || `ORD-${Date.now()}`,
                customerId: body.customerId,
                orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
                requestedDeliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                actualDeliveryDate: undefined,
                status: body.status || 'PENDING',
                priority: body.priority || 'MEDIUM',
                total: parseFloat(body.totalAmount) || 0,
                subtotal: parseFloat(body.totalAmount) || 0,
                tax: 0,
                shippingCost: 0,
                paymentStatus: 'PENDING',
                deliveryMethod: body.deliveryMethod || 'PICKUP',
                notes: body.notes || '',
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: user.id,
                updatedBy: user.id
            };

            // Only add shippingAddress if it's provided
            if (body.shippingAddress) {
                orderData.shippingAddress = body.shippingAddress;
            }

            // Create the order
            const order = await tx.orders.create({
                data: orderData
            });

            // Create order items
            const orderItemsData = body.items.map((item: any) => ({
                id: crypto.randomUUID(),
                farm_id: farmId,
                orderId: order.id,
                productName: item.productName,
                quantity: parseFloat(item.quantity),
                unitPrice: parseFloat(item.unitPrice),
                totalPrice: parseFloat(item.totalPrice || (item.quantity * item.unitPrice)),
                unit: item.unit,
                seedVarietyId: item.seedVarietyId || '', // Handle case where seedVarietyId might be empty
                qualityRequirements: item.qualityGrade ? `Grade ${item.qualityGrade}` : null
            }));

            // For items without seedVarietyId, we need to find a default one or handle appropriately
            // Let's get the first available seed variety for this farm as a fallback
            const fallbackSeedVariety = await tx.seed_varieties.findFirst({
                where: { farm_id: farmId },
                select: { id: true }
            });

            if (!fallbackSeedVariety) {
                throw new Error('No seed varieties found for this farm. Please create at least one seed variety first.');
            }

            // Update items that don't have a seedVarietyId
            const finalOrderItemsData = orderItemsData.map((item: any) => ({
                ...item,
                seedVarietyId: item.seedVarietyId || fallbackSeedVariety.id
            }));

            await tx.order_items.createMany({
                data: finalOrderItemsData
            });

            // Return the created order with its items
            return await tx.orders.findUnique({
                where: { id: order.id },
                include: {
                    customers: {
                        select: {
                            name: true,
                            email: true,
                            type: true,
                            businessName: true
                        }
                    },
                    users_orders_createdByTousers: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    order_items: {
                        include: {
                            seed_varieties: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            });
        });

        if (!result) {
            throw new Error('Failed to create order');
        }

        console.log('✅ SECURE: Created order:', result.id, 'with', body.items.length, 'items for farm:', farmId);

        return NextResponse.json(result, {
            status: 201,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString(),
                'X-Farm-ID': farmId
            }
        });

    } catch (error) {
        console.error('❌ Error creating order:', error);

        // Return more specific error messages
        if (error instanceof Error) {
            return NextResponse.json({
                error: error.message.includes('seed varieties') ? error.message : 'Failed to create order'
            }, { status: 500 });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 