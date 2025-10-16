#!/bin/bash

# Clean up unnecessary documents from project root

set -e

echo "🧹 Cleaning Up Project Root"
echo "==========================="
echo ""

# Documents that should stay at root (essential for open source)
KEEP_DOCS=(
  "README.md"
  "LICENSE"
  "CONTRIBUTING.md"
  "CODE_OF_CONDUCT.md"
)

# Move status/summary docs to private
echo "Moving status documents to private/..."

# Status documents
if [ -f "DOCS_CLEANUP_COMPLETE.md" ]; then
  mv DOCS_CLEANUP_COMPLETE.md private/internal-processes/
  echo "  ✓ Moved: DOCS_CLEANUP_COMPLETE.md"
fi

if [ -f "DOCS_UPDATED_CURRENT.md" ]; then
  mv DOCS_UPDATED_CURRENT.md private/internal-processes/
  echo "  ✓ Moved: DOCS_UPDATED_CURRENT.md"
fi

if [ -f "DOCUMENTATION_COMPLETE.md" ]; then
  mv DOCUMENTATION_COMPLETE.md private/internal-processes/
  echo "  ✓ Moved: DOCUMENTATION_COMPLETE.md"
fi

if [ -f "OPEN_SOURCE_READY.md" ]; then
  mv OPEN_SOURCE_READY.md private/internal-processes/
  echo "  ✓ Moved: OPEN_SOURCE_READY.md"
fi

# Implementation docs
if [ -f "ROLE_ASSIGNMENT_SECURITY.md" ]; then
  mv ROLE_ASSIGNMENT_SECURITY.md private/development-notes/
  echo "  ✓ Moved: ROLE_ASSIGNMENT_SECURITY.md"
fi

# Remove duplicate README
if [ -f "README_NEW.md" ]; then
  rm README_NEW.md
  echo "  ✓ Removed: README_NEW.md (duplicate)"
fi

echo ""
echo "✅ Root cleanup complete!"
echo ""
echo "Remaining at root:"
ls -1 *.md 2>/dev/null || echo "  (none)"
echo ""
echo "Should only have:"
echo "  • README.md"
echo "  • CONTRIBUTING.md"
echo "  • CODE_OF_CONDUCT.md"
echo ""
