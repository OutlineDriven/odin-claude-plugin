#!/usr/bin/env bash
# encode-memory-path.sh [path]
# Converts an absolute path to Claude Code's project directory segment encoding.
# Algorithm: replace /. with --, then replace / with -
# Output: absolute memory directory path (printed to stdout)
# Usage: MEMORY_DIR=$(./encode-memory-path.sh)         # uses pwd
#        MEMORY_DIR=$(./encode-memory-path.sh /some/path)
set -euo pipefail

INPUT="${1:-$(pwd)}"
ENCODED=$(printf '%s' "$INPUT" | sed 's|/\.|\-\-|g; s|/|-|g')
printf '%s/.claude/projects/%s/memory\n' "$HOME" "$ENCODED"
