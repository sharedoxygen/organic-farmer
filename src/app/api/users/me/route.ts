import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('ofms_session')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const secret =
      process.env.AUTH_SECRET ||
      process.env.JWT_SECRET ||
      (process.env.NODE_ENV !== 'production' ? 'ofms_dev_secret_please_change' : undefined)
    if (!secret) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })

    const payload = jwt.verify(token, secret) as any
    const user = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        roles: true,
        is_system_admin: true,
        system_role: true
      }
    })

    if (!user || !user.isActive) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const roles = (() => { try { return JSON.parse(user.roles || '[]') } catch { return user.roles ? [user.roles] : [] } })()
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        roles,
        is_system_admin: user.is_system_admin,
        system_role: user.system_role
      }
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}


