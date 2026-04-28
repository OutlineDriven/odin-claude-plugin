#!/usr/bin/env bash
# compose-gitignore.sh <csv-keys>
# Fetches gitignore.io template for the given comma-separated key list,
# prints the result to stdout. Exits non-zero on network failure.
set -euo pipefail

CSV="${1:-}"
API="https://www.toptal.com/developers/gitignore/api"

if [[ -z "$CSV" ]]; then
  # No keys detected — output nothing (bundled blocks still apply)
  exit 0
fi

RESPONSE=$(curl -sf --max-time 10 "$API/$CSV") || {
  printf 'ERROR: gitignore.io unreachable for keys: %s\n' "$CSV" >&2
  exit 1
}
printf '%s\n' "$RESPONSE"
