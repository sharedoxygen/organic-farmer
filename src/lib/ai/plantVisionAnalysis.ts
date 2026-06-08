/**
 * Rich plant vision analysis for mobile field scans.
 * Ollama vision → OpenAI GPT-4o → structured fallback.
 */
import OpenAI from 'openai'
import { ollamaService } from './ollamaService'
import { cropDiseaseAI } from './cropDiseaseDetection'
import type {
  FindingSeverity,
  IndicatorStatus,
  PlantScanRequest,
  PlantScanResult,
  PlantSeverity,
} from '@/types/plantScan'

const VISION_PROMPT = (cropType: string, farmZone: string, notes?: string) => `
You are an expert organic farm pathologist and agronomist analyzing a ${cropType} plant photo from ${farmZone}.
${notes ? `Grower notes: ${notes}` : ''}

Examine the image for disease, pests, nutrient issues, environmental stress, and harvest readiness.
Focus on USDA organic-compliant recommendations only.

Respond with JSON only (no markdown):
{
  "headline": "Short compelling title, e.g. Vigorous Kale — Minor Leaf Spot Detected",
  "diagnosis": "Primary diagnosis in plain language",
  "confidence": 0.92,
  "severity": "LOW|MEDIUM|HIGH",
  "overallHealth": 85,
  "statusLabel": "2-4 word status, e.g. Healthy & Vigorous",
  "healthIndicators": [
    { "label": "Leaf Vitality", "score": 88, "status": "excellent|good|watch|critical", "icon": "🍃" },
    { "label": "Color Uniformity", "score": 82, "status": "good", "icon": "🎨" },
    { "label": "Pest Pressure", "score": 95, "status": "excellent", "icon": "🐛" },
    { "label": "Moisture Balance", "score": 78, "status": "good", "icon": "💧" },
    { "label": "Growth Vigor", "score": 86, "status": "excellent", "icon": "📈" }
  ],
  "findings": [
    { "category": "Disease|Pest|Nutrient|Environment|Harvest", "title": "...", "detail": "...", "severity": "info|warning|critical" }
  ],
  "recommendations": [
    { "priority": 1, "action": "...", "rationale": "..." }
  ],
  "organicTreatments": ["..."],
  "affectedAreaPercent": 8.5,
  "narrative": "2-3 sentence beautifully written summary for the grower",
  "reasoning": "Brief diagnostic reasoning chain",
  "careTimeline": [
    { "day": 0, "task": "Immediate action" },
    { "day": 3, "task": "Follow-up check" },
    { "day": 7, "task": "Re-assess and document" }
  ]
}
`

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function toIndicatorStatus(score: number): IndicatorStatus {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'watch'
  return 'critical'
}

function parseSeverity(value: unknown): PlantSeverity {
  const s = String(value || 'MEDIUM').toUpperCase()
  if (s === 'LOW' || s === 'HIGH') return s
  return 'MEDIUM'
}

function parseFindingSeverity(value: unknown): FindingSeverity {
  const s = String(value || 'info').toLowerCase()
  if (s === 'warning' || s === 'critical') return s
  return 'info'
}

function extractJson(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0]) as Record<string, unknown>
  } catch {
    return null
  }
}

