#!/usr/bin/env bash
# resolve-paths.sh <key>
# Per-key path resolver. Emits one value to stdout; diagnostics go to stderr.
# Keys: memory_dir | session_history_glob
#
# Resolution order:
#   1. Env var override (MEMORY_DIR or SESSION_HISTORY_GLOB)
#   2. Claude-Code default (derived from pwd via encode-memory-path.sh)
#
# Validation (POSIX-safe, no grep -P):
#   memory_dir           -- rejects shell-control chars: backtick, $, \, control bytes
#   session_history_glob -- same, plus rejects whitespace (unsafe with unquoted glob expansion)
#
# Exit non-zero with a clear error if resolution or validation fails.
set -euo pipefail

KEY="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ -z "$KEY" ]]; then
  printf 'Usage: resolve-paths.sh <memory_dir|session_history_glob>\n' >&2
  exit 1
fi

# Returns 0 (true) if val contains a forbidden shell-control character.
_has_control_chars() {
  printf '%s' "$1" | LC_ALL=C grep -q '[[:cntrl:]]'
}

_validate_memory_dir() {
  local val="$1"
  case "$val" in
    *'`'* | *'$'* | *'\'*)
      printf 'ERROR: memory_dir contains forbidden shell-control character: %s\n' "$val" >&2
      exit 1 ;;
  esac
  if _has_control_chars "$val"; then
    printf 'ERROR: memory_dir contains control bytes: %s\n' "$val" >&2
    exit 1
  fi
}

_validate_session_glob() {
  local val="$1"
  case "$val" in
    *'`'* | *'$'* | *'\'*)
      printf 'ERROR: session_history_glob contains forbidden shell-control character: %s\n' "$val" >&2
      exit 1 ;;
    *' '* | *'	'*)   # space and literal tab
      printf 'ERROR: session_history_glob contains whitespace — word-splitting unsafe for unquoted glob expansion.\n' >&2
      printf 'Tip: symlink the path to a no-space alias and point SESSION_HISTORY_GLOB at the alias.\n' >&2
      exit 1 ;;
  esac
  if _has_control_chars "$val"; then
    printf 'ERROR: session_history_glob contains control bytes: %s\n' "$val" >&2
    exit 1
  fi
}

case "$KEY" in
  memory_dir)
    if [[ -n "${MEMORY_DIR:-}" ]]; then
      _validate_memory_dir "$MEMORY_DIR"
      printf '%s\n' "$MEMORY_DIR"
    else
      ENCODED=$("$SCRIPT_DIR/encode-memory-path.sh")
      _validate_memory_dir "$ENCODED"
      if [[ ! -d "$ENCODED" ]]; then
        printf 'ERROR: memory dir does not exist: %s\n' "$ENCODED" >&2
        printf 'Set MEMORY_DIR env var to override, or ensure Claude Code has initialized this project.\n' >&2
        exit 1
      fi
      printf '%s\n' "$ENCODED"
    fi
    ;;
  session_history_glob)
    if [[ -n "${SESSION_HISTORY_GLOB:-}" ]]; then
      _validate_session_glob "$SESSION_HISTORY_GLOB"
      printf '%s\n' "$SESSION_HISTORY_GLOB"
    else
      ENCODED=$("$SCRIPT_DIR/encode-memory-path.sh")
      PROJECT_DIR="${ENCODED%/memory}"
      GLOB="$PROJECT_DIR/*.jsonl"
      _validate_session_glob "$GLOB"
      printf '%s\n' "$GLOB"
    fi
    ;;
  *)
    printf 'ERROR: unknown key %s — must be memory_dir or session_history_glob\n' "$KEY" >&2
    exit 1
    ;;
esac
