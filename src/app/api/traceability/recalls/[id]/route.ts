import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureFarmAccess, HttpError } from '@/lib/middleware/requestGuards'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { farmId } = await ensureFarmAccess(request)
    const data = await prisma.recall_cases.findFirst({ where: { id: params.id, farm_id: farmId }, include: { items: true } })
    if (!data) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    const status = error instanceof HttpError ? error.status : 500
    return NextResponse.json({ success: false, error: error?.message || 'Failed to get recall case' }, { status })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { farmId } = await ensureFarmAccess(request)
    const body = await request.json()

    const existing = await prisma.recall_cases.findFirst({ where: { id: params.id, farm_id: farmId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const updated = await prisma.recall_cases.update({
      where: { id: params.id },
      data: {
        status: body.status ?? existing.status,
        reason: body.reason ?? existing.reason,
        scope: body.scope ?? existing.scope,
        notes: body.notes ?? existing.notes,
      },
      include: { items: true },
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    const status = error instanceof HttpError ? error.status : 500
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update recall case' }, { status })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { farmId } = await ensureFarmAccess(request)
    const existing = await prisma.recall_cases.findFirst({ where: { id: params.id, farm_id: farmId }, select: { id: true } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await prisma.recall_cases.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    const status = error instanceof HttpError ? error.status : 500
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete recall case' }, { status })
  }
}


