export type OperationCategory =
  | 'ai'
  | 'agent'
  | 'mcp'
  | 'mobile'
  | 'data'
  | 'verification'
  | 'docs'
  | 'observability'

export type ParamType = 'farm' | 'string' | 'boolean' | 'select' | 'number' | 'json'

export interface OperationParamOption {
  value: string
  label: string
}

export interface OperationParamDef {
  key: string
  label: string
  type: ParamType
  required?: boolean
  defaultValue?: string | boolean | number
  options?: OperationParamOption[]
  placeholder?: string
  description?: string
}

export interface OperationDefinition {
  id: string
  name: string
  description: string
  category: OperationCategory
  icon: string
  /** Display-only npm script label */
  cliEquivalent?: string
  requiresSystemAdmin: boolean
  destructive?: boolean
  params: OperationParamDef[]
  timeoutMs: number
}

export interface OperationRunRequest {
  operationId: string
  params?: Record<string, unknown>
  confirmDestructive?: boolean
}

export interface OperationCheck {
  name: string
  ok: boolean
  detail: string
}

export interface OperationRunResult {
  success: boolean
  operationId: string
  summary: string
  output?: string
  checks?: OperationCheck[]
  data?: unknown
  durationMs: number
  error?: string
}
