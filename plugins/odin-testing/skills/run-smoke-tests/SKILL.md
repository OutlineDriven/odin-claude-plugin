---
name: run-smoke-tests
description: 'Use when asked to run smoke tests or verify a local build. Applies minimal fixes that unblock a stable passing result and reports flake risk honestly. Not for iterative bug fixing — use fix.'
---

# Run smoke tests

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Explicit human request to run end-to-end smoke verification |
| Authority | Reversible local changes only: write only named local artifacts; state the rollback path before mutating |
| Side effect | Builds, runs tests, and may apply minimal fixes to local files only |
| Done | Check set passes: stable smoke result with honest flake risk classification |

## Inputs

- Required: working directory containing a runnable build and test suite.
- Optional: named smoke-test command or target (defaults to the project's conventional smoke target).
- Required: network access if the build or tests retrieve remote artifacts.

## Procedure

1. **Audit scope.** Record the current VCS state (branch, HEAD commit) as the rollback anchor. If the workspace is dirty, stop and report the dirty state before proceeding.
2. **Identify smoke target.** Locate the project's conventional smoke-test target in the build manifest (Makefile, package.json scripts, Cargo.toml, pyproject.toml, or equivalent). Use the user-supplied target name if one was given.
3. **Validate target existence.** Verify the target exists and is executable before running it. If absent, stop with `target-missing`.
4. **Run smoke.** Execute the smoke target. Capture stdout, stderr, and the exit code.
5. **Classify result.** Known flaky candidates are tests or targets listed in the project's flake manifest, quarantine list, skip file, or user-supplied input. If none are declared, classify non-zero exits as `fail` and mark flake-suspect unknown.
   - Exit 0 with no stderr: `pass`.
   - Exit 0 with stderr warnings: `pass-with-warnings`.
   - Non-zero exit with a known flaky candidate: `flake-suspect`.
   - Non-zero exit with no known flaky candidate: `fail`.
6. **Minimal fix attempt (authority-gated).** If the result is `fail` or `flake-suspect` and the failure has one recognizable cause (missing import, typo, broken symlink, incorrect env-var), apply the minimal correction directly. Do not refactor, add features, or widen scope. Re-run the smoke target once after the fix.
7. **Rollback rule.** If the second run still fails, revert all changes made in step 6 before reporting.
8. **Report.** Emit the final classification, run count, any diffs applied and reverted, and the rollback anchor.

## Failure and recovery
| Class | Meaning | Recovery |
|---|---|---|
| `dirty-workspace` | Working tree has uncommitted changes | Stop; user must commit or stash |
| `target-missing` | Named smoke target not found in build manifest | Stop; report which manifests were checked |
| `build-error` | Build step exits non-zero | Stop after build failure; do not proceed to test |
| `non-converged` | Two successive runs disagree (flaky) or fix attempt widened scope | Revert; report honest flake risk |
| `rollback` | Fix was applied but second run still failed | Revert to rollback anchor; report final `fail` classification |

Partial-result rule: the final classification is the classification of the last run. Claim `pass` only when the final run exits zero, regardless of earlier non-zero runs that were superseded by a minimal fix kept in the workspace. Revert the fix only when the second run still fails.

## Output
A `SMOKE <classification>` block: classification, run count, rollback anchor (HEAD at step 1), applied diffs, and a reverted flag.
