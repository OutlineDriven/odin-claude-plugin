#!/usr/bin/env sh
# Lightweight POSIX-sh smoke test for scripts/ast_grep_helper.py.
# Run by hand:  sh smoke.sh
# Skips gracefully (exit 0) when the ast-grep binary is not on PATH, since
# the helper's authoritative pattern-parse checks require it.
set -eu

HELPER="$(cd "$(dirname "$0")/.." && pwd)/scripts/ast_grep_helper.py"

PASSED=0

# expect_exit <expected> <desc> -- <cmd...>
# Runs the command, compares its exit code, prints PASS/FAIL. Exits 1 on
# mismatch.
expect_exit() {
    expected="$1"
    desc="$2"
    shift 2
    # consume the literal -- separator
    if [ "$1" = "--" ]; then
        shift
    fi
    actual=0
    "$@" >/dev/null 2>&1 || actual=$?
    if [ "$actual" -eq "$expected" ]; then
        echo "PASS: $desc"
        PASSED=$((PASSED + 1))
    else
        echo "FAIL: $desc (expected exit $expected, got $actual)"
        exit 1
    fi
}

# 1. Binary guard: skip cleanly when ast-grep is unavailable.
if ! command -v ast-grep >/dev/null 2>&1; then
    echo "SKIP: ast-grep not on PATH"
    exit 0
fi

# 2. validate ACCEPTS real patterns, including non-$-identifier languages
#    (the regression the helper's oracle fix targets).
expect_exit 0 "validate accepts console.log(\$MSG) --lang ts" -- \
    python3 "$HELPER" validate 'console.log($MSG)' --lang ts
expect_exit 0 "validate accepts print(\$MSG) --lang python" -- \
    python3 "$HELPER" validate 'print($MSG)' --lang python
expect_exit 0 "validate accepts fmt.Println(\$A) --lang go" -- \
    python3 "$HELPER" validate 'fmt.Println($A)' --lang go

# 3. validate REJECTS garbage.
expect_exit 2 "validate rejects \\w+ --lang ts" -- \
    python3 "$HELPER" validate '\w+' --lang ts
expect_exit 2 "validate rejects 'def FN(' --lang python" -- \
    python3 "$HELPER" validate 'def FN(' --lang python

# 4. replace dry-run is non-mutating, then --apply writes.
TMPFILE="${TMPDIR:-/tmp}/ast_grep_smoke_$$.py"
printf 'print("hi")\n' > "$TMPFILE"
# Remove the single temp FILE by its exact path. The EXIT trap covers the
# normal path and any early exit from a failed assertion; the signal traps
# clean up AND re-exit 128+signo so cancellation is not swallowed. This
# removes one exact file, never a recursive directory wipe.
trap 'rm -f "$TMPFILE"' EXIT
trap 'rm -f "$TMPFILE"; trap - HUP; exit 129' HUP
trap 'rm -f "$TMPFILE"; trap - INT; exit 130' INT
trap 'rm -f "$TMPFILE"; trap - TERM; exit 143' TERM

before="$(cksum < "$TMPFILE")"
expect_exit 0 "replace dry-run exits 0" -- \
    python3 "$HELPER" replace 'print($A)' 'log.info($A)' --lang python "$TMPFILE"
after="$(cksum < "$TMPFILE")"
if [ "$before" = "$after" ]; then
    echo "PASS: replace dry-run leaves file byte-identical"
    PASSED=$((PASSED + 1))
else
    echo "FAIL: replace dry-run mutated the file"
    exit 1
fi

expect_exit 0 "replace --apply exits 0" -- \
    python3 "$HELPER" replace 'print($A)' 'log.info($A)' --lang python --apply "$TMPFILE"
if grep -q 'log.info("hi")' "$TMPFILE"; then
    echo "PASS: replace --apply wrote log.info(\"hi\")"
    PASSED=$((PASSED + 1))
else
    echo "FAIL: replace --apply did not write the rewrite"
    exit 1
fi

echo "smoke: $PASSED passed"
