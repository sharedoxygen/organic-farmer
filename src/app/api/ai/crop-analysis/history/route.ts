import { NextRequest, NextResponse } from 'next/server'
import { fetchCropAnalysisHistory } from '@/lib/ai/cropAnalysisHistory'
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards'

export const dynamic = 'force-dynamic'

/** GET /api/ai/crop-analysis/history?days=30&batchId=... */
export async function GET(request: NextRequest) {
  try {
    const { farmId } = await ensureFarmAccess(request)
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30', 10)
    const batchId = searchParams.get('batchId') || undefined

    const history = await fetchCropAnalysisHistory(farmId, { days, batchId })

    return NextResponse.json({
      success: true,
      history,
      count: history.length,
      batchId: batchId || null,
      farmId,
    })
  } catch (error) {
    return errorResponse(error, 'Failed to fetch analysis history')
  }
}
