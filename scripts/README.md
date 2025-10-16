# OFMS Scripts Documentation

This directory contains consolidated tools for managing the Organic Farmer Management System (OFMS). These scripts have been audited and consolidated from 37 original scripts down to 12 core tools.

## 📋 Quick Reference

### 🎯 Most Common Operations

```bash
# System Setup
node scripts/ofms-admin-tools.js setup

# Create Test Data  
node scripts/ofms-data-manager.js generate --mode=demo

# Development Workflow
./scripts/dev-instances.sh dev
./scripts/dev-instances.sh deploy:clean

# System Health Check
node scripts/ofms-admin-tools.js verify
```

## 🛠️ Core Scripts

### Administrative Tools

#### `ofms-admin-tools.js` - System Administration
**Purpose**: Consolidated administrative operations for user and system management

**Commands**:
```bash
# Complete system setup with verification
node scripts/ofms-admin-tools.js setup

# Create system administrator
node scripts/ofms-admin-tools.js create-admin [--email] [--password]

# Reset admin password
node scripts/ofms-admin-tools.js reset-password [--email] [--password]

# Fix user-farm associations
node scripts/ofms-admin-tools.js fix-users [--farm-id]

# Verify system integrity
node scripts/ofms-admin-tools.js verify

# List system users
node scripts/ofms-admin-tools.js list-users [--active-only] [--system-admin-only]
```

**Common Options**:
- `--verbose` - Detailed output
- `--dry-run` - Show what would be done
- `--force` - Skip confirmations

**Examples**:
```bash
# Complete initial system setup
node scripts/ofms-admin-tools.js setup

# Create admin with custom credentials  
node scripts/ofms-admin-tools.js create-admin --email admin@farm.com --password secure123

# List only active users
node scripts/ofms-admin-tools.js list-users --active-only
```

---

### Data Management Tools

#### `ofms-data-manager.js` - Data Operations
**Purpose**: Unified entrypoint for generation, loading, and seeding (reuses existing modules)

**Commands**:
```bash
# Generate synthetic/demo datasets
node scripts/ofms-data-manager.js generate --mode=demo --size=medium --farm-type=microgreens

# Load synthesized data into a target farm
node scripts/ofms-data-manager.js load --type=customers --size=medium --farm-id=<FARM_ID>

# Seed current operational dataset
node scripts/ofms-data-manager.js seed --source=current

# Seed with real operational data (Prisma extract)
node scripts/ofms-data-manager.js seed --source=real --target-db="postgresql://..."

# Seed with real operational data (direct SQL)
node scripts/ofms-data-manager.js seed --source=sql --target-db="postgresql://..."
```

---

### Database Tools

#### `ofms-database-tools.js` - Database Operations
**Purpose**: Comprehensive database integrity, auditing, and maintenance operations

**Commands**:
```bash
# Run all database checks
node scripts/ofms-database-tools.js --check=all --report

# Check specific areas
node scripts/ofms-database-tools.js --check=integrity
node scripts/ofms-database-tools.js --check=orphans  
node scripts/ofms-database-tools.js --check=math
node scripts/ofms-database-tools.js --check=constraints

# Database auditing
node scripts/ofms-database-tools.js --audit=full --report=detailed

# Backup and restore
node scripts/ofms-database-tools.js --backup=my-backup.sql
node scripts/ofms-database-tools.js --restore=my-backup.sql
```

**Check Types**:
- `all` - Run all database checks
- `integrity` - Check referential integrity  
- `orphans` - Check for orphaned records
- `math` - Check mathematical accuracy
- `constraints` - Check database constraints

---

#### `ofms-quality-checker.js` - Quality Assurance
**Purpose**: Code quality, style compliance, and documentation checks

**Commands**:
```bash
# Run all quality checks
node scripts/ofms-quality-checker.js --check=all

# Specific checks
node scripts/ofms-quality-checker.js --check=css
node scripts/ofms-quality-checker.js --check=docs
node scripts/ofms-quality-checker.js --check=styles
node scripts/ofms-quality-checker.js --check=code

# Auto-fix issues where possible
node scripts/ofms-quality-checker.js --check=all --fix

# Generate detailed report
node scripts/ofms-quality-checker.js --check=all --report=detailed
```

---

### System Health

#### `check-system-integrity.js` - System Health Verification
**Purpose**: Comprehensive system health and integrity verification

**Usage**:
```bash
node scripts/check-system-integrity.js
```

**Checks Performed**:
- Farm-user associations
- Orphaned records detection
- Database integrity
- Multi-tenant isolation
- Business logic validation

---

### Utility Tools

#### `ofms-utilities.js` - General Utilities
**Purpose**: Favicon management and helper utilities (delegates to existing scripts)

**Commands**:
```bash
# Check favicon files and references
node scripts/ofms-utilities.js check-favicon

# Generate favicon assets and update manifest
node scripts/ofms-utilities.js generate-favicon

# Restore predefined users (legacy helper)
node scripts/ofms-utilities.js restore-users
```

## 🚀 Development Workflow Scripts

### Shell Scripts for Development

#### `dev-instances.sh` - Development & Testing Workflow
**Purpose**: Complete development and testing workflow management

