## Security

### Current controls
- Security headers set in `src/middleware.ts` (CSP in production, XFO, XCTO, Referrer-Policy, XSS-Protection)
- Rate limiter for feedback endpoint
- Multi-tenant enforcement pattern: `ensureFarmAccess()` + DB where clauses on `farm_id`

### Gaps and recommendations
- Replace bearer user-id with JWT (short-lived) and refresh token flow
- Ensure all API routes use `ensureFarmAccess` or equivalent
- Add input validation (Zod) across all POST/PUT/PATCH routes
- Add audit logging for sensitive actions to `src/lib/services/auditService.ts`
- Implement dependency and secret scanning in CI



