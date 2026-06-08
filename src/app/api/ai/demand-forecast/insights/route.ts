import { NextRequest, NextResponse } from 'next/server'
import { ollamaService } from '@/lib/ai/ollamaService'
import { demandForecastingAI } from '@/lib/ai/demandForecastingAI'
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards'

export const dynamic = 'force-dynamic'

/** GET /api/ai/demand-forecast/insights?crop=Kale */
export async function GET(request: NextRequest) {
  try {
    const { farmId } = await ensureFarmAccess(request)
    const crop = new URL(request.url).searchParams.get('crop')

    if (!crop) {
      return NextResponse.json({ error: 'Crop parameter is required' }, { status: 400 })
    }

    const traditionalInsights = await demandForecastingAI.getMarketInsights(
      crop,
      farmId
    )

    let aiInsights: string[] = traditionalInsights.aiInsights
    try {
      const healthy = await ollamaService.checkHealth()
      if (healthy) {
        aiInsights = await ollamaService.generateMarketAnalysis(crop, {
          farmId,
          orderGrounded: true,
        })
      }
    } catch {
      // keep traditional insights
    }

    return NextResponse.json(
      {
        success: true,
        insights: {
          ...traditionalInsights,
          aiInsights,
          aiModel: 'Order-grounded analytics + DeepSeek-R1',
        },
        timestamp: new Date().toISOString(),
        farmId,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Farm-ID': farmId,
        },
      }
    )
  } catch (error) {
    return errorResponse(error, 'Failed to generate insights')
  }
}
