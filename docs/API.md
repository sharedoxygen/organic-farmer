## API Guidelines

### Contract
- Include `X-Farm-ID` header on all farm-scoped requests
- API routes must call `ensureFarmAccess(request)` and use DB-level filters
- Standard error format: `{ error: string }` (move to structured `{ error: { code, message, details } }`)

### Auth
- Migrate to JWT-based auth; deprecate bearer user-id

### Versioning
- Introduce `/api/v1` namespace for public routes



