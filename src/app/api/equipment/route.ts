import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

// 🔧 Fix Next.js static generation error
// This route uses request.headers so it must be dynamic  
export const dynamic = 'force-dynamic';


// GET /api/equipment - List all equipment for a farm
export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        console.log('🔒 SECURE: Fetching equipment for farm:', farmId);

        // 🔒 SECURITY FIX: Database-level filtering ONLY
        // Never fetch other farms' data into memory
        const equipment = await prisma.equipment.findMany({
            where: {
                farm_id: farmId  // Database enforces multi-tenant isolation
            },
            include: {
                users_equipment_createdByTousers: {
                    select: { firstName: true, lastName: true }
                }
            },
            orderBy: { name: 'asc' }
        }) as any[];

        console.log(`✅ SECURE: Found ${equipment.length} equipment items for farm ${farmId}`);

        return NextResponse.json(equipment, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString(),
                'X-Farm-ID': farmId  // Track which farm this data belongs to
            }
        });
    } catch (error) {
        console.error('❌ Error fetching equipment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/equipment - Create new equipment
export async function POST(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        console.log('🔒 SECURE: Creating equipment for farm:', farmId);

        const body = await request.json();

        // Check if serial number already exists
        if (body.serialNumber) {
            const existingEquipment = await prisma.equipment.findUnique({
                where: { serialNumber: body.serialNumber }
            });

            if (existingEquipment) {
                return NextResponse.json({ error: 'Serial number already exists' }, { status: 409 });
            }
        }

        // Transform frontend data to database format
        const createData = {
            id: crypto.randomUUID(),
            farm_id: farmId,  // Enforce farm isolation at creation
            name: body.name,
            type: body.type,
            model: body.model,
            manufacturer: body.manufacturer,
            serialNumber: body.serialNumber,
            location: body.location,
            installDate: body.installDate ? new Date(body.installDate) : new Date(),
            warrantyExpiration: body.warrantyExpiration ? new Date(body.warrantyExpiration) : null,
            status: body.status,
            maintenanceFrequency: body.maintenanceFrequency,
            lastMaintenance: body.lastMaintenance ? new Date(body.lastMaintenance) : null,
            nextMaintenance: body.nextMaintenance ? new Date(body.nextMaintenance) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            specifications: body.specifications || '',
            powerConsumption: body.powerConsumption ? parseFloat(body.powerConsumption) : null,
            maintenanceCost: body.maintenanceCost ? parseFloat(body.maintenanceCost) : null,
            replacementCost: body.replacementCost ? parseFloat(body.replacementCost) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'system',
            updatedBy: 'system'
        };

        const equipment = await prisma.equipment.create({
            data: createData,
            include: {
                users_equipment_createdByTousers: {
                    select: { firstName: true, lastName: true }
                }
            }
        });

        console.log('✅ SECURE: Created equipment:', equipment.id, 'for farm:', farmId);

        return NextResponse.json(equipment, {
            status: 201,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString(),
                'X-Farm-ID': farmId
            }
        });
    } catch (error) {
        console.error('❌ Error creating equipment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 