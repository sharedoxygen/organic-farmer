import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get('ofms_session')?.value
    if (!cookie) return NextResponse.json({ valid: false }, { status: 401 })

    const secret =
      process.env.AUTH_SECRET ||
      process.env.JWT_SECRET ||
      (process.env.NODE_ENV !== 'production' ? 'ofms_dev_secret_please_change' : undefined)
    if (!secret) return NextResponse.json({ valid: false }, { status: 500 })

    const payload = jwt.verify(cookie, secret) as any
    if (!payload?.sub) return NextResponse.json({ valid: false }, { status: 401 })

    const user = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true }
    })
    if (!user || !user.isActive) return NextResponse.json({ valid: false }, { status: 401 })

    return NextResponse.json({ valid: true, userId: user.id })
  } catch (err) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }
}

// Ensure dynamic route (no static generation)
export const dynamic = 'force-dynamic'