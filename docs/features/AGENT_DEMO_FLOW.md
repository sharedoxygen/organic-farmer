# OFMS Farm Agent — Demo Flow (10 min)

Use this script for live prospect demos, diligence calls, and recorded walkthroughs.

**Related:** [AGENT_ONE_PAGER.md](./AGENT_ONE_PAGER.md) · [AGENT_ARCHITECTURE_DILIGENCE.md](./AGENT_ARCHITECTURE_DILIGENCE.md)

---

## Before you start (5 min prep)

```bash
npm run dev                    # http://localhost:3005
npm run seed:showcase          # if demo farms need fresh data
npm run verify:agent             # optional smoke test — both farms must pass
```

| Item | Value |
|------|-------|
| **URL** | `http://localhost:3005` (or your deployed host) |
| **Organic demo farm** | Curry Island Microgreens · farm ID `…0010` |
| **Organic login** | `kinkead@curryislandmicrogreens.com` |
| **Cannabis demo farm** | Shared Oxygen Farms (ShaOxy) · farm ID `…0020` |
| **Cannabis login** | `jay.cee@sharedoxygen.com` |
| **Passwords** | From your `.env` / showcase seed — never hardcoded in repo |
| **Chat entry** | `/ai-dashboard` → 🤖 floating button (bottom-right) |

**Which farm?** Acts 1–4 below use **Curry Island** (organic). Act 5 and **Track B** use **Shared Oxygen** (cannabis). `npm run verify:agent` exercises **both**.

**Say once at the top:** *“This is not a chatbot over documents — it’s a multi-step agent workflow on live production data, with every tool call audited.”*

---

## Act 1 — AI Command Center (2 min)

**Navigate:** Sidebar → **AI Command Center** (`/ai-dashboard`)

**Point out:**
- Dashboard data from `GET /api/ai/dashboard` — batch scores, alerts, agent summary
- Same farm context the agent uses (not a separate AI silo)

**Line:** *“Leadership sees agent-derived priorities here before anyone opens chat.”*

---

## Act 2 — Multi-tool workflow (3 min)

**Open:** 🤖 **OFMS Farm Agent** chat (floating button on AI Dashboard)

**Prompt 1 (quick reply or type):**
```
What should I focus on today?
```

**Wait for:** “Running tools…” → response with agent report

**Point at on screen:**
- Answer text (batch counts, alerts, recommendations)
- **`Workflow:`** line — expect something like:
  ```
  get_farm_overview → score_batches → generate_alerts → optimize_resources
  ```
- Optional data cards below the message

**Line:** *“Each step is a domain tool hitting Prisma — same database as batches, orders, and traceability.”*

**Prompt 2 (optional — shows goal routing):**
```
Score active batches
```
**Expect workflow:** `score_batches → get_farm_overview`

---

## Act 3 — Human-in-the-loop write (2 min)

**Prompt:**
```
Create task to inspect harvest readiness
```

**Point at:**
- Response mentions **awaiting your approval** / proposed task
- **`Workflow:`** includes `create_task`
- **`Confirm: Proposed task: …`** button appears under the message

**Click:** **Confirm** button (do not only type “yes” — show the explicit gate)

**Wait for:** ✅ `Created task: …` in the response

**Navigate:** Sidebar → **Tasks** (`/tasks` or `/tasks/daily`)

**Verify:** New task title visible in the list

**Line:** *“Writes never happen silently — the agent proposes, the operator confirms, then we persist.”*

---

## Act 4 — Audit trail (2 min)

**Navigate:** Sidebar → **Observability** (`/observability`)

**Point at:**
- Recent `AI_AGENT_RUN` events (from Acts 2–3)
- `AI_CONVERSATION_TURN` if shown
- Tool names / farm context in event details

**Line:** *“For diligence: what ran, on whose farm, when — not a black-box LLM answer.”*

**Optional CLI for technical buyers:**
```bash
npm run verify:agent
```
Show terminal output: both farms, tool chains, confidence.

---

## Act 5 — Shared Oxygen / ShaOxy (3 min)

Use this when the buyer cares about **cannabis**, **custody**, or **cross-regime** — or run it instead of Acts 1–4 for a cannabis-only audience.

**Login / switch:** `jay.cee@sharedoxygen.com` or tenant switcher → **Shared Oxygen Farms**

### 5a — Mission Control (30 sec)