function normalizeResult(
  raw: Record<string, unknown>,
  aiModel: string,
  aiPowered: boolean
): PlantScanResult {
  const severity = parseSeverity(raw.severity)
  const confidence = Number(raw.confidence) || 0.8
  const overallHealth = clampScore(Number(raw.overallHealth) || 75)
  const indicators = Array.isArray(raw.healthIndicators)
    ? raw.healthIndicators.map((item: Record<string, unknown>) => {
        const score = clampScore(Number(item.score) || 70)
        return {
          label: String(item.label || 'Indicator'),
          score,
          status: (['excellent', 'good', 'watch', 'critical'].includes(
            String(item.status)
          )
            ? String(item.status)
            : toIndicatorStatus(score)) as IndicatorStatus,
          icon: String(item.icon || '🌿'),
        }
      })
    : defaultIndicators(overallHealth, severity)

  const findings = Array.isArray(raw.findings)
    ? raw.findings.map((f: Record<string, unknown>) => ({
        category: String(f.category || 'Assessment'),
        title: String(f.title || 'Observation'),
        detail: String(f.detail || ''),
        severity: parseFindingSeverity(f.severity),
      }))
    : []

  const recommendations = Array.isArray(raw.recommendations)
    ? raw.recommendations.map((r: Record<string, unknown>, i: number) => ({
        priority: Number(r.priority) || i + 1,
        action: String(r.action || r.title || 'Monitor plant'),
        rationale: String(r.rationale || r.detail || ''),
      }))
    : [{ priority: 1, action: 'Monitor and re-scan in 3 days', rationale: 'Track changes over time' }]

  const careTimeline = Array.isArray(raw.careTimeline)
    ? raw.careTimeline.map((step: Record<string, unknown>) => ({
        day: Number(step.day) || 0,
        task: String(step.task || ''),
      }))
    : defaultCareTimeline(severity)

  return {
    summary: {
      headline: String(raw.headline || raw.diagnosis || 'Plant Health Scan'),
      diagnosis: String(raw.diagnosis || 'Assessment complete'),
      confidence: Math.min(1, Math.max(0, confidence)),
      severity,
      overallHealth,
      statusLabel: String(raw.statusLabel || statusFromHealth(overallHealth)),
    },
    healthIndicators: indicators,
    findings,
    recommendations: recommendations.sort((a, b) => a.priority - b.priority),
    organicTreatments: Array.isArray(raw.organicTreatments)
      ? raw.organicTreatments.map(String)
      : ['Maintain organic growing practices'],
    affectedAreaPercent: clampScore(Number(raw.affectedAreaPercent) || 0),
    narrative: String(
      raw.narrative || raw.analysis || 'AI vision analysis completed for your plant sample.'
    ),
    reasoning: raw.reasoning ? String(raw.reasoning) : undefined,
    careTimeline,
    aiModel,
    aiPowered,
  }
}

function defaultIndicators(
  overallHealth: number,
  severity: PlantSeverity
): PlantScanResult['healthIndicators'] {
  const pest = severity === 'HIGH' ? 45 : severity === 'MEDIUM' ? 65 : 90
  return [
    { label: 'Leaf Vitality', score: overallHealth, status: toIndicatorStatus(overallHealth), icon: '🍃' },
    { label: 'Color Uniformity', score: clampScore(overallHealth - 5), status: toIndicatorStatus(overallHealth - 5), icon: '🎨' },
    { label: 'Pest Pressure', score: pest, status: toIndicatorStatus(pest), icon: '🐛' },
    { label: 'Moisture Balance', score: clampScore(overallHealth - 8), status: toIndicatorStatus(overallHealth - 8), icon: '💧' },
    { label: 'Growth Vigor', score: clampScore(overallHealth + 3), status: toIndicatorStatus(overallHealth + 3), icon: '📈' },
  ]
}

function defaultCareTimeline(severity: PlantSeverity): PlantScanResult['careTimeline'] {
  if (severity === 'HIGH') {
    return [
      { day: 0, task: 'Isolate affected plants and apply organic treatment' },
      { day: 1, task: 'Document spread and notify farm manager' },
      { day: 3, task: 'Re-scan with Plant Vision to confirm response' },
    ]
  }
  if (severity === 'MEDIUM') {
    return [
      { day: 0, task: 'Apply recommended organic intervention' },
      { day: 3, task: 'Inspect surrounding plants in same zone' },
      { day: 7, task: 'Follow-up scan and log in OFMS' },
    ]
  }
  return [
    { day: 0, task: 'Continue current care routine' },
    { day: 7, task: 'Routine health check scan' },
    { day: 14, task: 'Log growth milestone in production batch' },
  ]
}

function statusFromHealth(health: number): string {
  if (health >= 90) return 'Excellent Condition'
  if (health >= 75) return 'Healthy & Vigorous'
  if (health >= 55) return 'Needs Attention'
  return 'Intervention Required'
}

