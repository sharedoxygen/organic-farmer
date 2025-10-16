import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureFarmAccess, HttpError } from '@/lib/middleware/requestGuards'

export const dynamic = 'force-dynamic'

async function verifyEntityBelongsToFarm(farmId: string, entityType: string, entityId: string): Promise<boolean> {
  switch (entityType) {
    case 'batch': {
      const exists = await prisma.batches.findFirst({ where: { id: entityId, farm_id: farmId }, select: { id: true } })
      return !!exists
    }
    case 'order': {
      const exists = await prisma.orders.findFirst({ where: { id: entityId, farm_id: farmId }, select: { id: true } })
      return !!exists
    }
    case 'inventory': {
      const exists = await prisma.inventory_items.findFirst({ where: { id: entityId, farm_id: farmId }, select: { id: true } })
      return !!exists
    }
    default:
      return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const { farmId } = await ensureFarmAccess(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') || undefined
    const recallNumber = searchParams.get('number') || undefined

    const where: any = { farm_id: farmId }
    if (status) where.status = status
    if (recallNumber) where.recallNumber = recallNumber

    const [total, data] = await Promise.all([
      prisma.recall_cases.count({ where }),
      prisma.recall_cases.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { items: true },
        orderBy: { initiatedAt: 'desc' },
      }),
    ])

    return NextResponse.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error: any) {
    const status = error instanceof HttpError ? error.status : 500
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch recall cases' }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, farmId } = await ensureFarmAccess(request)
    const body = await request.json()

    if (!body.recallNumber) {
      return NextResponse.json({ success: false, error: 'recallNumber is required' }, { status: 400 })
    }

    // Validate items if provided
    const items = Array.isArray(body.items) ? body.items : []
    for (const item of items) {
      const { entityType, entityId } = item || {}
      if (!entityType || !entityId) {
        return NextResponse.json({ success: false, error: 'Each item must include entityType and entityId' }, { status: 400 })
      }
      const ok = await verifyEntityBelongsToFarm(farmId, String(entityType), String(entityId))
      if (!ok) {
        return NextResponse.json({ success: false, error: `Referenced ${entityType} not found in this farm` }, { status: 400 })
      }
    }

    const created = await prisma.recall_cases.create({
      data: {
        farm_id: farmId,
        recallNumber: body.recallNumber,
        status: body.status || 'OPEN',
        reason: body.reason || null,
        scope: body.scope || null,
        initiatedAt: body.initiatedAt ? new Date(body.initiatedAt) : new Date(),
        initiatedBy: user.id,
        notes: body.notes || null,
        items: items.length
          ? {
              create: items.map((i: any) => ({
                farm_id: farmId,
                entityType: i.entityType,
                entityId: i.entityId,
                quantity: i.quantity ?? null,
                unit: i.unit ?? null,
                status: i.status ?? null,
                notes: i.notes ?? null,
              })),
            }
          : undefined,
      },
      include: { items: true },
    })

    return NextResponse.json({ success: true, data: created })
  } catch (error: any) {
    const status = error instanceof HttpError ? error.status : 500
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create recall case' }, { status })
  }
}


