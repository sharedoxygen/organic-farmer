import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

// 🔧 Fix Next.js static generation error
// This route uses request.headers so it must be dynamic
export const dynamic = 'force-dynamic';

// GET /api/inventory - List all inventory items for a farm
export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        console.log('🔒 SECURE: Fetching inventory for farm:', farmId);

        // 🔒 SECURITY FIX: Database-level filtering ONLY
        // Never fetch other farms' data into memory
        const inventory = await prisma.inventory_items.findMany({
            where: {
                farm_id: farmId  // Database enforces multi-tenant isolation
            },
            orderBy: { name: 'asc' }
        }) as any[];

        console.log(`✅ SECURE: Found ${inventory.length} inventory items for farm ${farmId}`);

        // Transform database data to frontend format
        const transformedInventory = inventory.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            quantity: item.currentStock,
            unit: item.unit,
            reorderPoint: item.minStockLevel,
            supplier: item.supplier,
            unitCost: item.costPerUnit,
            location: item.location,
            expirationDate: item.expirationDate,
            batchNumber: item.sku || '',
            notes: item.status || '',
            lastUpdated: item.updatedAt.toISOString()
        }));

        return NextResponse.json(transformedInventory, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString(),
                'X-Farm-ID': farmId  // Track which farm this data belongs to
            }
        });
    } catch (error) {
        console.error('❌ Error fetching inventory:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/inventory - Create a new inventory item
export async function POST(request: NextRequest) {
    try {
        const { farmId, user } = await ensureFarmAccess(request);

        const body = await request.json();

        console.log('🔒 SECURE: Creating inventory item for farm:', farmId);

        // Transform frontend data to database format
        const createData = {
            id: crypto.randomUUID(),
            farm_id: farmId,  // Enforce farm isolation at creation
            name: body.name,
            category: body.category,
            currentStock: parseFloat(body.quantity) || 0,
            unit: body.unit,
            minStockLevel: parseFloat(body.reorderPoint) || 10,
            maxStockLevel: parseFloat(body.reorderPoint) * 3 || 30,
            costPerUnit: parseFloat(body.unitCost) || 0,
            supplier: body.supplier,
            location: body.location || '',
            expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
            sku: body.batchNumber || null,
            status: body.notes || 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: user.id,
            updatedBy: user.id,
            seedVarietyId: null
        };

        const inventoryItem = await prisma.inventory_items.create({
            data: createData
        });

        console.log('✅ SECURE: Created inventory item:', inventoryItem.id, 'for farm:', farmId);

        return NextResponse.json(inventoryItem, {
            status: 201,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString(),
                'X-Farm-ID': farmId
            }
        });
    } catch (error) {
        console.error('❌ Error creating inventory item:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 