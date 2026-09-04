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

_has_control_chars() {
  printf '%s' "$1" | LC_ALL=C grep -q '[[:cntrl:]]'
}

# Shell-safety rules shared by both keys. A key whose value is expanded as an
# unquoted glob also rejects whitespace: pass "reject-whitespace" for it.
_validate_value() {
  local key="$1" val="$2" ws_rule="${3:-any}"
  case "$val" in
    *'`'* | *'$'* | *'\'*)
      printf 'ERROR: %s contains forbidden shell-control character: %s\n' "$key" "$val" >&2
      exit 1 ;;
  esac
  if [[ "$ws_rule" == "reject-whitespace" ]]; then
    case "$val" in
      *' '* | *'	'*)   # space and literal tab
        printf 'ERROR: %s contains whitespace — word-splitting unsafe for unquoted glob expansion.\n' "$key" >&2
        printf 'Tip: symlink the path to a no-space alias and point SESSION_HISTORY_GLOB at the alias.\n' >&2
        exit 1 ;;
    esac
  fi
  if _has_control_chars "$val"; then
    printf 'ERROR: %s contains control bytes: %s\n' "$key" "$val" >&2
    exit 1
  fi
}

_reject_tracked() {
  local d="$1" probe="$1" root
  while [[ ! -e "$probe" && "$probe" != "/" ]]; do
    probe="$(dirname "$probe")"
  done
  git -C "$probe" rev-parse --is-inside-work-tree >/dev/null 2>&1 || return 0
  root="$(git -C "$probe" rev-parse --show-toplevel)"
  git -C "$root" check-ignore -q "$d" && return 0
  printf 'ERROR: memory dir is tracked by git: %s\n' "$d" >&2
  exit 1
}

case "$KEY" in
  memory_dir)
    if [[ -n "${MEMORY_DIR:-}" ]]; then
      VAL="$MEMORY_DIR"
    else
      VAL="$("$SCRIPT_DIR/encode-memory-path.sh")"
    fi
    _validate_value memory_dir "$VAL"
    # A MEMORY_DIR override is taken as given; only the derived default must already exist.
    if [[ ! -d "$VAL" && -z "${MEMORY_DIR:-}" ]]; then
      printf 'ERROR: memory dir does not exist: %s\n' "$VAL" >&2
      printf 'Set MEMORY_DIR env var to override, or ensure Claude Code has initialized this project.\n' >&2
      exit 1
    fi
    _reject_tracked "$VAL"
    printf '%s\n' "$VAL"
    ;;
  session_history_glob)
    if [[ -n "${SESSION_HISTORY_GLOB:-}" ]]; then
      VAL="$SESSION_HISTORY_GLOB"
    else
      ENCODED="$("$SCRIPT_DIR/encode-memory-path.sh")"
      VAL="${ENCODED%/memory}/*.jsonl"
    fi
    _validate_value session_history_glob "$VAL" reject-whitespace
    printf '%s\n' "$VAL"
    ;;
  *)
    printf 'ERROR: unknown key %s — must be memory_dir or session_history_glob\n' "$KEY" >&2
    exit 1
    ;;
esac
