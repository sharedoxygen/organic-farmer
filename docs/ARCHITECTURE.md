# OFMS Architecture (June 2026)

Next.js 14 App Router monolith — TypeScript, Prisma, PostgreSQL. Multi-tenant farm operations with agentic AI and seed-to-sale traceability.

---

## Core stack

| Layer | Implementation |
|-------|----------------|
| Framework | Next.js 14, React 18, TypeScript 5 |
| Data | Prisma 5 + PostgreSQL, row-level `farm_id` |
| Auth | JWT session cookie (`ofms_session`) via `requestGuards` |
| Tenant | `TenantProvider`, `X-Farm-ID` header, `farm_users` |

---

## Request flow

```
Browser
  → AuthProvider / TenantProvider
  → Pages (Mission Control, AI Dashboard, Traceability, …)
  → /api/* Route Handlers
  → ensureFarmAccess() + errorResponse()
  → Prisma → PostgreSQL
```

Every farm-scoped API must call `ensureFarmAccess(request)` before data access. Catch blocks use `errorResponse()` for correct HTTP status codes.

---

## Key modules

| Module | Path | Role |
|--------|------|------|
| Tenant guards | `src/lib/middleware/requestGuards.ts` | JWT + farm membership |
| Showcase metrics | `src/lib/showcase/farmMetrics.ts` | Farm-type-aware Mission Control data |
| **Farm Agent** | `src/lib/ai/agent/` | Orchestrator, tools, MCP descriptors |
| Farm context | `src/lib/ai/farmContextService.ts` | DB-grounded agent context |
| Inference log | `src/lib/ai/inferenceLogger.ts` | `AI_*` audit trail |
| Conversation | `src/lib/ai/conversationMemory.ts` | Turn persistence via `audit_logs` |
| Custody | `src/lib/services/custodyService.ts` | Traceability chain |
| Instrument UI | `src/components/ui/Instrument/` | Gauges, meters, pipelines |
| Command palette | `src/components/CommandPalette/` | ⌘K navigation |

---

## Agentic AI architecture

```
User message (chat or API)
  → classifyGoal()
  → loadFarmContext(farmId)
  → execute tools (parallel plan per goal)
  → synthesize answer (+ optional Ollama polish)
  → logInference(AI_AGENT_RUN)
  → saveConversationTurn (assistant only)
```

### Agent APIs

| Endpoint | Purpose |
|----------|---------|
| `POST /api/ai/agent` | Full agent run |
| `GET /api/ai/agent/tools` | MCP-compatible tool catalog |
| `GET /api/ai/dashboard` | AI Command Center aggregate |
| `POST /api/ai/assistant` | Chat → agent + conversation memory |

### Tools (live on Prisma)

`get_farm_overview` · `score_batches` · `predict_yield` · `generate_alerts` · `optimize_resources` · `get_demand_forecast` · `get_weather` · `create_task`

External agents: `GET /api/ai/agent/tools` for descriptors; invoke via `POST /api/ai/agent` with same auth as UI.

---

## Showcase demo farms

| Farm | UUID suffix | `settings.farm_type` | Owner |
|------|-------------|----------------------|-------|
| Curry Island Microgreens | `…0010` | `ORGANIC_MICROGREENS` | `kinkead@curryislandmicrogreens.com` |
| Shared Oxygen Farms | `…0020` | `CANNABIS_CULTIVATION` | `jay.cee@sharedoxygen.com` |

```bash
npm run seed:showcase   # preserve users, enhance data
npm run verify:all      # tsc + tests + agent + farms
```

---

## Domain boundaries (modular monolith)

- **Production** — batches, seeds, environments, harvest
- **Planning** — crops, calendar, forecasting
- **Traceability** — lots, custody, recalls, seed-to-sale
- **Sales** — orders, customers
- **Quality** — QC checks, compliance settings
- **AI** — agent, scoring, yield, alerts, weather
- **Admin** — farms, users, feedback, AI model config (`/admin/utilities/ai-models`)

---

## Data preservation policy

Showcase and agent work **do not** require destructive schema changes. Seeds upsert farms and enhance operational data; users/passwords preserved via `OFMS_PRESERVE_USERS=1`.

---

*See [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) and [AGENTIC_AI_DIFFERENTIATOR.md](./features/AGENTIC_AI_DIFFERENTIATOR.md).*
