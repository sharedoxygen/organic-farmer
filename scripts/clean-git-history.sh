#!/bin/bash
# Deprecated — use scripts/purge-secrets-from-history.sh instead.
exec bash "$(dirname "$0")/purge-secrets-from-history.sh" "$@"
