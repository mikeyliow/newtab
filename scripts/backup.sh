#!/usr/bin/env bash
# Nightly backup: export the live DB as JSON into mkyos and commit it.
# Usage: NEWTAB_URL=https://<railway-domain> MCP_KEY=<key> ./scripts/backup.sh [target-file]
set -euo pipefail

TARGET="${1:-$HOME/mkyos/newtab-backup.json}"
: "${NEWTAB_URL:?set NEWTAB_URL to the deployed base url}"
: "${MCP_KEY:?set MCP_KEY to the bearer key}"

curl -fsS "$NEWTAB_URL/api/export" -H "Authorization: Bearer $MCP_KEY" -o "$TARGET"

cd "$(dirname "$TARGET")"
git add "$(basename "$TARGET")"
git diff --cached --quiet || git commit -m "newtab backup $(date +%F)"
echo "backed up to $TARGET"
