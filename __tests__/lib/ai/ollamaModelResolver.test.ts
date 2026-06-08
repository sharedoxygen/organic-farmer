import {
  resolveOllamaModel,
  type OllamaRole,
} from '@/lib/ai/ollamaModelResolver'

const INSTALLED = [
  'qwen3:32b',
  'deepseek-r1:70b',
  'qwen3-vl:235b',
  'nemotron-3-nano:30b',
]

describe('ollamaModelResolver', () => {
  it('uses exact env match when installed', () => {
    expect(resolveOllamaModel(INSTALLED, 'qwen3:32b', 'text')).toBe('qwen3:32b')
  })

  it('resolves partial tag when latest is not installed', () => {
    expect(resolveOllamaModel(INSTALLED, 'deepseek-r1:latest', 'reasoning')).toBe(
      'deepseek-r1:70b'
    )
  })

  it('prefers vision-capable qwen tag over text qwen for vision role', () => {
    expect(resolveOllamaModel(INSTALLED, 'qwen3:latest', 'vision')).toBe(
      'qwen3-vl:235b'
    )
  })

  it('picks role-appropriate model when env unset', () => {
    expect(resolveOllamaModel(INSTALLED, undefined, 'vision')).toBe('qwen3-vl:235b')
    expect(resolveOllamaModel(INSTALLED, undefined, 'text')).toBe('qwen3:32b')
  })

  it('returns null when no models and no preference', () => {
    expect(resolveOllamaModel([], undefined, 'text' as OllamaRole)).toBeNull()
  })
})
