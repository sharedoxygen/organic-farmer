#!/bin/bash
# Purge known leaked credentials from git history (destructive — rewrites all commits).
#
# Usage:
#   OFMS_CONFIRM_HISTORY_REWRITE=yes bash scripts/purge-secrets-from-history.sh
#
# After success, force-push all branches and tags; all collaborators must re-clone.
# Rotate every credential that ever appeared in the repo.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [[ "${OFMS_CONFIRM_HISTORY_REWRITE:-}" != "yes" ]]; then
  echo -e "${RED}Aborted.${NC} Set OFMS_CONFIRM_HISTORY_REWRITE=yes to run."
  echo "This rewrites git history. Back up first; force-push required after."
  exit 1
fi

if ! command -v git-filter-repo &>/dev/null; then
  echo "Install git-filter-repo: brew install git-filter-repo"
  exit 1
fi

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"

BACKUP_DIR="$(dirname "$ROOT")/ofms-git-backup-$(date +%Y%m%d-%H%M%S)"
echo -e "${YELLOW}Creating mirror backup at ${BACKUP_DIR}${NC}"
git clone --mirror . "$BACKUP_DIR"

rm -rf .git/filter-repo

REPLACEMENTS="$(mktemp)"
cat > "$REPLACEMENTS" <<'EOF'
postgres-cbr!000Rr==>REDACTED_DB_PASSWORD
ofmsadmin123==>REDACTED_TEST_PASSWORD
curryislandadmin123!==>REDACTED_SHOWCASE_PASSWORD
manager123==>REDACTED_TEST_PASSWORD
worker123==>REDACTED_TEST_PASSWORD
admin123==>REDACTED_TEST_PASSWORD
lead123==>REDACTED_TEST_PASSWORD
grower123==>REDACTED_TEST_PASSWORD
member123==>REDACTED_TEST_PASSWORD
specialist123==>REDACTED_TEST_PASSWORD
harvest123==>REDACTED_TEST_PASSWORD
EOF

echo -e "${YELLOW}Purging sensitive paths and replacing leaked strings (single pass)...${NC}"
git filter-repo --force \
  --invert-paths \
  --path backups/ \
  --path private/ \
  --path-glob '.env' \
  --path-glob '.env.local' \
  --path-glob '.env.production' \
  --replace-text "$REPLACEMENTS"

rm -f "$REPLACEMENTS"

if [[ -n "$REMOTE_URL" ]]; then
  git remote add origin "$REMOTE_URL" 2>/dev/null || git remote set-url origin "$REMOTE_URL"
  echo -e "${GREEN}✓ Restored origin remote${NC}"
fi

echo -e "${YELLOW}Verifying history...${NC}"
FOUND=0
for needle in postgres-cbr ofmsadmin123 curryislandadmin123; do
  if git log --all -S "$needle" --oneline 2>/dev/null | grep -q .; then
    echo -e "${RED}✗ Still found: $needle${NC}"
    FOUND=1
  fi
done

if [[ $FOUND -eq 0 ]]; then
  echo -e "${GREEN}✓ Known credential strings purged from history${NC}"
else
  echo -e "${YELLOW}⚠ Some strings may remain — review with: git log --all -S '<string>'${NC}"
fi

echo ""
echo -e "${GREEN}History rewrite complete.${NC}"
echo "Backup mirror: $BACKUP_DIR"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. npm run security:scan"
echo "  2. git push origin --force --all"
echo "  3. git push origin --force --tags"
echo "  4. Rotate all exposed credentials (DB, showcase users, demo accounts)"
echo "  5. Tell collaborators to delete local clones and re-clone"
