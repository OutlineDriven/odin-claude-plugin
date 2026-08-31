---
name: check-compiler-errors
description: 'Use when compile or type-check failures block validation. Run the failing check, apply the smallest local fix, and re-run until clean or a precise remaining-error summary is produced.'
---

# Check compiler errors

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Compile or type-check failures block validation. |
| Authority | Reversible local writes to source files in the working tree; recover through the project VCS. |
| Side effect | Runs the project compile or type-check command and may edit local source files to clear reported errors. |
| Done | The named check set passes clean, or a precise summary of every remaining error with file, line, and message is produced. |

## Inputs

- The failing compile or type-check command, supplied by the triggering result or read from project configuration. It must be present before any fix.
- The command's error output, supplied by the triggering result or obtained by running it.
- Optional scope limit: a named file or directory restricting which files may be edited.

## Procedure

1. Confirm the exact check command from the triggering result or project configuration. Do not invent or substitute a command. **Done when:** the exact check command is confirmed from the triggering result or project config.
2. Run the check command and capture its full error output. **Done when:** the check command is run and its full error output is captured.
3. Parse the output into discrete errors, each with file, line, message, and diagnostic code where available. **Done when:** the error output is parsed into discrete errors with file, line, message, and code.
4. For each error, apply the smallest source change that resolves it. Edit only files inside the stated scope. Prefer the fix the compiler or type-checker names; do not suppress, comment out, or special-case the error to make it disappear. **Done when:** every error has the smallest local fix applied within scope.
5. Re-run the check command after each fix batch. **Done when:** the check command is re-run after each fix batch.
6. Stop when the check passes clean, when an error cannot be resolved without widening scope, or when fixes stop converging. **Done when:** the check passes clean, or the remaining errors are reported with the stopping reason.

## Failure and recovery

- **Unavailable check command:** report the missing command and stop; do not guess a substitute.
- **Non-converging fixes:** if three consecutive fix batches do not reduce the error count, stop and report the remaining errors precisely.
- **Scope widening:** if a fix would touch a file outside the stated scope, stop and report the out-of-scope error rather than editing it.
- **Rollback:** every edit is a local source change recoverable through the project VCS. Do not delete or rewrite unrelated code.

## Output
Clean check confirmation, or a precise remaining-error list (file, line, message, diagnostic code) with the count of unresolved errors.
