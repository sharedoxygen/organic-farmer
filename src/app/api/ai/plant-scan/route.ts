import { NextRequest, NextResponse } from 'next/server'
import { analyzePlantImage } from '@/lib/ai/plantVisionAnalysis'
import { logPlantScanAudit, resolvePlantScanBatch } from '@/lib/ai/plantScanAudit'
import { ensureFarmAccess, errorResponse } from '@/lib/middleware/requestGuards'

export const dynamic = 'force-dynamic'

const MAX_IMAGE_BYTES = 8 * 1024 * 1024

function estimateBase64Bytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || ''
  return Math.ceil((base64.length * 3) / 4)
}

/** POST /api/ai/plant-scan — Analyze a plant photo from mobile or web */
export async function POST(request: NextRequest) {
  try {
    const { farmId, user } = await ensureFarmAccess(request)
    const body = await request.json()
    const { imageDataUrl, cropType, farmZone, notes, batchId } = body

    if (!imageDataUrl || !cropType) {
      return NextResponse.json(
        { error: 'Plant photo (imageDataUrl) and crop type are required' },
        { status: 400 }
      )
    }

    if (!String(imageDataUrl).startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'imageDataUrl must be a base64 data URL (data:image/...)' },
        { status: 400 }
      )
    }

    if (estimateBase64Bytes(String(imageDataUrl)) > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: 'Image too large. Maximum size is 8 MB.' },
        { status: 400 }
      )
    }

    const batch = batchId
      ? await resolvePlantScanBatch(farmId, String(batchId))
      : null

    if (batchId && !batch) {
      return NextResponse.json(
        { error: 'batchId does not belong to this farm' },
        { status: 400 }
      )
    }

    const result = await analyzePlantImage({
      imageDataUrl,
      cropType: batch?.cropType || String(cropType),
      farmZone: farmZone ? String(farmZone) : undefined,
      notes: notes ? String(notes) : undefined,
    })

    await logPlantScanAudit({
      farmId,
      userId: user.id,
      cropType: batch?.cropType || String(cropType),
      result,
      batch,
      farmZone: farmZone ? String(farmZone) : undefined,
      source: 'plant_scan_api',
    })

    return NextResponse.json(
      {
        success: true,
        result,
        batch: batch
          ? { id: batch.id, batchNumber: batch.batchNumber, cropType: batch.cropType }
          : null,
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
    console.error('Plant scan error:', error)
    return errorResponse(error, 'Plant vision analysis failed')
  }
}
