## Production Readiness Audit

### Executive summary
- Readiness: Yellow (proceed with guarded rollout)
- Top risks: auth model (bearer user-id), incomplete tenant guards in several API routes, low test coverage

### Key findings (high severity)
1) Incomplete tenant enforcement
   - Issue: Many API routes rely on `X-Farm-ID` but do not call `ensureFarmAccess()`
   - Impact: Potential cross-tenant data exposure if headers are spoofed
   - Fix: Add `ensureFarmAccess(request)` and DB-level `{ where: { farm_id: farmId } }` to all routes
   - Acceptance: Requests without valid membership return 403; all queries scoped by farm_id

2) Authentication placeholder
   - Issue: Bearer header carries a raw userId
   - Impact: Token spoofing leads to privilege escalation
   - Fix: Implement JWT (access + refresh), rotate keys, add signature/expiry checks
   - Acceptance: Only signed JWT accepted; user fetched via token claims

### Medium severity
- Error format inconsistent across routes
- Coverage thresholds unmet (global ~1%)
- Build skips type and lint validation in `next.config.js`

### Quick wins
- Enforce `ensureFarmAccess` in all API routes
- Standardize error responses and add Zod validation for write endpoints
- Turn on type/lint enforcement in CI while keeping local dev permissive

### Observability
- Add structured logging and request IDs
- Audit logging for admin actions and farm switching

### Compliance/domain checks
- Verify marijuana inventory domain constraints for Shared Oxygen Farms per business rules

### Readiness checklist (abridged)
- Security: partial
- Reliability: partial
- Performance: acceptable for current scale
- Observability: minimal
- Maintainability: good structure, low test coverage



