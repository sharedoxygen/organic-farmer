## Architecture

- Next.js 14 app router, TypeScript, Prisma
- Multi-tenant isolation via `X-Farm-ID` header and DB-level filtering
- Auth placeholder via Bearer user-id (migration path to JWT/session)

### Key Modules
- Tenant context: `src/components/TenantProvider.tsx`, `src/lib/api/apiService.ts`, `src/lib/middleware/requestGuards.ts`
- API routes: `src/app/api/**`
- Security headers: `src/middleware.ts`

### Tenant Isolation Contract
- Every API route must call `ensureFarmAccess(request)` before data access
- All Prisma queries must include `{ where: { farm_id: farmId } }`

### Known gaps
- Some routes still rely only on `X-Farm-ID` checks and lack `ensureFarmAccess`
- Auth is not JWT-based yet; uses bearer user-id for demo/dev



