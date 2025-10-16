import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { isSystemAdmin } from '@/lib/utils/systemAdmin'
import jwt from 'jsonwebtoken'

// Minimal user shape for guards
export interface AuthUser {
  id: string
  email: string
  isActive: boolean
  is_system_admin?: boolean
  system_role?: string | null
}

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/**
 * Extract bearer token user from Authorization header and load active user
 * Current placeholder implementation; replace with JWT/session validation later.
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Prefer JWT cookie-based auth
    const token = request.cookies.get('ofms_session')?.value
    const secret =
      process.env.AUTH_SECRET ||
      process.env.JWT_SECRET ||
      (process.env.NODE_ENV !== 'production' ? 'ofms_dev_secret_please_change' : undefined)

    if (token && secret) {
      const payload = jwt.verify(token, secret) as any
      const user = await prisma.users.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          isActive: true,
          is_system_admin: true,
          system_role: true,
        },
      })
      if (user && user.isActive) return user as AuthUser
    }

    // Backward-compatible header path (will be removed)
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const userId = authHeader.substring('Bearer '.length).trim()
      if (userId) {
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            isActive: true,
            is_system_admin: true,
            system_role: true,
          },
        })
        if (user && user.isActive) return user as AuthUser
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Extract farm id from header (preferred) or query param as fallback (dev only)
 */
export function getFarmId(request: NextRequest): string | null {
  const farmHeader = request.headers.get('X-Farm-ID')
  if (farmHeader && farmHeader.trim().length > 0) return farmHeader.trim()

  // Optional dev fallback via query param
  const farmParam = request.nextUrl.searchParams.get('farmId')
  if (farmParam && farmParam.trim().length > 0) return farmParam.trim()

  return null
}

export interface RequestContext {
  user: AuthUser
  farmId: string
  isSystemAdmin: boolean
}

/**
 * Build request context with auth user and farm id.
 * Throws HttpError when missing.
 */
export async function getRequestContext(request: NextRequest): Promise<RequestContext> {
  const farmId = getFarmId(request)
  if (!farmId) throw new HttpError(400, 'Farm ID is required')

  const user = await getAuthUser(request)
  if (!user) throw new HttpError(401, 'Authentication required')

  const admin = isSystemAdmin(user)
  return { user, farmId, isSystemAdmin: admin }
}

/**
 * Ensure the user has access to the requested farm.
 * System admins bypass farm restrictions per SYSTEM_ADMIN_IMPLEMENTATION.
 */
export async function ensureFarmAccess(request: NextRequest): Promise<RequestContext> {
  const ctx = await getRequestContext(request)
  if (ctx.isSystemAdmin) return ctx

  // Verify membership via farm_users composite key
  const membership = await prisma.farm_users.findUnique({
    where: {
      farm_id_user_id: {
        farm_id: ctx.farmId,
        user_id: ctx.user.id,
      },
    },
    select: { is_active: true },
  })

  if (!membership || !membership.is_active) {
    throw new HttpError(403, 'Access denied to this farm')
  }

  return ctx
}
