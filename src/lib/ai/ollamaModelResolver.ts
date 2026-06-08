export type OllamaRole = 'reasoning' | 'vision' | 'text'

const ROLE_PATTERNS: Record<OllamaRole, RegExp[]> = {
  vision: [/qwen3-vl/i, /qwen3\.6/i, /llava/i, /vision/i, /qwen3/i],
  reasoning: [/deepseek-r1/i, /deepseek/i, /r1:70b/i, /r1/i],
  text: [
    /qwen3\.5/i,
    /qwen3:32b/i,
    /qwen3-coder/i,
    /gemma/i,
    /llama/i,
    /mistral/i,
    /nemotron/i,
  ],
}

/** Fetch installed Ollama model tags (empty if unreachable). */
export async function fetchOllamaModelTags(
  baseUrl: string
): Promise<string[]> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return []
    const data = (await response.json()) as { models?: { name: string }[] }
    return (data.models || []).map((m) => m.name)
  } catch {
    return []
  }
}

/** Resolve env preference to an installed tag, else best role match. */
export function resolveOllamaModel(
  available: string[],
  preferred: string | undefined,
  role: OllamaRole
): string | null {
  if (available.length === 0) return preferred || null

  if (preferred) {
    if (available.includes(preferred)) return preferred
    const base = preferred.split(':')[0]
    const partialMatches = available.filter(
      (m) =>
        m === preferred ||
        m.startsWith(`${base}:`) ||
        m.startsWith(`${base}.`) ||
        m.startsWith(`${base}-`)
    )
    if (partialMatches.length > 0) {
      for (const pattern of ROLE_PATTERNS[role]) {
        const match = partialMatches.find((m) => pattern.test(m))
        if (match) return match
      }
      return partialMatches[0]
    }
  }

  for (const pattern of ROLE_PATTERNS[role]) {
    const match = available.find((m) => pattern.test(m))
    if (match) return match
  }

  return available[0]
}

export interface ResolvedOllamaModels {
  reasoning: string
  vision: string
  text: string
  resolved: boolean
  available: string[]
}

/** Align configured models with tags actually installed on the Ollama host. */
export async function resolveOllamaModels(
  baseUrl: string,
  config: { reasoning: string; vision: string; text: string }
): Promise<ResolvedOllamaModels> {
  const available = await fetchOllamaModelTags(baseUrl)
  const reasoning =
    resolveOllamaModel(available, config.reasoning, 'reasoning') ||
    config.reasoning
  const vision =
    resolveOllamaModel(available, config.vision, 'vision') || config.vision
  const text =
    resolveOllamaModel(available, config.text, 'text') || config.text

  const resolved =
    available.length > 0 &&
    (reasoning !== config.reasoning ||
      vision !== config.vision ||
      text !== config.text)

  return { reasoning, vision, text, resolved, available }
}
