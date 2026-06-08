export type PlantSeverity = 'LOW' | 'MEDIUM' | 'HIGH'
export type IndicatorStatus = 'excellent' | 'good' | 'watch' | 'critical'
export type FindingSeverity = 'info' | 'warning' | 'critical'

export interface PlantHealthIndicator {
  label: string
  score: number
  status: IndicatorStatus
  icon: string
}

export interface PlantFinding {
  category: string
  title: string
  detail: string
  severity: FindingSeverity
}

export interface PlantRecommendation {
  priority: number
  action: string
  rationale: string
}

export interface PlantCareStep {
  day: number
  task: string
}

export interface PlantScanResult {
  summary: {
    headline: string
    diagnosis: string
    confidence: number
    severity: PlantSeverity
    overallHealth: number
    statusLabel: string
  }
  healthIndicators: PlantHealthIndicator[]
  findings: PlantFinding[]
  recommendations: PlantRecommendation[]
  organicTreatments: string[]
  affectedAreaPercent: number
  narrative: string
  reasoning?: string
  careTimeline: PlantCareStep[]
  aiModel: string
  aiPowered: boolean
}

export interface PlantScanRequest {
  imageDataUrl: string
  cropType: string
  farmZone?: string
  notes?: string
}
