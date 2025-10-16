import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// GET /api/inventory/[id] - Get individual inventory item
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        const item = await prisma.inventory_items.findUnique({
            where: { id: params.id },
            include: {
                users_inventory_items_createdByTousers: {
                    select: { firstName: true, lastName: true }
                }
            }
        }) as any;

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (item.farm_id !== farmId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json(item, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching inventory item:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/inventory/[id] - Update inventory item
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { farmId, user } = await ensureFarmAccess(request);

        const body = await request.json();

        // Check if item exists and belongs to farm
        const existingItem = await prisma.inventory_items.findUnique({
            where: { id: params.id }
        }) as any;

        if (!existingItem) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (existingItem.farm_id !== farmId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Transform frontend data to database format
        const updateData: any = {};

        if (body.name) updateData.name = body.name;
        if (body.category) updateData.category = body.category;
        if (body.quantity !== undefined) updateData.currentStock = parseFloat(body.quantity);
        if (body.unit) updateData.unit = body.unit;
        if (body.reorderPoint !== undefined) updateData.minStockLevel = parseFloat(body.reorderPoint);
        if (body.supplier) updateData.supplier = body.supplier;
        if (body.unitCost !== undefined) updateData.costPerUnit = parseFloat(body.unitCost);
        if (body.location) updateData.location = body.location;
        if (body.expirationDate) updateData.expirationDate = new Date(body.expirationDate);
        if (body.batchNumber) updateData.sku = body.batchNumber; // Using SKU field for batch number
        if (body.notes !== undefined) updateData.status = body.notes; // Using status field for notes

        updateData.updatedAt = new Date();
        updateData.updatedBy = user.id;

        const updatedItem = await prisma.inventory_items.update({
            where: { id: params.id },
            data: updateData
        });

        return NextResponse.json(updatedItem, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error updating inventory item:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/inventory/[id] - Delete inventory item
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        // Check if item exists and belongs to farm
        const existingItem = await prisma.inventory_items.findUnique({
            where: { id: params.id }
        }) as any;

        if (!existingItem) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (existingItem.farm_id !== farmId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        await prisma.inventory_items.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ message: 'Item deleted successfully' }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 