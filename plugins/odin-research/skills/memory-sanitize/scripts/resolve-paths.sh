#!/usr/bin/env bash
# resolve-paths.sh <key>  (memory-sanitize skill-local copy)
# Keys: memory_dir
# (session_history_glob is intentionally not supported — memory-sanitize is memory-dir-only)
# See memory-update/scripts/resolve-paths.sh for full commentary.
set -euo pipefail

KEY="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ -z "$KEY" ]]; then
  printf 'Usage: resolve-paths.sh <memory_dir>\n' >&2; exit 1
fi

_has_control_chars() { printf '%s' "$1" | LC_ALL=C /usr/bin/grep -q '[[:cntrl:]]'; }

_validate_memory_dir() {
  local val="$1"
  case "$val" in *'`'*|*'$'*|*'\'*) printf 'ERROR: memory_dir has forbidden char: %s\n' "$val" >&2; exit 1 ;; esac
  _has_control_chars "$val" && { printf 'ERROR: memory_dir has control byte\n' >&2; exit 1; } || true
}

case "$KEY" in
  memory_dir)
    if [[ -n "${MEMORY_DIR:-}" ]]; then
      _validate_memory_dir "$MEMORY_DIR"; printf '%s\n' "$MEMORY_DIR"
    else
      ENCODED=$("$SCRIPT_DIR/encode-memory-path.sh")
      _validate_memory_dir "$ENCODED"
      [[ -d "$ENCODED" ]] || { printf 'ERROR: memory dir missing: %s\nSet MEMORY_DIR to override.\n' "$ENCODED" >&2; exit 1; }
      printf '%s\n' "$ENCODED"
    fi ;;
  session_history_glob)
    printf 'ERROR: memory-sanitize does not consume session history. Use memory_dir key only.\n' >&2; exit 1 ;;
  *) printf 'ERROR: unknown key %s\n' "$KEY" >&2; exit 1 ;;
esac
