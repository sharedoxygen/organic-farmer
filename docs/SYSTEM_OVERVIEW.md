# OFMS System Overview (OFMS 2.0)

**Organic Farm Management System** — multi-tenant farm operations platform with showcase-grade UX, agentic AI surfaces, and seed-to-sale traceability.

**Status**: OFMS 2.0 showcase + agentic AI complete — run `npm run verify:all`  
**Last Updated**: June 2026  
**Dev server**: `http://localhost:3005`  
**Database**: PostgreSQL + Prisma ORM

---

## Executive Summary

OFMS is a **modular monolith** (Next.js 14 App Router) serving multiple independent farms with row-level isolation (`farm_id`). The product is being repositioned as a **flagship demo** for organic and cannabis cultivation workflows, agentic AI, and precision operations UI.

### Showcase Demo Farms

| Farm | ID | Type | Owner context |
|------|-----|------|---------------|
| **Curry Island Microgreens** | `…0010` | USDA organic microgreens | Naples, FL — farm-to-table B2B/B2C |
| **Shared Oxygen Farms** | `…0020` | California cannabis cultivation | BCC-compliant seed-to-sale |

Seed both farms: `npm run seed:showcase` (preserves existing users and passwords)

**Demo logins** (existing accounts — credentials unchanged):

| Farm | Owner login | Team examples |
|------|-------------|---------------|
| Curry Island Microgreens | `kinkead@curryislandmicrogreens.com` | `manager@curryisland.com`, `grower@curryisland.com`, `harvest@curryisland.com` |
| Shared Oxygen Farms | `jay.cee@sharedoxygen.com` | `maintenance@sharedoxygen.com`, `cultivation@sharedoxygen.com`, `processing@sharedoxygen.com`, `quality@sharedoxygen.com` |

---

## Technology Stack (current)

| Layer | Implementation |
|-------|----------------|
| Framework | Next.js 14, React 18, TypeScript 5 |
| API | 67+ Route Handlers under `src/app/api/` |
| Database | Prisma 5 + PostgreSQL |
| Auth | JWT cookie (`ofms_session`) + `requestGuards` |
| Multi-tenant | `X-Farm-ID` header, `TenantProvider`, `farm_users` |
| AI | `src/lib/ai/*` — Ollama, OpenAI, statistical ML |
| UI | CSS Modules + `premium-theme.css` + Instrument components |
| Charts | Recharts |
| Testing | Jest, Playwright, MSW |

**Note**: NextAuth adapter is present; primary auth path is custom JWT. Build may skip strict TS/ESLint until CI gates are re-enabled.

---

## OFMS 2.0 Experience Layer (new)

| Surface | Route | Purpose |
|---------|-------|---------|
| **Mission Control** | `/mission-control` | Farm-type-aware showcase dashboard — gauges, pipeline flow, agent insight |
| **AI Command Center** | `/ai-dashboard` | Live batch scoring + ops metrics (wired to APIs) |
| **Observability Hub** | `/observability` | Health score, latency, AI metrics, audit trail |
| **Command Palette** | `⌘K` / `Ctrl+K` | Keyboard-first navigation and farm switching |

### Instrument Components

Located in `src/components/ui/Instrument/`:

- `RadialGauge` — precision dial with status coloring
- `LinearMeter` — gradient progress bars
- `FlowPipeline` — seed-to-sale / farm-to-table step visualization

### Showcase APIs

- `GET /api/showcase/metrics` — farm-type metrics (organic vs cannabis)
- `GET /api/observability/metrics` — instrumentation snapshot

---

## Architecture

```
Browser (81 pages)
    → TenantProvider / AuthProvider
    → Mission Control | Dashboard | AI | Traceability
    → /api/* Route Handlers
    → ensureFarmAccess + errorResponse
    → Prisma → PostgreSQL
```

### Domain modules (implemented)

- **Production** — batches, seeds, environments, harvest, post-harvest
- **Planning** — crops, calendar, forecasting, resources
- **Traceability** — lots, custody, recalls, seed-to-sale
- **Sales** — orders, customers, delivery
- **Quality & Compliance** — QC, USDA organic, FDA FSMA
- **AI** — yield, batch scoring, assistant, alerts, weather
- **Admin** — farms, users, feedback, utilities

### Data preservation

All OFMS 2.0 work **preserves existing Prisma schema and relationships**. Showcase seed (`scripts/seed-showcase.ts`) upserts demo farms and enhances custody/audit data without destructive schema changes.

---

## Authentication & Security

