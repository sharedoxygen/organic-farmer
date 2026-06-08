# AI Use Cases — Live vs Roadmap

**Aligned with repository as of June 2026.** Scenarios below map to **implemented APIs** where noted; aspirational vision scenarios are marked separately.

---

## Live today (verified)

| Use case | API / surface | Farm types |
|----------|---------------|------------|
| **Agent: daily priorities** | `POST /api/ai/agent`, Farm Agent chat | Organic + cannabis |
| **Agent: batch health scoring** | Tool `score_batches` → `batchScoringAI` | Both |
| **Agent: yield forecast** | Tool `predict_yield` → `yieldPredictionAI` | Both |
| **Agent: proactive alerts** | Tool `generate_alerts` → `alertEngine` | Both |
| **Agent: resource optimization** | Tool `optimize_resources` | Both |
| **Agent: create task** | Tool `create_task` → `tasks` table | Both |
| **AI Command Center** | `GET /api/ai/dashboard` | Both |
| **Mission Control insight** | `GET /api/showcase/metrics` (agent summary) | Both |
| **Demand forecast** | `POST /api/ai/demand-forecast`, planning modal | Both |
| **Weather + growing score** | `GET /api/ai/weather` | Both |
| **Ollama model admin** | `/admin/utilities/ai-models` | Per farm |
| **MCP tool catalog** | `GET /api/ai/agent/tools` | External agent integration |
| **Conversation memory** | `AI_CONVERSATION_TURN` in `audit_logs` | Per user per farm |
| **Audit trail** | `AI_*` actions in Observability | Both |

Proof: `npm run verify:all`

---

## Microgreens (Curry Island) — demo scenarios

### Live: operational agent briefing

```
User: "What should I focus on today?"
Agent tools: get_farm_overview → score_batches → generate_alerts → optimize_resources
Output: Active batch count, health scores, alerts, savings estimate
UI: AI Command Center + Farm Agent chat (tool chain visible)
```

### Live: demand planning

```
Surface: Planning → Forecasting → DemandForecastModal
API: POST /api/ai/demand-forecast
Data: Statistical ensemble on order history
```

### Roadmap: vision disease detection

```
API exists: POST /api/ai/crop-analysis (requires imageUrl)
Primary path: Ollama vision; OpenAI module present but not default route
UI gap: image upload flow on ai-insights page
```

---

## Cannabis (Shared Oxygen) — demo scenarios

### Live: compliance-aware ops briefing

```
User: "Any critical alerts?"
Agent: generate_alerts on live batch + resource context
Mission Control: cannabis gauges (BCC compliance, custody pipeline)
Traceability: /traceability/custody, /traceability/seed-to-sale
```

### Live: batch scoring for cultivation

```
Agent tool score_batches on active flowering/veg batches
AI Dashboard: live scores from /api/ai/dashboard
```

### Roadmap: METRC auto-submit

```
Not implemented — custody data model exists; no state API integration
```

---

## Buyer demo script (5 proof points)

1. `npm run verify:all`
2. Sign in as `kinkead@…` or `jay.cee@…`
3. **Mission Control** — farm-type gauges + agent insight
4. **AI Command Center** — live dashboard API
5. Farm Agent: *"What should I focus on today?"* → show tools
6. **Traceability → Custody** + **Observability** `AI_*` events

---

## Technology stack (accurate)

| Component | Status |
|-----------|--------|
| Native agent orchestrator | **Live** |
| Statistical ML (demand, yield heuristics) | **Live** |
| Ollama LLM (optional polish) | **Live** when Ollama running |
| OpenAI GPT-4o vision | **Module exists**; not default crop-analysis path |
| IoT sensor fusion | **Not shipped** |
| 24/7 autonomous agents | **Not shipped** |

---

## Competitive positioning

See [AGENTIC_AI_DIFFERENTIATOR.md](./AGENTIC_AI_DIFFERENTIATOR.md) — **Auditable Operations Intelligence** across organic + cannabis in one platform.

---

*Historical aspirational scenarios (disease photos, revenue % claims) retained in git history; do not cite in sales without live demo validation.*