function fromBasicAnalysis(
  analysis: {
    diseaseType: string
    confidence: number
    severity: PlantSeverity
    recommendations: string[]
    affectedArea: number
    organicTreatments: string[]
    aiAnalysis: string
  },
  cropType: string,
  aiModel: string
): PlantScanResult {
  const isHealthy = analysis.diseaseType.toLowerCase().includes('healthy')
  const overallHealth = isHealthy
    ? clampScore(88 + analysis.confidence * 10)
    : clampScore(70 - analysis.affectedArea)

  return normalizeResult(
    {
      headline: isHealthy
        ? `${cropType} — Looking Strong`
        : `${cropType} — ${analysis.diseaseType} Detected`,
      diagnosis: analysis.diseaseType,
      confidence: analysis.confidence,
      severity: analysis.severity,
      overallHealth,
      statusLabel: statusFromHealth(overallHealth),
      healthIndicators: defaultIndicators(overallHealth, analysis.severity),
      findings: isHealthy
        ? [
            {
              category: 'Health',
              title: 'No significant issues detected',
              detail: analysis.aiAnalysis,
              severity: 'info',
            },
          ]
        : [
            {
              category: 'Diagnosis',
              title: analysis.diseaseType,
              detail: analysis.aiAnalysis,
              severity: analysis.severity === 'HIGH' ? 'critical' : 'warning',
            },
          ],
      recommendations: analysis.recommendations.map((action, i) => ({
        priority: i + 1,
        action,
        rationale: 'Based on visual analysis and organic best practices',
      })),
      organicTreatments: analysis.organicTreatments,
      affectedAreaPercent: analysis.affectedArea,
      narrative: analysis.aiAnalysis,
      careTimeline: defaultCareTimeline(analysis.severity),
    },
    aiModel,
    true
  )
}

async function analyzeWithOpenAI(
  imageDataUrl: string,
  cropType: string,
  farmZone: string,
  notes?: string
): Promise<PlantScanResult | null> {
  if (!process.env.OPENAI_API_KEY) return null

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: VISION_PROMPT(cropType, farmZone, notes) },
          {
            type: 'image_url',
            image_url: { url: imageDataUrl, detail: 'high' },
          },
        ],
      },
    ],
    max_tokens: 2000,
    temperature: 0.15,
  })

  const text = response.choices[0]?.message?.content || ''
  const parsed = extractJson(text)
  if (!parsed) return null
  return normalizeResult(parsed, 'OpenAI GPT-4o Vision', true)
}

export async function analyzePlantImage(
  request: PlantScanRequest
): Promise<PlantScanResult> {
  const { imageDataUrl, cropType, farmZone = 'Field', notes } = request

  if (!imageDataUrl?.startsWith('data:image/')) {
    throw new Error('A valid plant photo is required')
  }

  // 1. Ollama vision (local)
  try {
    const healthy = await ollamaService.checkHealth()
    if (healthy) {
      const raw = await ollamaService.analyzeImage(
        imageDataUrl,
        VISION_PROMPT(cropType, farmZone, notes)
      )
      const parsed = extractJson(raw)
      if (parsed) {
        return normalizeResult(
          parsed,
          `Ollama ${process.env.OLLAMA_VISION_MODEL || 'qwen3'}`,
          true
        )
      }
    }
  } catch (err) {
    console.warn('Ollama plant vision unavailable:', err)
  }

  // 2. OpenAI GPT-4o
  try {
    const openAiResult = await analyzeWithOpenAI(
      imageDataUrl,
      cropType,
      farmZone,
      notes
    )
    if (openAiResult) return openAiResult
  } catch (err) {
    console.warn('OpenAI plant vision unavailable:', err)
  }

  // 3. Existing disease detection pipeline
  const basic = await cropDiseaseAI.detectDisease({
    imageUrl: imageDataUrl,
    cropType,
    uploadDate: new Date(),
    farmZone,
  })

  return fromBasicAnalysis(
    basic,
    cropType,
    process.env.OPENAI_API_KEY ? 'OpenAI (fallback parser)' : 'OFMS Intelligent Modeling'
  )
}
