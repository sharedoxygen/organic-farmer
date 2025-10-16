#!/bin/bash

# OFMS Open Source Sanitization Script
# This script removes hardcoded credentials from the codebase

set -e

echo "🔒 OFMS Open Source Sanitization Script"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backup directory
BACKUP_DIR="backups/pre-sanitization-$(date +%Y%m%d-%H%M%S)"

echo -e "${YELLOW}Creating backup...${NC}"
mkdir -p "$BACKUP_DIR"

# Files to sanitize
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
)

# Backup files
for file in "${FILES_TO_SANITIZE[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "$BACKUP_DIR/"
    echo "  ✓ Backed up: $file"
  fi
done

echo ""
echo -e "${YELLOW}Sanitizing files...${NC}"
echo ""

# Replace database credentials
echo "1. Removing database credentials..."
for file in "${FILES_TO_SANITIZE[@]}"; do
  if [ -f "$file" ]; then
    # Replace hardcoded database URLs with environment variable
    sed -i.bak "s|postgresql://postgres:REDACTED_DB_PASSWORD@localhost:[0-9]*/[a-z_]*|process.env.DATABASE_URL \|\| 'postgresql://username:password@localhost:5432/database'|g" "$file"
    rm -f "$file.bak"
    echo "  ✓ Sanitized: $file"
  fi
done

# Replace test passwords
echo ""
echo "2. Removing test passwords..."
for file in "${FILES_TO_SANITIZE[@]}"; do
  if [ -f "$file" ]; then
    # Replace specific passwords
    sed -i.bak "s/REDACTED_TEST_PASSWORD/process.env.TEST_ADMIN_PASSWORD || 'test_password'/g" "$file"
    sed -i.bak "s/REDACTED_TEST_PASSWORD/process.env.TEST_MANAGER_PASSWORD || 'test_password'/g" "$file"
    sed -i.bak "s/REDACTED_TEST_PASSWORD/process.env.TEST_WORKER_PASSWORD || 'test_password'/g" "$file"
    sed -i.bak "s/REDACTED_TEST_PASSWORD/process.env.TEST_ADMIN_PASSWORD || 'test_password'/g" "$file"
    sed -i.bak "s/REDACTED_TEST_PASSWORD/process.env.TEST_LEAD_PASSWORD || 'test_password'/g" "$file"
    rm -f "$file.bak"
  fi
done

echo ""
echo -e "${GREEN}✅ Sanitization complete!${NC}"
echo ""
echo "Backup location: $BACKUP_DIR"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the changes in the sanitized files"
echo "2. Update .env with your actual credentials"
echo "3. Test the application to ensure it still works"
echo "4. Clean git history before open sourcing"
echo ""
echo -e "${RED}⚠️  IMPORTANT:${NC}"
echo "- Change all real passwords immediately"
echo "- Review all files manually before committing"
echo "- Run git history cleanup before open sourcing"
echo ""
