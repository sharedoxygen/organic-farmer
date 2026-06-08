import { analyzePlantImage } from '@/lib/ai/plantVisionAnalysis'

jest.mock('@/lib/ai/ollamaService', () => ({
  ollamaService: {
    checkHealth: jest.fn().mockResolvedValue(false),
    analyzeImage: jest.fn(),
  },
}))

jest.mock('@/lib/ai/cropDiseaseDetection', () => ({
  cropDiseaseAI: {
    detectDisease: jest.fn().mockResolvedValue({
      diseaseType: 'Healthy',
      confidence: 0.9,
      severity: 'LOW',
      recommendations: ['Continue current care routine'],
      affectedArea: 0,
      organicTreatments: ['Maintain organic growing practices'],
      aiAnalysis: 'Deterministic fallback analysis for unit tests',
    }),
  },
}))

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

describe('analyzePlantImage', () => {
  const originalOpenAiKey = process.env.OPENAI_API_KEY

  beforeAll(() => {
    delete process.env.OPENAI_API_KEY
  })

  afterAll(() => {
    if (originalOpenAiKey) process.env.OPENAI_API_KEY = originalOpenAiKey
  })

  it('rejects missing data URL', async () => {
    await expect(
      analyzePlantImage({
        imageDataUrl: 'https://example.com/plant.jpg',
        cropType: 'Kale',
      })
    ).rejects.toThrow('valid plant photo')
  })

  it('returns structured result via fallback pipeline', async () => {
    const result = await analyzePlantImage({
      imageDataUrl: TINY_PNG,
      cropType: 'Basil',
      farmZone: 'Greenhouse A',
    })

    expect(result.summary.diagnosis).toBeTruthy()
    expect(result.summary.overallHealth).toBeGreaterThanOrEqual(0)
    expect(result.summary.overallHealth).toBeLessThanOrEqual(100)
    expect(result.healthIndicators.length).toBeGreaterThanOrEqual(3)
    expect(result.recommendations.length).toBeGreaterThanOrEqual(1)
    expect(result.careTimeline.length).toBeGreaterThanOrEqual(1)
    expect(result.aiModel).toBeTruthy()
  })
})
