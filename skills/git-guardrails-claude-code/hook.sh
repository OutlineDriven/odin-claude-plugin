#!/bin/bash
# Block dangerous git commands before the Bash tool executes them.
# Contract: read JSON event from stdin, exit 2 with stderr message to block, exit 0 to allow.

set -u

INPUT=$(cat)

# Fail-closed on malformed input. If the harness sent something we cannot parse,
# block rather than wave through — a missing tool_input.command field could otherwise
# silently disable the guard.
if ! command -v jq >/dev/null 2>&1; then
  echo "BLOCKED: hook dependency 'jq' is not installed. Install jq or remove this hook." >&2
  exit 2
fi

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
JQ_EXIT=$?

if [ "$JQ_EXIT" -ne 0 ]; then
  echo "BLOCKED: hook could not parse tool input as JSON; failing closed for safety." >&2
  exit 2
fi

if [ -z "$COMMAND" ]; then
  # No command field present — allow (the bash tool may invoke other shapes).
  exit 0
fi

# SECURITY LIMITATION: regex pattern matching on shell-text is BEST-EFFORT only.
# A determined adversary can bypass via:
#   - quote/escape stripping  (gi""t push, \g\i\t push)
#   - shell expansion         (git$IFS$0push, eval "git push")
#   - subshell invocation     (bash -c 'git push', `git push`, $(git push))
#   - alias re-binding, env-var indirection, command substitution, here-strings.
# This guard catches the model's straightforward dangerous invocations. For real
# safety, layer this with: server-side branch protection, signed-tag-only push,
# pre-receive hooks on the upstream remote, CI-gated merges. Never treat this
# script as the sole defense against destructive git operations.

# Dangerous patterns. Each entry is an extended regex evaluated with `grep -E`.
# Patterns anchor on whitespace/separator boundaries on both sides where applicable
# (start-of-line OR whitespace OR shell separator on the left; whitespace OR
# end-of-line on the right). False positives are preferable to false negatives.
DANGEROUS_PATTERNS=(
  '(^|[[:space:]&|;])git[[:space:]]+([^|;&]*[[:space:]])?push([[:space:]&|;]|$)'
  '(^|[[:space:]&|;])git[[:space:]]+([^|;&]*[[:space:]])?reset[[:space:]]+--hard([[:space:]&|;]|$)'
  '(^|[[:space:]&|;])git[[:space:]]+([^|;&]*[[:space:]])?clean[[:space:]]+(-[a-zA-Z]*f|--force)'
  '(^|[[:space:]&|;])git[[:space:]]+([^|;&]*[[:space:]])?branch[[:space:]]+(-D|--delete[[:space:]]+--force)'
  '(^|[[:space:]&|;])git[[:space:]]+([^|;&]*[[:space:]])?checkout[[:space:]]+\.([[:space:]&|;]|$)'
  '(^|[[:space:]&|;])git[[:space:]]+([^|;&]*[[:space:]])?restore[[:space:]]+\.([[:space:]&|;]|$)'
  '(^|[[:space:]&|;|"'"'"'`])--force-with-lease([[:space:]]|=|$)'
  '(^|[[:space:]&|;|"'"'"'`])--force([[:space:]]|=|$)'
  '(^|[[:space:]&|;])-[a-zA-Z]*f[[:space:]]+(origin|--all|HEAD)'
  '(^|[[:space:]&|;])git[[:space:]]+([^|;&]*[[:space:]])?worktree[[:space:]]+remove[[:space:]]+--force'
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE -- "$pattern"; then
    echo "BLOCKED: '$COMMAND' matches dangerous pattern '$pattern'. The user has prevented this command from running." >&2
    exit 2
  fi
done

exit 0
