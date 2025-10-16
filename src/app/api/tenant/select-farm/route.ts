import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, HttpError } from '@/lib/middleware/requestGuards'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { farmId } = await request.json()
    if (!farmId) return NextResponse.json({ error: 'farmId required' }, { status: 400 })

    // Validate auth and access for target farm
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let allowed = false
    // System admin can switch to any farm
    if ((user as any).is_system_admin === true || String((user as any).system_role || '').toUpperCase() === 'SYSTEM_ADMIN') {
      allowed = true
    } else {
      // Verify membership in requested farm
      const membership = await prisma.farm_users.findUnique({
        where: { farm_id_user_id: { farm_id: farmId, user_id: user.id } },
        select: { is_active: true },
      })
      allowed = !!membership?.is_active
    }

    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Persist farm context via cookie for SSR where needed
    const res = NextResponse.json({ success: true })
    res.cookies.set('ofms_farm', farmId, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  } catch (err) {
    return NextResponse.json({ error: 'Failed to select farm' }, { status: 400 })
  }
}


