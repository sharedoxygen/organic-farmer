import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// GET /api/orders/[id] - Get individual order
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        const order = await prisma.orders.findUnique({
            where: { id: params.id },
            include: {
                customers: true,
                order_items: {
                    include: {
                        seed_varieties: true
                    }
                },
                users_orders_createdByTousers: {
                    select: { firstName: true, lastName: true }
                }
            }
        }) as any;

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.farm_id !== farmId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json(order, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/orders/[id] - Update order
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { farmId, user } = await ensureFarmAccess(request);

        const body = await request.json();

        // Check if order exists and belongs to farm
        const existingOrder = await prisma.orders.findUnique({
            where: { id: params.id },
            include: {
                order_items: true
            }
        }) as any;

        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (existingOrder.farm_id !== farmId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Validate order items if provided
        if (body.items && Array.isArray(body.items)) {
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
        }

        // Use a transaction to update order and order items atomically
        const result = await prisma.$transaction(async (tx) => {
            // Transform frontend data to database format
            const updateData: any = {};

            if (body.orderNumber) updateData.orderNumber = body.orderNumber;
            if (body.customerId) updateData.customerId = body.customerId;
            if (body.orderDate) updateData.orderDate = new Date(body.orderDate);
            if (body.deliveryDate) updateData.requestedDeliveryDate = new Date(body.deliveryDate);
            if (body.status) updateData.status = body.status;
            if (body.priority) updateData.priority = body.priority;
            if (body.totalAmount !== undefined) {
                const total = parseFloat(body.totalAmount);
                updateData.total = total;
                updateData.subtotal = total;
            }
            if (body.deliveryMethod) updateData.deliveryMethod = body.deliveryMethod;
            if (body.shippingAddress !== undefined) updateData.shippingAddress = body.shippingAddress;
            if (body.notes !== undefined) updateData.notes = body.notes;

            updateData.updatedAt = new Date();
            updateData.updatedBy = user.id;

            // Update the order
            const updatedOrder = await tx.orders.update({
                where: { id: params.id },
                data: updateData
            });

            // Handle order items if provided
            if (body.items && Array.isArray(body.items)) {
                // Delete existing order items
                await tx.order_items.deleteMany({
                    where: { orderId: params.id }
                });

                // Get fallback seed variety if needed
                const fallbackSeedVariety = await tx.seed_varieties.findFirst({
                    where: { farm_id: farmId },
                    select: { id: true }
                });

                if (!fallbackSeedVariety) {
                    throw new Error('No seed varieties found for this farm. Please create at least one seed variety first.');
                }

                // Create new order items
                const orderItemsData = body.items.map((item: any) => ({
                    id: crypto.randomUUID(),
                    farm_id: farmId,
                    orderId: updatedOrder.id,
                    productName: item.productName,
                    quantity: parseFloat(item.quantity),
                    unitPrice: parseFloat(item.unitPrice),
                    totalPrice: parseFloat(item.totalPrice || (item.quantity * item.unitPrice)),
                    unit: item.unit,
                    seedVarietyId: item.seedVarietyId || fallbackSeedVariety.id,
                    qualityRequirements: item.qualityGrade ? `Grade ${item.qualityGrade}` : null
                }));

                await tx.order_items.createMany({
                    data: orderItemsData
                });
            }

            // Return the updated order with its items
            return await tx.orders.findUnique({
                where: { id: params.id },
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
            return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
        }

        console.log('✅ SECURE: Updated order:', result.id, 'for farm:', farmId);

        return NextResponse.json(result, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error updating order:', error);

        // Return more specific error messages
        if (error instanceof Error) {
            return NextResponse.json({
                error: error.message.includes('seed varieties') ? error.message : 'Failed to update order'
            }, { status: 500 });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/orders/[id] - Delete order
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        // Check if order exists and belongs to farm
        const existingOrder = await prisma.orders.findUnique({
            where: { id: params.id }
        }) as any;

        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (existingOrder.farm_id !== farmId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Delete order items first due to foreign key constraints
        await prisma.order_items.deleteMany({
            where: { orderId: params.id }
        });

        // Delete the order
        await prisma.orders.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ message: 'Order deleted successfully' }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error deleting order:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 