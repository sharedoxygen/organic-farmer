import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess, HttpError } from '@/lib/middleware/requestGuards';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';


// GET /api/equipment/[id] - Get individual equipment
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        const equipment = await prisma.equipment.findUnique({
            where: { id: params.id },
            include: {
                users_equipment_createdByTousers: {
                    select: { firstName: true, lastName: true }
                }
            }
        }) as any;

        if (!equipment) {
            return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
        }

        if (equipment.farm_id !== farmId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json(equipment, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString()
            }
        });
    } catch (error) {
        if (error instanceof HttpError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Error fetching equipment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/equipment/[id] - Update equipment
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { farmId, user } = await ensureFarmAccess(request);

        const body = await request.json();

        // Check if equipment exists and belongs to farm
        const existingEquipment = await prisma.equipment.findUnique({
            where: { id: params.id }
        }) as any;

        if (!existingEquipment) {
            return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
        }

        if (existingEquipment.farm_id !== farmId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Check if serial number already exists (for other equipment)
        if (body.serialNumber && body.serialNumber !== existingEquipment.serialNumber) {
            const existingSerial = await prisma.equipment.findUnique({
                where: { serialNumber: body.serialNumber }
            });

            if (existingSerial) {
                return NextResponse.json({ error: 'Serial number already exists' }, { status: 409 });
            }
        }

        // Transform frontend data to database format
        const updateData: any = {};

        if (body.name) updateData.name = body.name;
        if (body.type) updateData.type = body.type;
        if (body.model) updateData.model = body.model;
        if (body.manufacturer) updateData.manufacturer = body.manufacturer;
        if (body.serialNumber) updateData.serialNumber = body.serialNumber;
        if (body.location) updateData.location = body.location;
        if (body.installDate) updateData.installDate = new Date(body.installDate);
        if (body.warrantyExpiration !== undefined) {
            updateData.warrantyExpiration = body.warrantyExpiration ? new Date(body.warrantyExpiration) : null;
        }
        if (body.status) updateData.status = body.status;
        if (body.maintenanceFrequency) updateData.maintenanceFrequency = body.maintenanceFrequency;
        if (body.lastMaintenance !== undefined) {
            updateData.lastMaintenance = body.lastMaintenance ? new Date(body.lastMaintenance) : null;
        }
        if (body.nextMaintenance) updateData.nextMaintenance = new Date(body.nextMaintenance);
        if (body.specifications !== undefined) updateData.specifications = body.specifications || '';
        if (body.powerConsumption !== undefined) {
            updateData.powerConsumption = body.powerConsumption ? parseFloat(body.powerConsumption) : null;
        }
        if (body.maintenanceCost !== undefined) {
            updateData.maintenanceCost = body.maintenanceCost ? parseFloat(body.maintenanceCost) : null;
        }
        if (body.replacementCost !== undefined) {
            updateData.replacementCost = body.replacementCost ? parseFloat(body.replacementCost) : null;
        }

        updateData.updatedAt = new Date();
        updateData.updatedBy = user.id;

        const updatedEquipment = await prisma.equipment.update({
            where: { id: params.id },
            data: updateData,
            include: {
                users_equipment_createdByTousers: {
                    select: { firstName: true, lastName: true }
                }
            }
        });

        return NextResponse.json(updatedEquipment, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString()
            }
        });
    } catch (error) {
        if (error instanceof HttpError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Error updating equipment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/equipment/[id] - Delete equipment
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        // Check if equipment exists and belongs to farm
        const existingEquipment = await prisma.equipment.findUnique({
            where: { id: params.id }
        }) as any;

        if (!existingEquipment) {
            return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
        }

        if (existingEquipment.farm_id !== farmId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Delete related tasks first (if any)
        await prisma.tasks.deleteMany({
            where: { relatedEquipmentId: params.id }
        });

        // Delete the equipment
        await prisma.equipment.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ message: 'Equipment deleted successfully' }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Timestamp': new Date().toISOString()
            }
        });
    } catch (error) {
        if (error instanceof HttpError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Error deleting equipment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 