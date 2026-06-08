/** Tools that mutate farm data — require explicit write confirmation. */
export const WRITE_TOOLS = new Set(['create_task'])

export function isWriteTool(name: string): boolean {
  return WRITE_TOOLS.has(name)
}
