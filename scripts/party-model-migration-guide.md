# Party Data Model Migration Guide

## Overview
This guide documents the full migration from the current B2B/B2C dual-model architecture to a unified Party Data Model in OFMS.

## Why Party Model?
- **Eliminates duplication**: One identity model for customers, users, suppliers, farms
- **Multi-role support**: Entities can have multiple roles (e.g., customer + supplier)
- **Simplified permissions**: Role-based access via `party_roles` table
- **Flexible relationships**: Track complex business relationships
- **Better analytics**: Unified reporting across all entity types
- **Future-proof**: Easy to add new roles/relationships

## Migration Phases

### Phase 1: Add Core Party Tables ✅
**Status**: Scripts created, ready to execute

**Files**:
- `prisma/migrations/party_model_phase1.sql`

**Tables Added**:
- `parties` - Core party entity
- `party_roles` - Multi-role support
- `party_contacts` - Email, phone, address, etc.
- `party_relationships` - Inter-party relationships

**Enums Added**:
- `PartyType`: PERSON, ORGANIZATION
- `PartyRoleType`: FARM, CUSTOMER_B2B, CUSTOMER_B2C, USER, SUPPLIER, etc.
- `ContactType`: EMAIL, PHONE, MOBILE, FAX, ADDRESS, etc.
- `RelationshipType`: OWNS, MANAGES, EMPLOYS, SUPPLIES, etc.

**Execution**:
```bash
psql $DATABASE_URL < prisma/migrations/party_model_phase1.sql
```

### Phase 2: Add Party References ✅
**Status**: Scripts created, ready to execute

**Files**:
- `prisma/migrations/party_model_phase2.sql`

**Changes**:
- `farms.partyId` (nullable, unique)
- `users.partyId` (nullable, unique)
- `customers.partyId` (nullable, unique)
- `suppliers.partyId` (nullable, unique)
- `orders.customerPartyId` (nullable, indexed)

**Execution**:
```bash
psql $DATABASE_URL < prisma/migrations/party_model_phase2.sql
```

### Phase 3: Backfill Data ✅
**Status**: Script created, ready to execute

**Files**:
- `scripts/party-model-backfill.js`

**Actions**:
1. Create party for each farm → assign FARM role
2. Create party for each user → assign USER + EMPLOYEE roles
3. Create party for each customer → assign CUSTOMER_B2B/B2C role
4. Create party for each supplier → assign SUPPLIER role
5. Populate party_contacts with emails, phones, addresses
6. Update foreign keys (partyId, customerPartyId)

**Execution**:
```bash
node scripts/party-model-backfill.js
```

**Verification**:
- Check party count matches (farms + users + customers + suppliers)
- Verify all entities have partyId populated
- Confirm contacts migrated correctly
- Test orders link to customerPartyId

### Phase 4: Update Application Logic ⏳
**Status**: Service layer created, API routes ready

**Backend Updates Required**:
- [ ] Update customer APIs to use PartyService
- [ ] Update order APIs to use customerPartyId
- [ ] Update analytics to query via party_roles
- [ ] Update tenant middleware for party-based permissions
- [ ] Update audit logging to track party actions

**Frontend Updates Required**:
- [ ] Update B2B customers page to use /api/party?role=CUSTOMER_B2B
- [ ] Update B2C customers page to use /api/party?role=CUSTOMER_B2C
- [ ] Update orders page to display party info
- [ ] Update sales analytics to aggregate via parties
- [ ] Update customer modals to work with party structure

**Files Created**:
- `src/lib/services/partyService.ts` - Party service layer
- `src/app/api/party/route.ts` - Party CRUD endpoints
- `src/app/api/party/[id]/route.ts` - Single party operations

### Phase 5: Cleanup & Deprecation ⏳
**Status**: Not started

**Actions**:
1. Add foreign key constraints after backfill verified
2. Mark legacy columns for deprecation
3. Remove B2B/B2C-specific routes after party routes tested
4. Drop legacy columns once app fully migrated
5. Update documentation and seeding scripts

**SQL Cleanup** (after full migration):
```sql
-- Remove legacy columns
ALTER TABLE customers DROP COLUMN name;
ALTER TABLE customers DROP COLUMN email;
ALTER TABLE customers DROP COLUMN phone;
ALTER TABLE customers DROP COLUMN street;
ALTER TABLE customers DROP COLUMN city;
-- ... etc

-- Remove legacyCustomerId from orders
ALTER TABLE orders DROP COLUMN legacyCustomerId;

-- Add NOT NULL constraints
ALTER TABLE farms ALTER COLUMN partyId SET NOT NULL;
ALTER TABLE users ALTER COLUMN partyId SET NOT NULL;
ALTER TABLE customers ALTER COLUMN partyId SET NOT NULL;
ALTER TABLE orders ALTER COLUMN customerPartyId SET NOT NULL;
```

## Execution Checklist

### Pre-Migration
- [ ] Backup database
- [ ] Run tests (npm run test)
- [ ] Verify lint passing (npm run lint)
- [ ] Document current state

### Phase 1 Execution
- [ ] Run party_model_phase1.sql
- [ ] Verify tables created: parties, party_roles, party_contacts, party_relationships
- [ ] Verify enums created
- [ ] Regenerate Prisma client
- [ ] Run tests

### Phase 2 Execution
- [ ] Run party_model_phase2.sql
- [ ] Verify columns added to existing tables
- [ ] Verify indexes created
- [ ] Regenerate Prisma client
- [ ] Run tests

### Phase 3 Execution
- [ ] Run party-model-backfill.js
- [ ] Verify party count matches
- [ ] Verify all foreign keys populated
- [ ] Verify contacts migrated
- [ ] Run data integrity checks
- [ ] Run tests

### Phase 4 Execution
- [ ] Deploy party API endpoints
- [ ] Update frontend pages one-by-one
- [ ] Test each page after update
- [ ] Monitor error logs
- [ ] Update analytics queries

### Phase 5 Execution
- [ ] Add foreign key constraints
- [ ] Test with constraints
- [ ] Remove legacy endpoints
- [ ] Drop legacy columns
- [ ] Update documentation
- [ ] Final testing

## Rollback Plan

If issues arise:

1. **Phase 1**: Simply drop party tables
2. **Phase 2**: Drop added columns
3. **Phase 3**: Clear party data, reset foreign keys to NULL
4. **Phase 4**: Revert code changes, redeploy
5. **Phase 5**: Cannot rollback - must fix forward

## Testing Strategy

After each phase:
- Run unit tests: `npm run test`
- Run integration tests for affected modules
- Manual UI testing:
  - Customer management (B2B/B2C)
  - Order creation
  - Sales analytics
  - User management
  - Farm switching

## Performance Considerations

- Party queries join via `party_roles` - ensure proper indexing
- Contact lookups should cache primary email/phone
- Analytics dashboards may need materialized views
- Consider adding `party_cache` table for frequent queries

## Security Notes

- Party-based permissions simplify access control
- Role checks via `party_roles` table
- Multi-tenant isolation via farm_id in roles
- Audit all party changes via audit_logs

## Benefits After Migration

✅ Single customer management UI (no B2B/B2C split)  
✅ Suppliers can also be customers (multi-role)  
✅ Users can have customer accounts (e.g., employee purchases)  
✅ Simplified analytics (one party source)  
✅ Better compliance tracking (party audit trail)  
✅ Easier farm switching (party roles per farm)  

## Next Steps

1. **Review this guide**
2. **Approve execution plan**
3. **Run Phase 1 migration**
4. **Test and verify**
5. **Proceed to Phase 2**

