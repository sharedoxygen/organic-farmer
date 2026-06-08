import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  ensureFarmAccess,
  errorResponse,
  getAuthUser,
  HttpError,
} from '@/lib/middleware/requestGuards'
import { executeOperation } from '@/lib/operations/handlers'
import { getOperation, listOperations } from '@/lib/operations/registry'
import { isSystemAdmin } from '@/lib/utils/systemAdmin'

export const dynamic = 'force-dynamic'

/** GET /api/operations — Catalog + farm list for parameter selects */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const globalAdmin = isSystemAdmin(user)
    const operations = listOperations().filter(
      (op) => globalAdmin || !op.requiresSystemAdmin
    )

    let farms: { id: string; name: string }[] = []
    if (globalAdmin) {
      const rows = await prisma.farms.findMany({
        select: { id: true, farm_name: true },
        orderBy: { farm_name: 'asc' },
        take: 200,
      })
      farms = rows.map((f) => ({ id: f.id, name: f.farm_name }))
    } else {
      const memberships = await prisma.farm_users.findMany({
        where: { user_id: user.id, is_active: true },
        include: { farms: { select: { id: true, farm_name: true } } },
      })
      farms = memberships
        .filter((m) => m.farms)
        .map((m) => ({ id: m.farms!.id, name: m.farms!.farm_name }))
    }

    const categories = Array.from(new Set(operations.map((o) => o.category)))

    return NextResponse.json({
      success: true,
      operations,
      farms,
      categories,
      isSystemAdmin: globalAdmin,
    })
  } catch (error) {
    return errorResponse(error, 'Failed to load operations catalog')
  }
}

/** POST /api/operations — Run a registered OFMS utility */
export async function POST(request: NextRequest) {
  try {
    const { farmId, user, isSystemAdmin: globalAdmin } =
      await ensureFarmAccess(request)
    const body = await request.json()
    const operationId = str(body.operationId)

    if (!operationId) {
      return NextResponse.json(
        { success: false, error: 'operationId is required' },
        { status: 400 }
      )
    }

    const op = getOperation(operationId)
    if (!op) {
      return NextResponse.json(
        { success: false, error: `Unknown operation: ${operationId}` },
        { status: 404 }
      )
    }

    if (op.requiresSystemAdmin && !globalAdmin) {
      throw new HttpError(403, 'System administrator access required')
    }

    if (!globalAdmin && !op.requiresSystemAdmin) {
      const targetFarm = str(body.params?.farmId, farmId)
      const membership = await prisma.farm_users.findUnique({
        where: {
          farm_id_user_id: { farm_id: targetFarm, user_id: user.id },
        },
      })
      if (!membership?.is_active) {
        throw new HttpError(403, 'No access to target farm')
      }
    }

    const params = (body.params || {}) as Record<string, unknown>
    if (body.confirmDestructive) {
      params.confirmDestructive = true
    }

    const result = await executeOperation(operationId, params, {
      userId: user.id,
      userEmail: user.email,
      farmId: str(params.farmId, farmId),
    })

    await prisma.audit_logs.create({
      data: {
        farm_id: str(params.farmId, farmId),
        userId: user.id,
        action: 'OPERATION_RUN',
        entity: 'OFMSOperation',
        entityId: operationId,
        details: {
          operationId,
          success: result.success,
          summary: result.summary,
          durationMs: result.durationMs,
        },
      },
    })

    return NextResponse.json({
      success: result.success,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return errorResponse(error, 'Operation execution failed')
  }
}

function str(v: unknown, fallback = ''): string {
  return v != null ? String(v) : fallback
}