**Navigate:** **Mission Control** (`/mission-control`)

**Point at:** Cannabis-specific gauges (compliance, custody pipeline) — same platform, different `farm_type`.

### 5b — Agent briefing (1 min)

**Open:** 🤖 Farm Agent on `/ai-dashboard`

**Prompt:**
```
Any critical alerts?
```

**Expect workflow:** `generate_alerts` (± other tools from planner)

**Optional prompt:**
```
What should I focus on today?
```

**Expect workflow:** `get_farm_overview → score_batches → generate_alerts → optimize_resources` (same chain as Curry Island, cannabis data)

### 5c — Traceability tie-in (1 min)

**Navigate:** **Traceability → Custody** (`/traceability/custody`) or **Seed-to-Sale**

**Line:** *“The agent reasons over the same custody and batch data you see here — not a separate cannabis product.”*

### 5d — Write approval on ShaOxy (30 sec, optional)

**Prompt:**
```
Create task to review flowering room environmental logs
```

**Confirm** → verify task under **Tasks** for Shared Oxygen tenant.

**Line:** *“One agent workflow, one data model — organic and cannabis without separate products.”*

---

## Track summary

| Track | Farm | Login | Best for |
|-------|------|-------|----------|
| **A (Acts 1–4)** | Curry Island | `kinkead@curryislandmicrogreens.com` | Organic / microgreens / default 10-min demo |
| **B (Act 5)** | Shared Oxygen (ShaOxy) | `jay.cee@sharedoxygen.com` | Cannabis, custody, BCC-style compliance story |
| **A + B** | Both | Switch tenant after Act 4 | Diversified operators, PE / strategic acquirers |

---

## API demo (technical audience, +3 min)

**Agent run — Curry Island (`…0010`):**
```bash
curl -s -X POST http://localhost:3005/api/ai/agent \
  -H "Content-Type: application/json" \
  -H "Cookie: ofms_session=<session>" \
  -H "X-Farm-ID: 00000000-0000-0000-0000-000000000010" \
  -d '{"message":"What should I focus on today?","useLlm":false}'
```

**Agent run — Shared Oxygen / ShaOxy (`…0020`):**
```bash
curl -s -X POST http://localhost:3005/api/ai/agent \
  -H "Content-Type: application/json" \
  -H "Cookie: ofms_session=<session>" \
  -H "X-Farm-ID: 00000000-0000-0000-0000-000000000020" \
  -d '{"message":"Any critical alerts?","useLlm":false}'
```

**Inspect JSON:** `result.toolsUsed`, `result.confidence`, `result.insights`

**Task proposal (no write):**
```bash
-d '{"message":"Create task to inspect trays","useLlm":false}'
```
**Expect:** `result.pendingWrites` array, `create_task` status `pending`

**Task confirm:**
```bash
-d '{"message":"Confirm","confirmWrites":true,"toolPlan":[{"tool":"create_task","params":{"title":"Inspect trays"}}]}'
```

---

## If something breaks

| Issue | Fallback |
|-------|----------|
| Chat empty / error | Run `npm run verify:agent`; show terminal tool chain |
| LLM slow | Pass `useLlm: false` in API demo (deterministic `goalPlans`) |
| No farm data | `npm run seed:showcase` |
| Observability empty | Point at `audit_logs` via Admin → Audit Logs |

---

## Demo checklist (printable)

**Track A — Curry Island**
- [ ] Logged in as `kinkead@curryislandmicrogreens.com`  
- [ ] AI Command Center loads live data  
- [ ] “What should I focus on today?” shows **Workflow:** line  
- [ ] Task proposal shows **Confirm** button  
- [ ] Task appears in `/tasks` after Confirm  
- [ ] Observability shows `AI_AGENT_RUN`  

**Track B — Shared Oxygen (ShaOxy)**
- [ ] Logged in as `jay.cee@sharedoxygen.com` (or switched tenant)  
- [ ] Mission Control shows cannabis context  
- [ ] “Any critical alerts?” returns live agent workflow  
- [ ] Custody / seed-to-sale page matches agent farm context  
- [ ] (Optional) Task create + Confirm on ShaOxy tenant  

---

## Closing line

> OFMS gives you a **multi-step agent workflow** on live operations data — with human approval for writes and a full audit trail. That’s what regulated farm buyers need for production use and diligence, whether the orchestration layer is called LangGraph or native TypeScript.

---

*June 2026*