- Session: `ofms_session` JWT cookie
- Farm access: `ensureFarmAccess()` on protected API routes
- System admin: `is_system_admin` / `system_role` database fields
- Audit: `audit_logs` table + `AuditService` + `logSystemAdminAction()`

---

## Agentic AI differentiator (buyers)

**Category:** Auditable Operations Intelligence

**One line:** Single in-app agent that scores, forecasts, alerts, optimizes, and **creates tasks** on live farm data—across **organic microgreens and cannabis**—with every tool run logged for due diligence.

| vs. market | OFMS |
|------------|------|
| Segment FMS (Tend, Microgreen Manager) — planning + traceability, limited native agents | Native multi-tool orchestrator on same DB as ops UI |
| Cannabis ERP + MCP (Canix) — external LLM read access | In-product agent that **writes** tasks and logs `AI_*` audit events |
| “Autonomous agent” marketing (supply-chain bots) — often cannabis-only | Verified dual-farm demo + custody/seed-to-sale in one platform |

Full positioning: [AGENTIC_AI_DIFFERENTIATOR.md](./features/AGENTIC_AI_DIFFERENTIATOR.md)

---

## Agentic AI (OFMS Farm Agent)

End-to-end agentic orchestration with DB-grounded tools, inference logging, and live dashboards.

| Layer | Path | Purpose |
|-------|------|---------|
| **Orchestrator** | `src/lib/ai/agent/orchestrator.ts` | Goal classification → multi-tool execution → synthesis |
| **Tools** | `src/lib/ai/agent/tools.ts` | 8 domain tools (overview, scoring, yield, alerts, resources, forecast, weather, tasks) |
| **Farm context** | `src/lib/ai/farmContextService.ts` | Loads batches, tasks, orders from Prisma |
| **Inference log** | `src/lib/ai/inferenceLogger.ts` | `AI_*` audit trail for observability |
| **Agent API** | `POST /api/ai/agent` | Full agent run with `toolsUsed` trace |
| **Dashboard API** | `GET /api/ai/dashboard` | Live AI Command Center data (no mocks) |
| **Assistant** | `POST /api/ai/assistant` | Chat delegates to agent orchestrator |
| **Mission Control** | `/api/showcase/metrics` | Agent-generated `aiSummary` insight |

### Agent tools

`get_farm_overview` · `score_batches` · `predict_yield` · `generate_alerts` · `optimize_resources` · `get_demand_forecast` · `get_weather` · `create_task`

### UI surfaces (live)

- **AI Command Center** (`/ai-dashboard`) — wired to `/api/ai/dashboard`
- **Farm Agent chat** — shows tool chain per response
- **Observability Hub** — real `AI_*` inference counts from `audit_logs`
- **Mission Control** — live agent insight card

**Shipped**: MCP tool catalog (`GET /api/ai/agent/tools`), conversation persistence (`AI_CONVERSATION_TURN`).  
**Roadmap**: Model training feedback loops, full MCP server process, OpenTelemetry export.

---

## Getting Started

```bash
npm install
npm run db:migrate
npm run seed:showcase    # Curry Island + Shared Oxygen demo data
npm run verify:agent     # Agent only (both farms)
npm run verify:all       # tsc + tests + farms + agent + MCP tools
npm run dev              # http://localhost:3005
```

**Prospect demo flow**

1. Sign in as `kinkead@curryislandmicrogreens.com` or `jay.cee@sharedoxygen.com`
2. `⌘K` → switch between Curry Island and Shared Oxygen
3. **Mission Control** — farm-type gauges, pipeline, live agent insight
4. **AI Command Center** — `/api/ai/dashboard` (live scores, yield, resources)
5. **Farm Agent chat** — *"What should I focus on today?"* (watch tool chain)
6. **Traceability → Seed-to-Sale** — custody chain
7. **Observability** — `AI_*` inference trail

---

## Documentation Index

| Doc | Status |
|-----|--------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Current (JWT + agent layer) |
| [AI_USE_CASES.md](./features/AI_USE_CASES.md) | Live vs roadmap aligned |
| [AGENTIC_AI_DIFFERENTIATOR.md](./features/AGENTIC_AI_DIFFERENTIATOR.md) | Buyer positioning |
| [SETUP.md](./SETUP.md) | Install guide |
| [API.md](./API.md) | API reference |

---

## Known Gaps (honest)

- Application Insights / OpenTelemetry not wired (observability uses `audit_logs` inference trail)
- Some pages still use simulated fallbacks (weather without API key, delivery maps)
- Duplicate party/customer API paths remain
- Report Studio (PDF builder) not yet implemented

---

*OFMS 2.0 — showcase-grade farm intelligence, built on preserved data and relationships.*
