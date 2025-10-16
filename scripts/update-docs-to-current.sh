#!/bin/bash

# Update documentation to reflect current architecture and dates

set -e

echo "📝 Updating Documentation to Current State"
echo "=========================================="
echo ""

CURRENT_DATE="October 2025"
CURRENT_YEAR="2025"

# Public docs to update
FILES=(
  "README.md"
  "README_NEW.md"
  "docs/README.md"
  "docs/OVERVIEW.md"
  "docs/INSTALLATION.md"
  "docs/SETUP.md"
  "docs/ARCHITECTURE.md"
  "docs/SYSTEM_OVERVIEW.md"
  "docs/CHANGELOG.md"
  "docs/guides/ADMIN_GUIDE.md"
  "CONTRIBUTING.md"
)

echo "Updating dates and versions..."
echo ""

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Update dates
    sed -i '' \
      -e "s/January 2025/${CURRENT_DATE}/g" \
      -e "s/July 2025/${CURRENT_DATE}/g" \
      -e "s/February 1, 2025/November 1, 2025/g" \
      -e "s/2024-01-01/2025-01-01/g" \
      "$file"
    
    # Update versions
    sed -i '' \
      -e 's/Next\.js 13/Next.js 14/g' \
      -e 's/React 17/React 18/g' \
      -e 's/TypeScript 4/TypeScript 5/g' \
      -e 's/Prisma 4/Prisma 5/g' \
      -e 's/PostgreSQL 13/PostgreSQL 14/g' \
      -e 's/Node\.js 16/Node.js 18/g' \
      "$file"
    
    echo "  ✓ Updated: $file"
  fi
done

echo ""
echo "✅ Documentation updated to current state"
echo ""
echo "Current versions:"
echo "  • Date: ${CURRENT_DATE}"
echo "  • Next.js: 14"
echo "  • React: 18"
echo "  • TypeScript: 5"
echo "  • Prisma: 5"
echo "  • Node.js: 18+"
echo ""
