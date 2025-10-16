import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        console.log('🌾 Fetching crop plans for farm:', farmId);

        // Fetch crop plans with related data using Prisma query
        const cropPlans = await prisma.crop_plans.findMany({
            where: { farm_id: farmId },
            include: {
                zones: {
                    select: { name: true, type: true }
                },
                seed_varieties: {
                    select: { name: true, scientificName: true, daysToHarvest: true }
                }
            },
            orderBy: [{ planned_start_date: 'desc' }, { created_at: 'desc' }]
        });

        console.log(`✅ Found ${cropPlans.length} crop plans for farm ${farmId}`);

        // Transform the data for the frontend
        const transformedPlans = cropPlans.map(plan => ({
            id: plan.id,
            crop: {
                id: plan.seed_variety_id,
                name: plan.crop_name,
                scientificName: plan.seed_varieties?.scientificName,
                daysToHarvest: plan.seed_varieties?.daysToHarvest
            },
            cropName: plan.crop_name,
            planName: plan.plan_name,
            status: plan.status,
            priority: plan.priority,
            plantingDate: plan.planned_start_date,
            harvestDate: plan.planned_end_date,
            actualStartDate: plan.actual_start_date,
            actualEndDate: plan.actual_end_date,
            plannedQuantity: plan.planned_quantity,
            plannedUnit: plan.planned_unit,
            actualQuantity: plan.actual_quantity,
            actualUnit: plan.actual_unit,
            expectedYield: plan.expected_yield,
            actualYield: plan.actual_yield,
            yield: plan.expected_yield || 0,
            zone: {
                id: plan.zone_id,
                name: plan.zones?.name,
                type: plan.zones?.type
            },
            growingMethod: plan.growing_method,
            notes: plan.notes,
            createdAt: plan.created_at,
            updatedAt: plan.updated_at
        }));

        return NextResponse.json({
            success: true,
            data: transformedPlans,
            count: transformedPlans.length
        });

    } catch (error) {
        console.error('❌ Error fetching crop plans:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch crop plans' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { farmId, user } = await ensureFarmAccess(request);

        const body = await request.json();
        console.log('🌾 Creating new crop plan for farm:', farmId);

        // Validate required fields
        if (!body.cropName || !body.planName || !body.zoneId || !body.seedVarietyId) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: cropName, planName, zoneId, seedVarietyId' },
                { status: 400 }
            );
        }

        // Check if plan name already exists for this farm
        const existingPlan = await prisma.crop_plans.findFirst({
            where: {
                farm_id: farmId,
                plan_name: body.planName
            }
        });

        if (existingPlan) {
            return NextResponse.json(
                { success: false, error: 'Plan name already exists for this farm' },
                { status: 409 }
            );
        }

        const userId = user.id;

        const cropPlan = await prisma.crop_plans.create({
            data: {
                id: `plan-${Date.now()}`,
                farm_id: farmId,
                zone_id: body.zoneId,
                seed_variety_id: body.seedVarietyId,
                crop_name: body.cropName,
                plan_name: body.planName,
                plan_type: body.planType || 'production',
                status: body.status || 'planned',
                priority: body.priority || 'medium',
                planned_start_date: new Date(body.plannedStartDate),
                planned_end_date: new Date(body.plannedEndDate),
                planned_quantity: body.plannedQuantity,
                planned_unit: body.plannedUnit,
                expected_yield: body.expectedYield,
                growing_method: body.growingMethod || 'soil',
                notes: body.notes || '',
                created_by: userId,
                updated_by: userId,
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        console.log('✅ Crop plan created successfully');

        // Return transformed shape to match frontend expectations
        const transformed = {
            id: cropPlan.id,
            crop: {
                id: cropPlan.seed_variety_id,
                name: cropPlan.crop_name,
            },
            cropName: cropPlan.crop_name,
            planName: cropPlan.plan_name,
            status: cropPlan.status,
            priority: cropPlan.priority,
            plantingDate: cropPlan.planned_start_date,
            harvestDate: cropPlan.planned_end_date,
            actualStartDate: cropPlan.actual_start_date,
            actualEndDate: cropPlan.actual_end_date,
            plannedQuantity: cropPlan.planned_quantity,
            plannedUnit: cropPlan.planned_unit,
            actualQuantity: cropPlan.actual_quantity,
            actualUnit: cropPlan.actual_unit,
            expectedYield: cropPlan.expected_yield,
            zone: { id: cropPlan.zone_id, name: '', type: '' },
            growingMethod: cropPlan.growing_method,
            notes: cropPlan.notes,
            createdAt: cropPlan.created_at,
            updatedAt: cropPlan.updated_at,
        }

        return NextResponse.json({
            success: true,
            data: transformed
        });

    } catch (error) {
        console.error('❌ Error creating crop plan:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create crop plan' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { farmId, user } = await ensureFarmAccess(request);

        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Crop plan ID required' },
                { status: 400 }
            );
        }

        console.log('🌾 Updating crop plan:', id, 'for farm:', farmId);

        // Check if crop plan exists and belongs to this farm
        const existingPlan = await prisma.$queryRaw`
            SELECT id FROM crop_plans 
            WHERE id = ${id} AND farm_id = ${farmId}
        ` as any[];

        if (existingPlan.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Crop plan not found or access denied' },
                { status: 404 }
            );
        }

        // Check if plan name already exists for this farm (excluding current plan)
        if (body.planName) {
            const duplicatePlan = await prisma.$queryRaw`
                SELECT id FROM crop_plans 
                WHERE farm_id = ${farmId} AND plan_name = ${body.planName} AND id != ${id}
            ` as any[];

            if (duplicatePlan.length > 0) {
                return NextResponse.json(
                    { success: false, error: 'Plan name already exists for this farm' },
                    { status: 409 }
                );
            }
        }

        const userId = user.id;

        // Build update data object
        const updateData: any = {
            updated_by: userId,
            updated_at: new Date()
        };

        if (body.cropName !== undefined) updateData.crop_name = body.cropName;
        if (body.planName !== undefined) updateData.plan_name = body.planName;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.priority !== undefined) updateData.priority = body.priority;
        if (body.zoneId !== undefined) updateData.zone_id = body.zoneId;
        if (body.seedVarietyId !== undefined) updateData.seed_variety_id = body.seedVarietyId;
        if (body.plannedStartDate !== undefined) updateData.planned_start_date = new Date(body.plannedStartDate);
        if (body.plannedEndDate !== undefined) updateData.planned_end_date = new Date(body.plannedEndDate);
        if (body.actualStartDate !== undefined) updateData.actual_start_date = body.actualStartDate ? new Date(body.actualStartDate) : null;
        if (body.actualEndDate !== undefined) updateData.actual_end_date = body.actualEndDate ? new Date(body.actualEndDate) : null;
        if (body.plannedQuantity !== undefined) updateData.planned_quantity = body.plannedQuantity;
        if (body.plannedUnit !== undefined) updateData.planned_unit = body.plannedUnit;
        if (body.actualQuantity !== undefined) updateData.actual_quantity = body.actualQuantity;
        if (body.actualUnit !== undefined) updateData.actual_unit = body.actualUnit;
        if (body.expectedYield !== undefined) updateData.expected_yield = body.expectedYield;
        if (body.actualYield !== undefined) updateData.actual_yield = body.actualYield;
        if (body.growingMethod !== undefined) updateData.growing_method = body.growingMethod;
        if (body.notes !== undefined) updateData.notes = body.notes;

        // Build dynamic UPDATE query
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        Object.entries(updateData).forEach(([key, value]) => {
            if (key !== 'updated_by' && key !== 'updated_at') {
                setClause.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        });

        // Add updated_by and updated_at
        setClause.push(`updated_by = $${paramIndex}`);
        values.push(userId);
        paramIndex++;
        setClause.push(`updated_at = $${paramIndex}`);
        values.push(new Date());
        paramIndex++;

        // Add WHERE conditions
        values.push(id, farmId);

        const updateQuery = `
            UPDATE crop_plans 
            SET ${setClause.join(', ')}
            WHERE id = $${paramIndex} AND farm_id = $${paramIndex + 1}
            RETURNING *
        `;

        const updatedPlan = await prisma.$executeRawUnsafe(updateQuery, ...values);

        // Fetch the updated plan with all related data
        const fullPlan = await prisma.$queryRaw`
            SELECT 
                cp.*,
                z.name as zone_name,
                z.type as zone_type,
                sv.name as seed_variety_name,
                sv."scientificName" as seed_variety_scientific_name,
                sv."daysToHarvest" as days_to_harvest
            FROM crop_plans cp
            LEFT JOIN zones z ON cp.zone_id = z.id
            LEFT JOIN seed_varieties sv ON cp.seed_variety_id = sv.id
            WHERE cp.id = ${id} AND cp.farm_id = ${farmId}
        ` as any[];

        console.log('✅ Crop plan updated successfully');

        return NextResponse.json({
            success: true,
            data: fullPlan[0]
        });

    } catch (error) {
        console.error('❌ Error updating crop plan:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update crop plan' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { farmId } = await ensureFarmAccess(request);

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Crop plan ID required' },
                { status: 400 }
            );
        }

        console.log('🌾 Deleting crop plan:', id, 'for farm:', farmId);

        // Check if crop plan exists and belongs to this farm
        const existingPlan = await prisma.$queryRaw`
            SELECT id FROM crop_plans 
            WHERE id = ${id} AND farm_id = ${farmId}
        ` as any[];

        if (existingPlan.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Crop plan not found or access denied' },
                { status: 404 }
            );
        }

        // Delete the crop plan
        await prisma.$queryRaw`
            DELETE FROM crop_plans 
            WHERE id = ${id} AND farm_id = ${farmId}
        `;

        console.log('✅ Crop plan deleted successfully');

        return NextResponse.json({
            success: true,
            message: 'Crop plan deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting crop plan:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete crop plan' },
            { status: 500 }
        );
    }
} 