**Commands**:
```bash
# Development server (port 3005)
./scripts/dev-instances.sh dev

# Deploy for testing (port 7035)  
./scripts/dev-instances.sh deploy
./scripts/dev-instances.sh deploy:clean

# Deploy from stable branch
./scripts/dev-instances.sh deploy:clean:git

# Deploy specific commit
./scripts/dev-instances.sh deploy:commit abc123

# Production deployment
./scripts/dev-instances.sh deploy:prod

# Data operations
./scripts/dev-instances.sh seed
./scripts/dev-instances.sh seed:comprehensive

# System operations
./scripts/dev-instances.sh check:health
./scripts/dev-instances.sh backup
./scripts/dev-instances.sh audit

# Instance management
./scripts/dev-instances.sh status
./scripts/dev-instances.sh stop
```

**Development URLs**:
- Development: http://localhost:3005 (Hot reload)
- Testing: http://localhost:7035 (Production build)

---

#### `db-setup.sh` - Database Setup
**Purpose**: Environment-specific database setup and configuration

**Usage**:
```bash
# Setup development database
./scripts/db-setup.sh development

# Setup test database  
./scripts/db-setup.sh test

# Reset and setup
./scripts/db-setup.sh development reset

# Setup production database
./scripts/db-setup.sh production
```

**Features**:
- Environment-specific configuration
- Schema migrations
- Prisma client generation
- Database seeding
- Connection verification

---

#### `db-clone.sh` - Database Cloning  
**Purpose**: Clone databases for testing and development

**Usage**:
```bash
# Clone dev database to test database
./scripts/db-clone.sh farmer_microgreens_dev farmer_microgreens_test

# Clone with custom parameters
DB_HOST=localhost DB_USER=postgres ./scripts/db-clone.sh source_db target_db
```

**Safety Features**:
- Confirmation prompts
- Row count verification  
- Backup and restore validation
- Transaction rollback on failure

## 📁 Database Schema Scripts

### SQL Schema Files

#### `create-growing-environments-schema.sql`
**Purpose**: Complete growing environments schema for organic crop management

**Features**:
- Physical environment specifications
- Environmental controls and monitoring
- Organic compliance tracking
- Multi-tenant support

#### `complete_safe_seed_restoration.sql`
**Purpose**: Comprehensive seed varieties data restoration

**Contains**:
- 37 seed varieties for Curry Island farm
- 55 seed varieties for Shared Oxygen farm
- Complete organic certification data
- USDA compliance information

#### `backup_before_multi_tenant.sql`
**Purpose**: Backup reference before multi-tenant implementation

## 🗂️ Archive Directory

The `archive/` directory contains scripts that have been superseded by consolidated tools:

- Legacy seeder scripts (15 files)
- Duplicate restoration scripts  
- Individual utility scripts
- Test-specific seeders

See `archive/README.md` for detailed information about archived scripts.

## 🔧 Support Scripts

### `cleanup-scripts.js` - Cleanup Tool
**Purpose**: Implements the consolidation plan from the audit report

**Commands**:
```bash
# Dry run cleanup
node scripts/cleanup-scripts.js --dry-run

# Execute cleanup
node scripts/cleanup-scripts.js

# Force cleanup without prompts
node scripts/cleanup-scripts.js --force
```

## 📊 Migration Information

### From Legacy Scripts

If you're migrating from legacy scripts, consult `MIGRATION_GUIDE.md` for command mappings:

- `complete-system-admin-setup.js` → `ofms-admin-tools.js setup`
- `ofms-data-seeder.js` → `ofms-data-manager.js seed`
- `fix-curry-island-users.js` → `ofms-admin-tools.js fix-users`
- `check-favicon.js` → `ofms-utilities.js check-favicon`

## 🎯 Best Practices

### Development Workflow
1. **Development**: Use `./scripts/dev-instances.sh dev` (port 3005)
2. **Build Once**: `npm run build`
3. **Test Deploy**: `./scripts/dev-instances.sh deploy:clean` (port 7035)
4. **System Check**: `node scripts/ofms-admin-tools.js verify`

### Data Management
1. **Setup**: `node scripts/ofms-admin-tools.js setup`
2. **Seed Demo**: `node scripts/ofms-data-manager.js seed --mode=demo`
3. **Health Check**: `node scripts/ofms-database-tools.js --check=all`

### Quality Assurance
1. **Pre-commit**: `node scripts/ofms-quality-checker.js --check=all`
2. **Database Check**: `node scripts/ofms-database-tools.js --check=integrity`
3. **System Audit**: `node scripts/ofms-database-tools.js --audit=full`

## ❓ Getting Help

All consolidated scripts support detailed help:

```bash
node scripts/ofms-admin-tools.js --help
node scripts/ofms-database-tools.js --help  
node scripts/ofms-quality-checker.js --help
./scripts/dev-instances.sh                    # Shows usage
```

## 🐛 Troubleshooting

### Common Issues

#### "Admin user already exists"
```bash
# Force recreate admin
node scripts/ofms-admin-tools.js create-admin --force
```

#### "Database connection failed"  
```bash
# Verify database setup
./scripts/db-setup.sh development
node scripts/ofms-admin-tools.js verify
```

#### "Orphaned users detected"
```bash
# Fix user associations
node scripts/ofms-admin-tools.js fix-users --farm-id=YOUR_FARM_ID
```

#### "System integrity issues"
```bash
# Full system check and repair
node scripts/ofms-admin-tools.js verify
node scripts/ofms-database-tools.js --check=all --fix
```

### Debug Mode

Enable verbose output for any script:
```bash
node scripts/script-name.js --verbose
```

Enable dry-run mode to see what would happen:
```bash
node scripts/script-name.js --dry-run
```

---

**📅 Last Updated**: December 2024  
**📊 Script Count**: 12 consolidated tools (reduced from 37)  
**✅ Audit Status**: Complete  
**🎯 Recommendation**: All scripts ready for production use
