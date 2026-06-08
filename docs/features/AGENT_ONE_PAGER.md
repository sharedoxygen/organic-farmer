# OFMS Auditable Operations Intelligence — One-Pager

**One line:** A multi-step AI agent that scores batches, forecasts yield, raises alerts, and creates tasks on **live farm data** — with every tool call logged for compliance and buyer diligence.

---

## What it is

| | |
|---|---|
| **Category** | Auditable Operations Intelligence |
| **Pattern** | Multi-step agent workflow: goal → plan → tools → synthesize → audit |
| **Scope** | USDA organic microgreens **and** cannabis cultivation — one platform, one tenant model |
| **Invocation** | On-demand (chat, API, MCP) — not a chatbot sidebar |

---

## What the agent does (live today)

- **Reads** live Prisma data — batches, tasks, orders, QC, custody, weather
- **Runs** 11 domain tools in a visible chain (e.g. `get_farm_overview → score_batches → generate_alerts → optimize_resources`)
- **Writes** operational tasks **after human confirmation** — propose → Confirm → row in `tasks`
- **Logs** every run to `audit_logs` as `AI_AGENT_RUN` with tools used and confidence

---

## Why buyers care

| Market today | OFMS |
|---|---|
| Segment FMS + AI features | Native multi-tool workflow on the **same DB** as ops UI |
| Cannabis MCP read-only bolt-ons | In-product agent that **proposes and creates tasks** |
| “Autonomous agent” marketing | **Inspectable** tool chain + audit trail for M&A / regulated ag |

---

## 10-minute demo (headline beats)

1. **AI Command Center** (`/ai-dashboard`) — live metrics, no mocks  
2. **Farm Agent chat** — ask *“What should I focus on today?”* — show **Workflow:** line  
3. **Write approval** — *“Create task to inspect harvest readiness”* → **Confirm** → task in `/tasks`  
4. **Observability** (`/observability`) — `AI_*` events from the demo  
5. **Optional** — switch to Shared Oxygen (cannabis) and repeat alert briefing  

Full script: [AGENT_DEMO_FLOW.md](./AGENT_DEMO_FLOW.md)

---

## Technical diligence (60 seconds)

- **Workflow engine:** `src/lib/ai/agent/orchestrator.ts` (native TypeScript — same pattern as graph-based frameworks)
- **APIs:** `POST /api/ai/agent`, `POST /api/ai/assistant`, `POST /api/mcp`
- **Verification:** `npm run verify:agent` (Curry Island + Shared Oxygen)
- **Write gate:** `create_task` requires `confirmWrites: true` or chat Confirm

Detail: [AGENT_ARCHITECTURE_DILIGENCE.md](./AGENT_ARCHITECTURE_DILIGENCE.md)

---

## Do not claim

- 24/7 fully autonomous operation  
- LangGraph / CrewAI by name (same architectural pattern, native implementation)  
- METRC auto-submit or IoT-native cultivation scores  

---

## Positioning line (deck / email)

> **OFMS Auditable Operations Intelligence** — the farm OS where a single agent runs scoring, forecasting, alerts, and task creation on your production database, across organic and cannabis, with a full tool-level audit trail.

---

*June 2026 · Source: repository + `npm run verify:agent`*
