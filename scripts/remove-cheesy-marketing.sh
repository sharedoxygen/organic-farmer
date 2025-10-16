#!/bin/bash

# Remove promotional/cheesy marketing language from documentation

set -e

echo "🧹 Removing Promotional Language from Documentation"
echo "=================================================="
echo ""

# Only process public docs, not private
FILES=(
  "README.md"
  "README_NEW.md"
  "docs/README.md"
  "docs/OVERVIEW.md"
  "docs/INSTALLATION.md"
  "docs/SETUP.md"
  "docs/ARCHITECTURE.md"
  "docs/API.md"
  "docs/SECURITY.md"
  "docs/SYSTEM_OVERVIEW.md"
  "docs/CHANGELOG.md"
  "docs/guides/ADMIN_GUIDE.md"
  "docs/features/DOCUMENT_MANAGEMENT.md"
  "CONTRIBUTING.md"
)

echo "Processing public documentation files..."
echo ""

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Create backup
    cp "$file" "$file.bak"
    
    # Remove promotional phrases
    sed -i '' \
      -e 's/production[- ]ready//gI' \
      -e 's/production-ready//gI' \
      -e 's/enterprise[- ]grade//gI' \
      -e 's/enterprise-grade//gI' \
      -e 's/enterprise[- ]ready//gI' \
      -e 's/battle[- ]tested//gI' \
      -e 's/industry[- ]leading//gI' \
      -e 's/world[- ]class//gI' \
      -e 's/cutting[- ]edge//gI' \
      -e 's/state[- ]of[- ]the[- ]art//gI' \
      -e 's/bulletproof//gI' \
      -e 's/bank[- ]level//gI' \
      -e 's/military[- ]grade//gI' \
      "$file"
    
    # Clean up double spaces and empty bullets
    sed -i '' \
      -e 's/  */ /g' \
      -e 's/• •/•/g' \
      -e 's/\*\*  \*\*/\*\*/g' \
      "$file"
    
    # Remove backup if file changed
    if ! diff -q "$file" "$file.bak" > /dev/null 2>&1; then
      echo "  ✓ Cleaned: $file"
      rm "$file.bak"
    else
      rm "$file.bak"
    fi
  fi
done

echo ""
echo "✅ Promotional language removed from public docs"
echo ""
echo "Note: Private docs in private/ were not modified"
echo ""
