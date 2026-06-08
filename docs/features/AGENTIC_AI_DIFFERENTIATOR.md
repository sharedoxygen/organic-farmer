# OFMS Agentic AI — Buyer Differentiator

**Category name:** **Auditable Operations Intelligence**  
**One line:** The only farm platform where a single AI agent runs live scoring, forecasting, and task creation across **organic and cannabis** supply chains—with every tool call logged for buyer due diligence.

---

## Why this matters to buyers

Industry messaging in 2025–2026 splits into three camps (verified from public positioning):

| Camp | Examples | What they sell |
|------|----------|----------------|
| **Compliance / ERP** | Seed-to-sale trackers, METRC integrations | Legally required record-keeping; does not optimize the next batch by itself ([Growgoyle, 2026](https://getgrowgoyle.com/what-is-cultivation-intelligence/)) |
| **Segment FMS + AI features** | [Tend](https://www.tend.com/) (microgreens traceability, 2025 “Farm Management Software of the Year”), Microgreen Manager, SeedLeaf | Planning, orders, audit-ready traceability; AI assists workflows, not a native multi-tool agent inside ops data |
| **Cannabis-only agent layers** | [Canix MCP](https://vinkius.com/apps/canix-erp-mcp) (10 read tools for external LLMs), Growgoyle “cultivation intelligence,” GreenThread/HighGround-style autonomous agents | Cannabis-focused; often chat/MCP bolt-on or aspirational “autonomous employee” marketing without unified organic+cannabis ops |

**Gap OFMS fills:** Buyers operating **both** specialty organic production and regulated cannabis—or evaluating platforms for **traceability + operations + AI** in one diligence package—have no single product that combines (1) farm-type-aware ops, (2) seed-to-sale/custody data, and (3) an **in-app agent that acts on that data** with an audit trail.

---

## OFMS differentiator (implementation-verified)

These claims are backed by code and `npm run verify:agent` (both demo farms):

### 1. Cross-regime agent, one tenant model

- Same **Farm Agent** orchestrator serves `ORGANIC_MICROGREENS` and `CANNABIS_CULTIVATION` farms (`farm_type` in settings → `farmMetrics.ts`, `farmContextService.ts`).
- Mission Control, AI Command Center, and traceability UIs adapt per farm type—not separate products.
- **Buyer value:** One vendor, one data model, one demo path for diversified operators and PE/strategic acquirers.

### 2. Agent acts on live operations data—not a chat sidebar

- Agent runs **11 domain tools** against Prisma: overview, batch scoring, yield forecast, alerts, resource optimization, demand forecast, weather, quality summary, plant scan history, **plant vision analysis**, **task creation** (`src/lib/ai/agent/tools.ts`).
- **LLM tool planner** (`toolPlanner.ts`) selects tools via Ollama when available; falls back to goal-based plans (`goalPlans.ts`) with conversation memory.
- `create_task` writes real rows to `tasks`; other tools read batches, orders, QC, custody counts from the same DB the UI uses.
- Chat surfaces the **tool chain** per response (e.g. `get_farm_overview → score_batches → generate_alerts → optimize_resources`).
- **Alert acknowledgments persist** — stable alert IDs + `ALERT_ACKNOWLEDGED` audit rows survive page refresh and agent re-runs.
- **Plant Vision linked to lots** — optional `batchId` on scan stores KDEs (diagnosis, severity, confidence) on the batch audit trail per FSMA traceability practice ([FDA FSMA 204](https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-requirements-additional-traceability-records-certain-foods)).
- **Buyer value:** AI is operational infrastructure, not a FAQ bot.

### 3. Auditable intelligence for due diligence

- Every agent run logs `AI_AGENT_RUN` (and related `AI_*` actions) to `audit_logs` with tools used and confidence (`inferenceLogger.ts`).
- Observability Hub reads real inference counts from that trail—not synthetic metrics.
- Custody/seed-to-sale modules (`custodyService`, traceability routes) sit in the **same** platform the agent reasons over.
- **Buyer value:** Prospects can ask *“What did the AI do, on whose data, and can we trace it?”*—critical for regulated ag and M&A technical review.

---

## Positioning statement (use in sales deck)

> **OFMS Auditable Operations Intelligence** — A multi-tenant farm OS with a native agent that scores batches, forecasts yield, raises alerts, optimizes resources, and creates tasks from **your** production database—across USDA organic microgreens and BCC-style cannabis—with a full tool-level audit trail for compliance and buyer diligence.

---

## Do not claim (honest boundaries)

| Claim | Status |
|-------|--------|
| 24/7 fully autonomous operation with no human login | **Not shipped** — agent is invoked on demand |
| Full MCP stdio transport | **Roadmap** — Streamable HTTP JSON-RPC shipped at `POST /api/mcp` (`initialize`, `tools/list`, `tools/call`) |
| Plant Vision from agent without photo | **Partial** — `analyze_plant` summarizes scan history; live vision requires `imageDataUrl` or `/mobile/plant-scan` |
| Alert acknowledgment | **Shipped** — `POST /api/ai/alerts` + stable IDs + audit trail; GET/agent tools hydrate `acknowledged` state |
| Plant scan → batch linkage | **Shipped** — optional `batchId` on plant scan; history filter `?batchId=`; batch detail page shows scan KDEs |
| IoT/sensor-native “cultivation intelligence” (Growgoyle-style Goyle Score from environmental sensors) | **Not shipped** — scoring uses batch metrics derived from DB, not live sensor feeds |
| METRC/state API auto-submit | **Not shipped** — compliance is data model + custody, not state system integration |
| Guaranteed yield lift % | **Do not cite** — no production A/B study in repo |

---

## Proof points for demos

1. `npm run verify:agent` — agent completes multi-tool runs on Curry Island + Shared Oxygen.
2. Sign in → AI Command Center — data from `/api/ai/dashboard` (no mock hero stats).
3. Farm Agent chat — ask *“What should I focus on today?”* — show tool chain + answer.
4. Traceability → Custody / Seed-to-Sale — same farm as agent context.
5. Observability — `AI_*` events after agent runs.

---

*Last updated: June 2026. Competitive references from public web positioning; OFMS capabilities from repository source of truth.*
