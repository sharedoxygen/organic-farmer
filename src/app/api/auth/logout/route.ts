import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest) {
  const res = NextResponse.json({ success: true })
  // Clear auth/session cookies
  res.cookies.set('ofms_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  // Optionally clear farm cookie to avoid stale context
  res.cookies.set('ofms_farm', '', {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}


