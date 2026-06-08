'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { useTenant } from '@/components/TenantProvider'
import { Button, Card } from '@/components/ui'
import { isSystemAdmin } from '@/lib/utils/systemAdmin'
import type {
  OperationDefinition,
  OperationParamDef,
  OperationRunResult,
} from '@/lib/operations/types'
import styles from './page.module.css'

interface FarmOption {
  id: string
  name: string
}

const CATEGORY_LABELS: Record<string, string> = {
  agent: '🤖 Agent',
  mcp: '🔌 MCP',
  ai: '🧠 AI',
  verification: '✅ Verification',
  mobile: '📱 Mobile',
  data: '🌱 Data',
  docs: '📚 Docs',
  observability: '📡 Observability',
}

function defaultParams(op: OperationDefinition): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const p of op.params) {
    if (p.defaultValue !== undefined) out[p.key] = p.defaultValue
  }
  return out
}

export default function OperationsCenterPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { currentFarm } = useTenant()

  const [operations, setOperations] = useState<OperationDefinition[]>([])
  const [farms, setFarms] = useState<FarmOption[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [category, setCategory] = useState<string>('agent')
  const [selectedId, setSelectedId] = useState<string>('agent.run')
  const [params, setParams] = useState<Record<string, unknown>>({})
  const [confirmDestructive, setConfirmDestructive] = useState(false)
  const [result, setResult] = useState<OperationRunResult | null>(null)

  const globalAdmin = isSystemAdmin(user)

  const selected = useMemo(
    () => operations.find((o) => o.id === selectedId),
    [operations, selectedId]
  )

  const filteredOps = useMemo(
    () => operations.filter((o) => o.category === category),
    [operations, category]
  )

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (currentFarm?.id) headers['X-Farm-ID'] = currentFarm.id

      const res = await fetch('/api/operations', {
        credentials: 'include',
        headers,
      })
      const data = await res.json()
      if (data.success) {
        setOperations(data.operations)
        setFarms(data.farms)
        setCategories(data.categories)
        const first = data.operations[0]
        if (first) {
          setCategory(first.category)
          setSelectedId(first.id)
          setParams(defaultParams(first))
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [currentFarm?.id])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/signin')
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) loadCatalog()
  }, [isAuthenticated, loadCatalog])

  useEffect(() => {
    if (selected) {
      const defaults = defaultParams(selected)
      if (defaults.farmId === undefined && currentFarm?.id) {
        defaults.farmId = currentFarm.id
      }
      setParams(defaults)
      setConfirmDestructive(false)
      setResult(null)
    }
  }, [selectedId, selected, currentFarm?.id])

  const setParam = (key: string, value: unknown) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const runOperation = async () => {
    if (!selected) return
    const headerFarmId = String(
      params.farmId || currentFarm?.id || farms[0]?.id || ''
    )
    if (!headerFarmId) return
    setRunning(true)
    setResult(null)
    try {
      const res = await fetch('/api/operations', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Farm-ID': headerFarmId,
        },
        body: JSON.stringify({
          operationId: selected.id,
          params,
          confirmDestructive: selected.destructive ? confirmDestructive : undefined,
        }),
      })
      const data = await res.json()
      if (data.result) setResult(data.result as OperationRunResult)
      else if (data.error) {
        setResult({
          success: false,
          operationId: selected.id,
          summary: data.error,
          durationMs: 0,
          error: data.error,
        })
      }
    } catch (err) {
      setResult({
        success: false,
        operationId: selected.id,
        summary: 'Request failed',
        durationMs: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setRunning(false)
    }
  }

  const renderField = (p: OperationParamDef) => {
    const value = params[p.key]

    if (p.type === 'farm') {
      return (
        <div key={p.key} className={styles.field}>
          <label>{p.label}</label>
          <select
            value={String(value || '')}
            onChange={(e) => setParam(p.key, e.target.value)}
          >
            <option value="">Select farm…</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (p.type === 'boolean') {
      return (
        <div key={p.key} className={styles.field}>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => setParam(p.key, e.target.checked)}
            />
            {p.label}
          </label>
          {p.description && <p className={styles.fieldHint}>{p.description}</p>}
        </div>
      )
    }

    if (p.type === 'select') {
      return (
        <div key={p.key} className={styles.field}>
          <label>{p.label}</label>
          <select
            value={String(value || '')}
            onChange={(e) => setParam(p.key, e.target.value)}
          >
            <option value="">Default</option>
            {(p.options || []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (p.type === 'json') {
      return (
        <div key={p.key} className={styles.field}>
          <label>{p.label}</label>
          <textarea
            rows={4}
            placeholder={p.placeholder || '{}'}
            value={String(value || '')}
            onChange={(e) => setParam(p.key, e.target.value)}
          />
          {p.description && <p className={styles.fieldHint}>{p.description}</p>}
        </div>
      )
    }

    return (
      <div key={p.key} className={styles.field}>
        <label>{p.label}</label>
        <input
          type={p.type === 'number' ? 'number' : 'text'}
          value={String(value ?? '')}
          placeholder={p.placeholder}
          onChange={(e) =>
            setParam(
              p.key,
              p.type === 'number' ? Number(e.target.value) : e.target.value
            )
          }
        />
        {p.description && <p className={styles.fieldHint}>{p.description}</p>}
      </div>
    )
  }

  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading Operations Center…</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>⚙️ OFMS Operations Center</h1>
        <p className={styles.subtitle}>
          Centralized management for CLI utilities — select an operation, set parameters
          from lists, and run without leaving the app.
          {globalAdmin && (
            <span className={styles.badge}>System Admin</span>
          )}
        </p>
      </header>

      <div className={styles.layout}>
        <Card className={styles.sidebar}>
          <strong>Categories</strong>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.categoryBtn} ${category === c ? styles.categoryBtnActive : ''}`}
              onClick={() => {
                setCategory(c)
                const first = operations.find((o) => o.category === c)
                if (first) setSelectedId(first.id)
              }}
            >
              {CATEGORY_LABELS[c] || c}
            </button>
          ))}

          <div className={styles.opList}>
            {filteredOps.map((op) => (
              <button
                key={op.id}
                type="button"
                className={`${styles.opBtn} ${selectedId === op.id ? styles.opBtnActive : ''}`}
                onClick={() => setSelectedId(op.id)}
              >
                {op.icon} {op.name}
              </button>
            ))}
          </div>
        </Card>

        <div className={styles.panel}>
          {selected ? (
            <>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>
                    {selected.icon} {selected.name}
                  </h2>
                  {selected.cliEquivalent && (
                    <div className={styles.cliTag}>CLI: {selected.cliEquivalent}</div>
                  )}
                </div>
              </div>
              <p className={styles.desc}>{selected.description}</p>

              <div className={styles.form}>
                {selected.params
                  .filter((p) => p.key !== 'confirmDestructive')
                  .map(renderField)}

                {selected.destructive && (
                  <div className={styles.destructiveBox}>
                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={confirmDestructive}
                        onChange={(e) => setConfirmDestructive(e.target.checked)}
                      />
                      Confirm — this operation may modify system or demo data
                    </label>
                  </div>
                )}

                <div className={styles.actions}>
                  <Button
                    variant="primary"
                    onClick={runOperation}
                    disabled={
                      running ||
                      (selected.destructive && !confirmDestructive) ||
                      (selected.params.some(
                        (p) => p.type === 'farm' && p.required && !params.farmId
                      ) &&
                        !currentFarm?.id &&
                        !farms[0]?.id)
                    }
                  >
                    {running ? 'Running…' : '▶ Run Operation'}
                  </Button>
                  <Button variant="secondary" onClick={() => setResult(null)}>
                    Clear output
                  </Button>
                </div>
              </div>

              {result && (
                <div
                  className={`${styles.result} ${result.success ? styles.resultSuccess : styles.resultFail}`}
                >
                  <div>
                    {result.success ? '✅' : '❌'} {result.summary} ({result.durationMs}
                    ms)
                  </div>
                  {result.checks && (
                    <ul className={styles.checks}>
                      {result.checks.map((c) => (
                        <li key={c.name} className={styles.checkItem}>
                          {c.ok ? '✓' : '✗'} {c.name}: {c.detail}
                        </li>
                      ))}
                    </ul>
                  )}
                  {result.output && (
                    <>
                      {'\n\n'}
                      {result.output}
                    </>
                  )}
                  {result.data != null && (
                    <>
                      {'\n\n'}
                      {JSON.stringify(result.data, null, 2)}
                    </>
                  )}
                  {result.error && (
                    <>
                      {'\n\nERROR: '}
                      {result.error}
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <p>Select an operation from the list.</p>
          )}
        </div>
      </div>
    </div>
  )
}
