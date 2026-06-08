/**
 * AI Module Exports
 * Central export point for all AI services in OFMS
 */

// Core AI Services
export { ollamaService, OllamaService } from './ollamaService'
export { demandForecastingAI, DemandForecastingAI } from './demandForecastingAI'
export {
  cropDiseaseAI,
  CropDiseaseDetectionService,
} from './cropDiseaseDetection'

// Enhanced AI Services
export { weatherService, WeatherService } from './weatherService'
export type {
  WeatherData,
  WeatherForecast,
  WeatherAlert,
  GrowingConditions,
} from './weatherService'

export { alertEngine, AIAlertEngine } from './alertEngine'
export type {
  AIAlert,
  AlertType,
  AlertSeverity,
  AlertChannel,
  BatchHealthData as AlertBatchData,
  ResourceData,
  MarketData as AlertMarketData,
} from './alertEngine'

export { batchScoringAI, BatchScoringAI } from './batchScoringAI'
export type {
  BatchScore,
  BatchHealthMetrics,
  BatchPrediction,
  BatchComparison,
  BatchAnomaly,
  RiskFactor,
  CropBenchmarks,
} from './batchScoringAI'

export { yieldPredictionAI, YieldPredictionAI } from './yieldPredictionAI'
export type {
  YieldPrediction,
  YieldFactor,
  FarmYieldForecast,
  CropYieldForecast,
  WeeklyYieldForecast,
  ProductionPlan,
  ProductionPlanInput,
} from './yieldPredictionAI'

export { qualityGradingAI, QualityGradingAI } from './qualityGradingAI'
export type {
  QualityAssessment,
  QualityGrade,
  QualityScores,
  Defect,
  DefectType,
  HarvestReadiness,
  ShelfLifeEstimate,
  MarketChannel,
  QualityTrend,
} from './qualityGradingAI'

export {
  resourceOptimizationAI,
  ResourceOptimizationAI,
} from './resourceOptimizationAI'
export type {
  ResourceOptimizationPlan,
  WaterOptimization,
  LaborOptimization,
  InputOptimization,
  EquipmentOptimization,
  SavingsEstimate,
  PrioritizedRecommendation,
  FarmResourceData,
} from './resourceOptimizationAI'

export { farmAssistant, FarmAssistant } from './farmAssistant'

export {
  agentOrchestrator,
  runAgent,
  classifyGoal,
  generateAgentInsight,
  agentTools,
  getToolNames,
} from './agent'
export type { AgentRunResult, AgentGoal, ToolInvocation } from './agent'

export { loadFarmContext } from './farmContextService'
export type { FarmContext, BatchRecord } from './farmContextService'

export { logInference, getAiMetrics } from './inferenceLogger'

export { analyzePlantImage } from './plantVisionAnalysis'

export {
  loadConversationHistory,
  saveConversationTurn,
} from './conversationMemory'
export type {
  ConversationMessage,
  AssistantContext,
  AssistantResponse,
  AssistantIntent,
  DataCard,
} from './farmAssistant'
