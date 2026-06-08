'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuth } from '@/components/AuthProvider'
import { useTenant } from '@/components/TenantProvider'
import { PlantScanReport } from '@/components/mobile/PlantScanReport'
import { capturePlantPhoto } from '@/lib/mobile/camera'
import { isNativePlatform } from '@/lib/mobile'
import type { PlantScanResult } from '@/types/plantScan'
import styles from './page.module.css'

const CROPS = [
  'Arugula',
  'Basil',
  'Kale',
  'Broccoli',
  'Cilantro',
  'Mustard',
  'Lettuce',
  'Spinach',
  'Tomato',
  'Pepper',
  'Cannabis',
  'Other',
]

type ScanPhase = 'capture' | 'analyzing' | 'results'

interface ActiveBatch {
  id: string
  batchNumber: string
  cropType: string
}

export default function PlantScanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { currentFarm } = useTenant()

  const [phase, setPhase] = useState<ScanPhase>('capture')
  const [photo, setPhoto] = useState<string | null>(null)
  const [cropType, setCropType] = useState('Kale')
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState<PlantScanResult | null>(null)
  const [activeBatches, setActiveBatches] = useState<ActiveBatch[]>([])
  const [batchId, setBatchId] = useState(searchParams.get('batchId') || '')
  const [linkedBatch, setLinkedBatch] = useState<ActiveBatch | null>(null)

  useEffect(() => {
    if (!currentFarm?.id) return

    const loadBatches = async () => {
      try {
        const response = await fetch('/api/batches?limit=100', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Farm-ID': currentFarm.id,
          },
        })
        if (!response.ok) return
        const data = await response.json()
        const rows = (data.data || [])
          .filter((b: { status?: string }) =>
            ['GROWING', 'READY_TO_HARVEST', 'GERMINATING', 'PLANTED'].includes(
              String(b.status || '').toUpperCase()
            )
          )
          .map((b: { id: string; batchNumber: string; seed_varieties?: { name?: string } }) => ({
            id: b.id,
            batchNumber: b.batchNumber,
            cropType: b.seed_varieties?.name || 'Crop',
          }))
        setActiveBatches(rows)

        const prefill = searchParams.get('batchId')
        if (prefill) {
          const match = rows.find((b: ActiveBatch) => b.id === prefill)
          if (match) {
            setBatchId(match.id)
            setCropType(match.cropType)
            setLinkedBatch(match)
          }
        }
      } catch {
        // Batches optional — scan works without linkage
      }
    }

    loadBatches()
  }, [currentFarm?.id, searchParams])

  const handleCapture = useCallback(async () => {
    try {
      const captured = await capturePlantPhoto()
      setPhoto(captured.dataUrl)
      setResult(null)
      setPhase('capture')
      toast.success('Photo captured')
    } catch (err) {
      if (err instanceof Error && err.message !== 'User cancelled photos app') {
        toast.error(err.message || 'Could not capture photo')
      }
    }
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!photo || !currentFarm) return

    setPhase('analyzing')
    try {
      const response = await fetch('/api/ai/plant-scan', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Farm-ID': currentFarm.id,
        },
        body: JSON.stringify({
          imageDataUrl: photo,
          cropType,
          farmZone: currentFarm.farm_name || 'Field',
          notes: notes.trim() || undefined,
          batchId: batchId || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Analysis failed')
      }

      setResult(data.result)
      if (data.batch) {
        setLinkedBatch(data.batch)
      }
      setPhase('results')
      toast.success(
        data.batch
          ? `Analysis linked to batch ${data.batch.batchNumber}`
          : 'Plant analysis complete'
      )
    } catch (err) {
      setPhase('capture')
      toast.error(err instanceof Error ? err.message : 'Analysis failed')
    }
  }, [photo, currentFarm, cropType, notes, batchId])

  const handleReset = () => {
    setPhoto(null)
    setResult(null)
    setNotes('')
    setPhase('capture')
  }

  if (authLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading…</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/auth/signin')
    return null
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            {isNativePlatform() ? '📱 Field Scan' : '🌐 Plant Vision'}
          </span>
          <h1>Plant Vision AI</h1>
          <p>Capture a plant photo for instant AI health analysis with visual insights</p>
        </div>
      </header>

      {phase === 'analyzing' && (
        <div className={styles.analyzing}>
          <div className={styles.scanPulse} aria-hidden />
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Analyzing" className={styles.analyzingPhoto} />
          )}
          <h2>Analyzing your plant…</h2>
          <p>OFMS AI is examining leaf health, pests, nutrients, and stress indicators</p>
          <div className={styles.analyzingSteps}>
            <span>🔬 Vision scan</span>
            <span>🧠 Pathology reasoning</span>
            <span>📊 Building report</span>
          </div>
        </div>
      )}

      {phase !== 'analyzing' && phase !== 'results' && (
        <section className={styles.capture}>
          <button
            type="button"
            className={styles.captureBtn}
            onClick={handleCapture}
            aria-label="Take plant photo"
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Captured plant" className={styles.preview} />
            ) : (
              <div className={styles.capturePlaceholder}>
                <span className={styles.cameraIcon}>📷</span>
                <strong>Tap to photograph plant</strong>
                <span>Camera or photo library</span>
              </div>
            )}
          </button>

          <div className={styles.form}>
            {activeBatches.length > 0 && (
              <label className={styles.field}>
                <span>Link to batch (traceability)</span>
                <select
                  value={batchId}
                  onChange={(e) => {
                    const id = e.target.value
                    setBatchId(id)
                    const match = activeBatches.find((b) => b.id === id)
                    if (match) {
                      setCropType(match.cropType)
                      setLinkedBatch(match)
                    } else {
                      setLinkedBatch(null)
                    }
                  }}
                >
                  <option value="">No batch — general scan</option>
                  {activeBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber} — {b.cropType}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className={styles.field}>
              <span>Crop type</span>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
              >
                {CROPS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Notes (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Yellowing on lower leaves, greenhouse zone B"
                rows={2}
              />
            </label>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryBtn}
                disabled={!photo}
                onClick={handleAnalyze}
              >
                Analyze with AI
              </button>
              {photo && (
                <button type="button" className={styles.secondaryBtn} onClick={handleReset}>
                  Retake
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {phase === 'results' && result && photo && (
        <section className={styles.results}>
          {linkedBatch && (
            <p className={styles.batchLink}>
              Linked to batch <strong>{linkedBatch.batchNumber}</strong>
              {' · '}
              <button
                type="button"
                className={styles.inlineLink}
                onClick={() => router.push(`/production/batches/${linkedBatch.id}`)}
              >
                View batch
              </button>
            </p>
          )}
          <PlantScanReport result={result} photoUrl={photo} cropType={cropType} />
          <div className={styles.resultsActions}>
            <button type="button" className={styles.primaryBtn} onClick={handleReset}>
              Scan another plant
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
