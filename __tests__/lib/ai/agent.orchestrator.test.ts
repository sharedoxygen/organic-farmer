import { classifyGoal } from '@/lib/ai/agent/orchestrator'

describe('Agent orchestrator', () => {
  describe('classifyGoal', () => {
    it('classifies status queries', () => {
      expect(classifyGoal("How's my farm doing?")).toBe('status')
      expect(classifyGoal('farm overview please')).toBe('status')
    })

    it('classifies batch queries', () => {
      expect(classifyGoal('Score active batches')).toBe('batches')
      expect(classifyGoal('batch health check')).toBe('batches')
    })

    it('classifies yield queries', () => {
      expect(classifyGoal('predict harvest yield')).toBe('yield')
    })

    it('classifies alert queries', () => {
      expect(classifyGoal('any critical alerts?')).toBe('alerts')
    })

    it('classifies resource queries', () => {
      expect(classifyGoal('optimize water and labor')).toBe('resources')
    })

    it('classifies task creation', () => {
      expect(classifyGoal('create task to inspect trays')).toBe('create_task')
    })

    it('classifies recommendations', () => {
      expect(classifyGoal('what should I focus on today?')).toBe('recommend')
    })

    it('classifies plant vision queries', () => {
      expect(classifyGoal('show plant scan history')).toBe('plant')
      expect(classifyGoal('analyze plant photo for disease')).toBe('plant')
    })

    it('defaults to general', () => {
      expect(classifyGoal('hello there')).toBe('general')
    })
  })
})
