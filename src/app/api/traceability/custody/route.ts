import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureFarmAccess, HttpError } from '@/lib/middleware/requestGuards'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { farmId } = await ensureFarmAccess(request)
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType') || undefined
    const entityId = searchParams.get('entityId') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = { farm_id: farmId }
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId

    const [total, data] = await Promise.all([
      prisma.custody_events.count({ where }),
      prisma.custody_events.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: 'asc' },
      }),
    ])

    return NextResponse.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error: any) {
    const status = error instanceof HttpError ? error.status : 500
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch custody events' }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, farmId } = await ensureFarmAccess(request)
    const body = await request.json()
    if (!body.entityType || !body.entityId || !body.stage) {
      return NextResponse.json({ success: false, error: 'entityType, entityId and stage are required' }, { status: 400 })
    }
    const created = await prisma.custody_events.create({
      data: {
        farm_id: farmId,
        entityType: body.entityType,
        entityId: body.entityId,
        stage: body.stage,
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
        performedBy: user.id,
        location: body.location ?? null,
        signature: body.signature ?? null,
        notes: body.notes ?? null,
      },
    })
    return NextResponse.json({ success: true, data: created })
  } catch (error: any) {
    const status = error instanceof HttpError ? error.status : 500
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create custody event' }, { status })
  }
}


