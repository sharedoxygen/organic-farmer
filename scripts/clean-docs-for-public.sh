#!/bin/bash

# OFMS Documentation Cleanup Script
# Separates user-facing docs from developer/internal docs

set -e

echo "📚 OFMS Documentation Cleanup for Public Release"
echo "================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create backup
BACKUP_DIR="backups/docs-backup-$(date +%Y%m%d-%H%M%S)"
echo -e "${YELLOW}Creating backup...${NC}"
mkdir -p "$BACKUP_DIR"
cp -r docs/ "$BACKUP_DIR/"
cp -r dev-docs/ "$BACKUP_DIR/" 2>/dev/null || true
echo -e "${GREEN}✓ Backup created: $BACKUP_DIR${NC}"
echo ""

# Move dev-docs to private
echo -e "${YELLOW}Moving dev-docs to private...${NC}"
if [ -d "dev-docs" ]; then
  mv dev-docs private/dev-docs
  echo -e "${GREEN}✓ Moved: dev-docs/ → private/dev-docs/${NC}"
else
  echo -e "${BLUE}ℹ dev-docs already moved${NC}"
fi
echo ""

# Move internal/deprecated docs from docs/ to private/
echo -e "${YELLOW}Moving internal docs from docs/ to private...${NC}"

# Create target directory
mkdir -p private/old-docs

# Internal implementation docs
if [ -f "docs/BACK_BUTTON_COMPLETE.md" ]; then
  mv docs/BACK_BUTTON_COMPLETE.md private/old-docs/
  echo "  ✓ Moved: BACK_BUTTON_COMPLETE.md"
fi

if [ -f "docs/BACK_BUTTON_IMPLEMENTATION.md" ]; then
  mv docs/BACK_BUTTON_IMPLEMENTATION.md private/old-docs/
  echo "  ✓ Moved: BACK_BUTTON_IMPLEMENTATION.md"
fi

if [ -f "docs/BRANDING_UPDATES.md" ]; then
  mv docs/BRANDING_UPDATES.md private/old-docs/
  echo "  ✓ Moved: BRANDING_UPDATES.md"
fi

if [ -f "docs/BRANDING.md" ]; then
  mv docs/BRANDING.md private/old-docs/
  echo "  ✓ Moved: BRANDING.md"
fi

if [ -f "docs/PARTY_MODEL_IMPLEMENTATION_SUMMARY.md" ]; then
  mv docs/PARTY_MODEL_IMPLEMENTATION_SUMMARY.md private/old-docs/
  echo "  ✓ Moved: PARTY_MODEL_IMPLEMENTATION_SUMMARY.md"
fi

if [ -f "docs/PARTY_MODEL_MIGRATION.md" ]; then
  mv docs/PARTY_MODEL_MIGRATION.md private/old-docs/
  echo "  ✓ Moved: PARTY_MODEL_MIGRATION.md"
fi

# Market analysis (internal)
if [ -f "docs/MARKET_ANALYSIS.md" ]; then
  mv docs/MARKET_ANALYSIS.md private/old-docs/
  echo "  ✓ Moved: MARKET_ANALYSIS.md"
fi

# Technical architecture diagrams (too detailed for public)
if [ -f "docs/OFMS_COMPLETE_SYSTEM_ARCHITECTURE.md" ]; then
  mv docs/OFMS_COMPLETE_SYSTEM_ARCHITECTURE.md private/old-docs/
  echo "  ✓ Moved: OFMS_COMPLETE_SYSTEM_ARCHITECTURE.md"
fi

if [ -f "docs/OFMS_COMPLIANCE_TECH_ARCH.md" ]; then
  mv docs/OFMS_COMPLIANCE_TECH_ARCH.md private/old-docs/
  echo "  ✓ Moved: OFMS_COMPLIANCE_TECH_ARCH.md"
fi

# Move diagram files
if [ -f "docs/OFMS_COMPLETE_SYSTEM_ARCHITECTURE-1.png" ]; then
  mv docs/OFMS_COMPLETE_SYSTEM_ARCHITECTURE-1.png private/old-docs/
  echo "  ✓ Moved: Architecture diagram (PNG)"
fi

if [ -f "docs/OFMS_COMPLETE_SYSTEM_ARCHITECTURE-1.svg" ]; then
  mv docs/OFMS_COMPLETE_SYSTEM_ARCHITECTURE-1.svg private/old-docs/
  echo "  ✓ Moved: Architecture diagram (SVG)"
fi

if [ -f "docs/OFMS_COMPLIANCE_TECH_ARCH-1.png" ]; then
  mv docs/OFMS_COMPLIANCE_TECH_ARCH-1.png private/old-docs/
  echo "  ✓ Moved: Compliance diagram (PNG)"
fi

if [ -f "docs/OFMS_COMPLIANCE_TECH_ARCH-1.svg" ]; then
  mv docs/OFMS_COMPLIANCE_TECH_ARCH-1.svg private/old-docs/
  echo "  ✓ Moved: Compliance diagram (SVG)"
fi

# Diagram viewer (internal tool)
if [ -f "docs/diagrams-viewer.html" ]; then
  mv docs/diagrams-viewer.html private/old-docs/
  echo "  ✓ Moved: diagrams-viewer.html"
fi

echo ""
echo -e "${GREEN}✓ Internal docs moved to private/old-docs/${NC}"
echo ""

# Clean up docs/ - keep only user-facing documentation
echo -e "${YELLOW}Organizing user-facing documentation...${NC}"

# Create clean structure
mkdir -p docs/user-guide
mkdir -p docs/api
mkdir -p docs/deployment

# Move technical folder to private (if it exists)
if [ -d "docs/technical" ]; then
  mv docs/technical private/old-docs/
  echo "  ✓ Moved: technical/ folder"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Documentation cleanup complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo -e "${YELLOW}Summary:${NC}"
echo "  • dev-docs moved to: private/dev-docs/"
echo "  • Internal docs moved to: private/old-docs/"
echo "  • User-facing docs remain in: docs/"
echo "  • Backup created: $BACKUP_DIR"
echo ""

echo -e "${YELLOW}Remaining in docs/ (user-facing):${NC}"
ls -1 docs/*.md 2>/dev/null | sed 's/^/  • /'
echo ""

echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review docs/ for any remaining internal docs"
echo "  2. Create missing user guides"
echo "  3. Update docs/README.md as index"
echo "  4. Add screenshots to docs/"
echo ""

echo -e "${RED}⚠️  IMPORTANT:${NC}"
echo "  • Review docs/ manually before committing"
echo "  • Ensure all private docs are in private/"
echo "  • Update links in public documentation"
echo ""
