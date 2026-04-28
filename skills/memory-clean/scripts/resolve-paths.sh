#!/usr/bin/env bash
# resolve-paths.sh <key>  (memory-clean skill-local copy)
# Keys: memory_dir | session_history_glob
# See memory-update/scripts/resolve-paths.sh for full commentary.
set -euo pipefail

KEY="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ -z "$KEY" ]]; then
  printf 'Usage: resolve-paths.sh <memory_dir|session_history_glob>\n' >&2; exit 1
fi

_has_control_chars() { printf '%s' "$1" | LC_ALL=C /usr/bin/grep -q '[[:cntrl:]]'; }

_validate_memory_dir() {
  local val="$1"
  case "$val" in *'`'*|*'$'*|*'\'*) printf 'ERROR: memory_dir has forbidden char: %s\n' "$val" >&2; exit 1 ;; esac
  _has_control_chars "$val" && { printf 'ERROR: memory_dir has control byte\n' >&2; exit 1; } || true
}

_validate_session_glob() {
  local val="$1"
  case "$val" in
    *'`'*|*'$'*|*'\'*) printf 'ERROR: session_history_glob has forbidden char: %s\n' "$val" >&2; exit 1 ;;
    # Whitespace ban is intentional: callers expand $SESSION_HISTORY_GLOB unquoted
    # (for f in $SESSION_HISTORY_GLOB) which word-splits on IFS — spaces corrupt the glob.
    # Users with spaces in their path must symlink to a no-space alias.
    *' '*|*'	'*) printf 'ERROR: session_history_glob has whitespace (word-split unsafe for unquoted glob expansion). Symlink the path to a no-space alias.\n' >&2; exit 1 ;;
  esac
  _has_control_chars "$val" && { printf 'ERROR: session_history_glob has control byte\n' >&2; exit 1; } || true
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
    if [[ -n "${SESSION_HISTORY_GLOB:-}" ]]; then
      _validate_session_glob "$SESSION_HISTORY_GLOB"; printf '%s\n' "$SESSION_HISTORY_GLOB"
    else
      ENCODED=$("$SCRIPT_DIR/encode-memory-path.sh")
      GLOB="${ENCODED%/memory}/*.jsonl"
      _validate_session_glob "$GLOB"; printf '%s\n' "$GLOB"
    fi ;;
  *) printf 'ERROR: unknown key %s\n' "$KEY" >&2; exit 1 ;;
esac
