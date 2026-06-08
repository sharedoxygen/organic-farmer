import type { AgentGoal } from './types'

export const GOAL_TOOL_PLANS: Record<AgentGoal, string[]> = {
  status: ['get_farm_overview', 'generate_alerts', 'get_weather'],
  batches: ['score_batches', 'get_farm_overview'],
  yield: ['predict_yield', 'score_batches'],
  alerts: ['generate_alerts'],
  resources: ['optimize_resources', 'get_farm_overview'],
  forecast: ['get_demand_forecast', 'predict_yield'],
  create_task: ['create_task', 'get_farm_overview'],
  analyze: ['score_batches', 'predict_yield', 'generate_alerts'],
  plant: ['analyze_plant', 'get_plant_scan_history', 'score_batches'],
  recommend: [
    'get_farm_overview',
    'score_batches',
    'generate_alerts',
    'optimize_resources',
  ],
  general: ['get_farm_overview', 'generate_alerts'],
}

export function classifyGoal(message: string): AgentGoal {
  const m = message.toLowerCase()
  if (/plant.*(scan|photo|image|vision)|photo.*plant|disease.*(photo|image)/.test(m))
    return 'plant'
  if (/create.*task|add.*task|remind|schedule.*task/.test(m)) return 'create_task'
  if (/batch|score|health/.test(m) && !/plant/.test(m)) return 'batches'
  if (/yield|harvest|predict/.test(m)) return 'yield'
  if (/alert|warning|urgent|critical/.test(m)) return 'alerts'
  if (/resource|water|labor|optim|saving|equipment/.test(m)) return 'resources'
  if (/forecast|demand|market/.test(m)) return 'forecast'
  if (/analy|assess|evaluat|review/.test(m)) return 'analyze'
  if (/recommend|suggest|should|focus|priorit|advice/.test(m)) return 'recommend'
  if (/status|overview|how.*farm|doing/.test(m)) return 'status'
  if (/weather|temperature|rain/.test(m)) return 'status'
  return 'general'
}
