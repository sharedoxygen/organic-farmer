#!/bin/bash

# Set "Last Updated" to current date

CURRENT_DATE="2025-10-11"

FILES=(
  "docs/README.md"
  "docs/OVERVIEW.md"
  "docs/SYSTEM_OVERVIEW.md"
  "docs/CHANGELOG.md"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    sed -i '' "s/\*\*Last Updated\*\*:.*/\*\*Last Updated\*\*: ${CURRENT_DATE}/g" "$file"
    echo "  ✓ Set date in: $file"
  fi
done

echo ""
echo "✅ Last Updated dates set to: ${CURRENT_DATE}"
