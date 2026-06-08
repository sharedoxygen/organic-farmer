#!/bin/bash

# OFMS Git History Cleanup Script
# Removes sensitive data from git history before open sourcing

set -e

echo "🧹 OFMS Git History Cleanup Script"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Warning
echo -e "${RED}⚠️  WARNING: This script will rewrite git history!${NC}"
echo ""
echo "This will:"
echo "  - Remove all .env files from history"
echo "  - Replace sensitive passwords with REDACTED"
echo "  - Require force push if remote exists"
echo "  - Require all contributors to re-clone"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Check if git-filter-repo is installed
if ! command -v git-filter-repo &> /dev/null; then
    echo -e "${YELLOW}git-filter-repo not found. Installing...${NC}"
    echo ""
    echo "Please install git-filter-repo:"
    echo "  pip install git-filter-repo"
    echo "  or"
    echo "  brew install git-filter-repo"
    echo ""
    exit 1
fi

# Create backup
BACKUP_DIR="../ofms-backup-$(date +%Y%m%d-%H%M%S)"
echo -e "${YELLOW}Creating backup...${NC}"
git clone --mirror . "$BACKUP_DIR"
echo -e "${GREEN}✓ Backup created: $BACKUP_DIR${NC}"
echo ""

# Create replacement file
echo -e "${YELLOW}Creating replacement patterns...${NC}"
cat > /tmp/ofms-replacements.txt << EOF
REDACTED_DB_PASSWORD==>REDACTED_DB_PASSWORD
REDACTED_TEST_PASSWORD==>REDACTED_TEST_PASSWORD
REDACTED_SHOWCASE_PASSWORD==>REDACTED_SHOWCASE_PASSWORD
REDACTED_TEST_PASSWORD==>REDACTED_TEST_PASSWORD
REDACTED_TEST_PASSWORD==>REDACTED_TEST_PASSWORD
REDACTED_TEST_PASSWORD==>REDACTED_TEST_PASSWORD
REDACTED_TEST_PASSWORD==>REDACTED_TEST_PASSWORD
REDACTED_TEST_PASSWORD==>REDACTED_TEST_PASSWORD
REDACTED_TEST_PASSWORD==>REDACTED_TEST_PASSWORD
EOF

echo -e "${GREEN}✓ Replacement patterns created${NC}"
echo ""

# Remove .env files from history
echo -e "${YELLOW}Removing .env files from history...${NC}"
git filter-repo --invert-paths --path-glob '*.env' --force

echo -e "${GREEN}✓ .env files removed${NC}"
echo ""

# Replace sensitive strings
echo -e "${YELLOW}Replacing sensitive strings...${NC}"
git filter-repo --replace-text /tmp/ofms-replacements.txt --force

echo -e "${GREEN}✓ Sensitive strings replaced${NC}"
echo ""

# Clean up
rm -f /tmp/ofms-replacements.txt

# Verify
echo -e "${YELLOW}Verifying cleanup...${NC}"
echo ""

# Check for sensitive patterns
FOUND_ISSUES=0

if git log --all --source --full-history -S "postgres-cbr" | grep -q "postgres-cbr"; then
    echo -e "${RED}✗ Found database password in history${NC}"
    FOUND_ISSUES=1
fi

if git log --all --source --full-history -S "REDACTED_TEST_PASSWORD" | grep -q "REDACTED_TEST_PASSWORD"; then
    echo -e "${RED}✗ Found test password in history${NC}"
    FOUND_ISSUES=1
fi

if [ $FOUND_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ No sensitive data found in history${NC}"
else
    echo -e "${YELLOW}⚠️  Some sensitive data may still exist${NC}"
fi

echo ""
echo -e "${GREEN}✅ Git history cleanup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the changes: git log --oneline"
echo "2. Test the repository thoroughly"
echo "3. If satisfied, force push to remote:"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo -e "${RED}⚠️  IMPORTANT:${NC}"
echo "- All contributors must delete and re-clone the repository"
echo "- Update any CI/CD pipelines"
echo "- Rotate all credentials immediately"
echo "- Backup is at: $BACKUP_DIR"
echo ""
