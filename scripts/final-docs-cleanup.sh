#!/bin/bash

# Final Documentation Cleanup
# Remove empty folders and move internal docs

set -e

echo "🧹 Final Documentation Cleanup"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Remove empty folders
echo -e "${YELLOW}Removing empty folders...${NC}"

if [ -d "docs/api" ] && [ -z "$(ls -A docs/api)" ]; then
  rmdir docs/api
  echo "  ✓ Removed: docs/api/ (empty)"
fi

if [ -d "docs/deployment" ] && [ -z "$(ls -A docs/deployment)" ]; then
  rmdir docs/deployment
  echo "  ✓ Removed: docs/deployment/ (empty)"
fi

if [ -d "docs/user-guide" ] && [ -z "$(ls -A docs/user-guide)" ]; then
  rmdir docs/user-guide
  echo "  ✓ Removed: docs/user-guide/ (empty)"
fi

echo ""

# Move internal/specific docs to private
echo -e "${YELLOW}Moving internal docs...${NC}"

# Cannabis module (specific feature, may not be public)
if [ -f "docs/features/CANNABIS_MODULE.md" ]; then
  mv docs/features/CANNABIS_MODULE.md private/old-docs/
  echo "  ✓ Moved: CANNABIS_MODULE.md (specific feature)"
fi

# AI use cases (internal planning)
if [ -f "docs/features/AI_USE_CASES.md" ]; then
  mv docs/features/AI_USE_CASES.md private/old-docs/
  echo "  ✓ Moved: AI_USE_CASES.md (internal planning)"
fi

# Demo guide (internal)
if [ -f "docs/guides/DEMO_GUIDE.md" ]; then
  mv docs/guides/DEMO_GUIDE.md private/old-docs/
  echo "  ✓ Moved: DEMO_GUIDE.md (internal demo)"
fi

# Help system (internal implementation)
if [ -f "docs/guides/HELP_SYSTEM.md" ]; then
  mv docs/guides/HELP_SYSTEM.md private/old-docs/
  echo "  ✓ Moved: HELP_SYSTEM.md (implementation details)"
fi

# Operations guide (internal)
if [ -f "docs/guides/OPERATIONS.md" ]; then
  mv docs/guides/OPERATIONS.md private/old-docs/
  echo "  ✓ Moved: OPERATIONS.md (internal operations)"
fi

# Kinkead login fix (specific bug fix)
if [ -f "docs/troubleshooting/KINKEAD_LOGIN_FIX.md" ]; then
  mv docs/troubleshooting/KINKEAD_LOGIN_FIX.md private/bug-fixes/
  echo "  ✓ Moved: KINKEAD_LOGIN_FIX.md (specific bug fix)"
fi

echo ""

# Remove now-empty folders
echo -e "${YELLOW}Removing now-empty folders...${NC}"

if [ -d "docs/features" ] && [ -z "$(ls -A docs/features)" ]; then
  rmdir docs/features
  echo "  ✓ Removed: docs/features/ (empty)"
fi

if [ -d "docs/guides" ] && [ -z "$(ls -A docs/guides)" ]; then
  rmdir docs/guides
  echo "  ✓ Removed: docs/guides/ (empty)"
fi

if [ -d "docs/troubleshooting" ] && [ -z "$(ls -A docs/troubleshooting)" ]; then
  rmdir docs/troubleshooting
  echo "  ✓ Removed: docs/troubleshooting/ (empty)"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Final cleanup complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo -e "${YELLOW}Remaining in docs/:${NC}"
ls -1 docs/
echo ""

echo -e "${YELLOW}Summary:${NC}"
echo "  • Removed empty folders"
echo "  • Moved internal docs to private/"
echo "  • docs/ now contains only essential user-facing files"
echo ""
