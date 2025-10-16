#!/bin/bash

# OFMS Documentation Organization Script
# Separates private developer docs from public-facing documentation

set -e

echo "📚 OFMS Documentation Organization Script"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create directory structure
echo -e "${YELLOW}Creating directory structure...${NC}"
mkdir -p private/security-audits
mkdir -p private/development-notes
mkdir -p private/bug-fixes
mkdir -p private/internal-processes
mkdir -p docs/guides
mkdir -p .github/ISSUE_TEMPLATE

echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Move private documents
echo -e "${YELLOW}Moving private documents...${NC}"

# Security audits
if [ -f "SANITIZATION_COMPLETE.md" ]; then
  mv SANITIZATION_COMPLETE.md private/security-audits/
  echo "  ✓ Moved: SANITIZATION_COMPLETE.md"
fi

if [ -f "SECURITY_AUDIT_OPEN_SOURCE.md" ]; then
  mv SECURITY_AUDIT_OPEN_SOURCE.md private/security-audits/
  echo "  ✓ Moved: SECURITY_AUDIT_OPEN_SOURCE.md"
fi

if [ -f "SECURITY_SUMMARY.md" ]; then
  mv SECURITY_SUMMARY.md private/security-audits/
  echo "  ✓ Moved: SECURITY_SUMMARY.md"
fi

# Bug fixes
if [ -f "AI_MODELS_ACCESS_CONTROL_FIX.md" ]; then
  mv AI_MODELS_ACCESS_CONTROL_FIX.md private/bug-fixes/
  echo "  ✓ Moved: AI_MODELS_ACCESS_CONTROL_FIX.md"
fi

if [ -f "BUILD_FIX.md" ]; then
  mv BUILD_FIX.md private/bug-fixes/
  echo "  ✓ Moved: BUILD_FIX.md"
fi

if [ -f "CONNECTED_USERS_FIX.md" ]; then
  mv CONNECTED_USERS_FIX.md private/bug-fixes/
  echo "  ✓ Moved: CONNECTED_USERS_FIX.md"
fi

# Development notes
if [ -f "EDIT_USER_FUNCTIONALITY.md" ]; then
  mv EDIT_USER_FUNCTIONALITY.md private/development-notes/
  echo "  ✓ Moved: EDIT_USER_FUNCTIONALITY.md"
fi

if [ -f "USER_MANAGEMENT_REDESIGN.md" ]; then
  mv USER_MANAGEMENT_REDESIGN.md private/development-notes/
  echo "  ✓ Moved: USER_MANAGEMENT_REDESIGN.md"
fi

if [ -f "BRANDING_COMPLETE.md" ]; then
  mv BRANDING_COMPLETE.md private/development-notes/
  echo "  ✓ Moved: BRANDING_COMPLETE.md"
fi

if [ -f "PARTY_MODEL_QUICKSTART.md" ]; then
  mv PARTY_MODEL_QUICKSTART.md private/development-notes/
  echo "  ✓ Moved: PARTY_MODEL_QUICKSTART.md"
fi

# Internal processes
if [ -f "OPEN_SOURCE_CHECKLIST.md" ]; then
  mv OPEN_SOURCE_CHECKLIST.md private/internal-processes/
  echo "  ✓ Moved: OPEN_SOURCE_CHECKLIST.md"
fi

if [ -f "DOCUMENTATION_AUDIT.md" ]; then
  mv DOCUMENTATION_AUDIT.md private/internal-processes/
  echo "  ✓ Moved: DOCUMENTATION_AUDIT.md"
fi

echo ""
echo -e "${GREEN}✓ Private documents moved${NC}"
echo ""

# Update .gitignore
echo -e "${YELLOW}Updating .gitignore...${NC}"

if ! grep -q "^private/" .gitignore 2>/dev/null; then
  echo "" >> .gitignore
  echo "# Private developer documentation" >> .gitignore
  echo "private/" >> .gitignore
  echo -e "${GREEN}✓ Added private/ to .gitignore${NC}"
else
  echo -e "${BLUE}ℹ private/ already in .gitignore${NC}"
fi

echo ""

# Create README for private directory
cat > private/README.md << 'EOF'
# Private Developer Documentation

This directory contains internal documentation that should NOT be included in the open source release.

## Contents

### security-audits/
- Security audit reports
- Credential sanitization records
- Internal security processes

### development-notes/
- Feature implementation notes
- Design decisions
- Development processes

### bug-fixes/
- Bug fix documentation
- Troubleshooting notes
- Internal issues

### internal-processes/
- Open source preparation
- Documentation organization
- Internal workflows

## ⚠️ IMPORTANT

**DO NOT commit this directory to public repositories!**

This directory is gitignored to prevent accidental exposure of internal information.

## Backup

Keep backups of these documents in a secure location separate from the public repository.
EOF

echo -e "${GREEN}✓ Created private/README.md${NC}"
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Documentation organization complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "  • Private docs moved to: private/"
echo "  • Private directory gitignored"
echo "  • Public docs remain in: docs/"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review docs/ for any sensitive information"
echo "  2. Create missing public documentation"
echo "  3. Update README.md for open source"
echo "  4. Add LICENSE file"
echo "  5. Create CONTRIBUTING.md"
echo ""
echo -e "${RED}⚠️  IMPORTANT:${NC}"
echo "  • Verify private/ is in .gitignore"
echo "  • Review all public docs before committing"
echo "  • Keep backups of private docs separately"
echo ""
