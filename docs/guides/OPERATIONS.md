## Operations

### Environments
- Node >= 18 LTS; align with Jest 30 engine requirements
- Next build uses external Babel (SWC disabled)

### Build and run
- Install: `npm ci`
- Test: `npm test` (coverage thresholds currently unmet; see audit)
- Build: `npm run build`

### Database
- Prisma migrations and seed scripts in `scripts/`
- Health check SQL: `prisma/health-check.sql`

### Backups
- `npm run db:backup` (ensure DATABASE_URL set)



