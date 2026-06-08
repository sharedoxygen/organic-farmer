#!/bin/bash

# OFMS Open Source Sanitization Script
# Replaces hardcoded credentials with environment-variable references.
# Prefer: npm run security:scan (read-only audit)

set -e

echo "🔒 OFMS Open Source Sanitization Script"
echo "========================================"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKUP_DIR="backups/pre-sanitization-$(date +%Y%m%d-%H%M%S)"

echo -e "${YELLOW}Creating backup...${NC}"
mkdir -p "$BACKUP_DIR"

FILES_TO_SANITIZE=(
  "scripts/ofms-sql-data-seeder.js"
  "scripts/ofms-data-seeder.js"
  "scripts/test-seeder.js"
  "scripts/ofms-real-data-seeder.js"
  "automation/real-crud-test.js"
  "automation/ofms-data-entry-original.js"
  "automation/ofms-data-entry-fixed.js"
  "automation/ofms-data-entry.js"
  "automation/ofms-data-entry-backup.js"
  "automation/ofms-fixed-demo.js"
  "automation/lib/auth-helper.js"
  "automation/fixtures/test-data.json"
  "scripts/ofms-data-generator.js"
  "scripts/ofms-admin-tools.js"
  "scripts/reset-kinkead-password.js"
  "scripts/check-kinkead-user.js"
  "scripts/ensure-showcase-org.ts"
  "scripts/set-db-env.sh"
)

for file in "${FILES_TO_SANITIZE[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "$BACKUP_DIR/"
    echo "  ✓ Backed up: $file"
  fi
done

echo ""
echo -e "${YELLOW}Sanitizing files...${NC}"
echo ""

echo "1. Removing database credentials..."
for file in "${FILES_TO_SANITIZE[@]}"; do
  if [ -f "$file" ]; then
    sed -i.bak "s|postgresql://postgres:REDACTED_DB_PASSWORD@localhost:[0-9]*/[a-z_]*|process.env.DATABASE_URL \|\| 'postgresql://username:password@localhost:5432/database'|g" "$file"
    sed -i.bak "s|postgresql://postgres:REDACTED_DB_PASSWORD@localhost:[0-9]*/[a-z_]*|process.env.DATABASE_URL \|\| 'postgresql://username:password@localhost:5432/database'|g" "$file"
    rm -f "$file.bak"
    echo "  ✓ Sanitized DB URLs: $file"
  fi
done

echo ""
echo "2. Removing test/demo passwords..."
for file in "${FILES_TO_SANITIZE[@]}"; do
  if [ -f "$file" ]; then
    sed -i.bak "s/REDACTED_TEST_PASSWORD/process.env.TEST_ADMIN_PASSWORD || 'test_password'/g" "$file"
    sed -i.bak "s/REDACTED_TEST_PASSWORD/process.env.TEST_MANAGER_PASSWORD || 'test_password'/g" "$file"
    sed -i.bak "s/REDACTED_TEST_PASSWORD/process.env.TEST_WORKER_PASSWORD || 'test_password'/g" "$file"
    sed -i.bak "s/REDACTED_TEST_PASSWORD/process.env.TEST_ADMIN_PASSWORD || 'test_password'/g" "$file"
    sed -i.bak "s/REDACTED_TEST_PASSWORD/process.env.TEST_LEAD_PASSWORD || 'test_password'/g" "$file"
    sed -i.bak "s/REDACTED_TEST_PASSWORD/process.env.TEST_WORKER_PASSWORD || 'test_password'/g" "$file"
    sed -i.bak "s/REDACTED_TEST_PASSWORD/process.env.TEST_WORKER_PASSWORD || 'test_password'/g" "$file"
    sed -i.bak "s/REDACTED_TEST_PASSWORD/process.env.TEST_WORKER_PASSWORD || 'test_password'/g" "$file"
    sed -i.bak "s/REDACTED_TEST_PASSWORD/process.env.TEST_WORKER_PASSWORD || 'test_password'/g" "$file"
    sed -i.bak "s/REDACTED_SHOWCASE_PASSWORD/process.env.SHOWCASE_CURRY_PASSWORD || process.env.TEST_ADMIN_PASSWORD/g" "$file"
    rm -f "$file.bak"
  fi
done

echo ""
echo -e "${GREEN}✅ Sanitization complete!${NC}"
echo ""
echo "Backup location: $BACKUP_DIR (gitignored — do not commit)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. npm run security:scan"
echo "2. Review changes; update .env with real credentials locally"
echo "3. Rotate any credentials that were ever committed"
echo "4. For git history cleanup: bash scripts/clean-git-history.sh"
echo ""
