---
name: fix
description: 'Use when the user says "fix", "make it pass", or "apply the findings", or hands a verifier failure or bug description. Iteratively repairs failures, keeping each fix only when the guard passes and reverting on red. Don''t use for untracked data or changes without a version-control rollback.'
---

# Fix

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says "fix", "make it pass", or "apply the findings", or supplies a verifier failure, findings artifact, or bug description. CI-on-PR workflows, PR review comments, merge conflicts, and analysis-only tasks are out of scope. |
| Authority | VCS-reversible destructive — edits VCS-tracked source files plus exactly three session evidence files (`fix-results.tsv`, `summary.md`, and `blocked.md`); one fix per iteration is a checkpoint commit; recovery is `git revert HEAD --no-edit`; refuses protected branches. |
| Side effect | Local writes to source files plus checkpoint commits; red iterations revert via `git revert HEAD --no-edit`; never `git reset --hard` or `git checkout -- .`. |
| Done | Guard passes (KEEP), or item REWORKed/SKIPped with a blocked.md entry, or loop HALTs after 3 skips; no test deletion and no suppression via ignore flags. |

## Inputs

- A failure input: raw verifier stdout/stderr, a path to a findings artifact (`*/findings.md`, `*/review/*.md`, `*/debug/*.md`), structured findings text, or a natural-language bug description.
- Optional: `iterations: N` or `--iterations N` to override the default 20-iteration cap.
- Optional: `--mode <X>` (`findings`, `verifier-failure`, `bug-spec`) to bypass the classifier.

## Procedure

1. **Classify input** (first match wins) and emit a detection line before any edit:
   ```
   detected: <mode> — target=TARGET guard=GUARD scope=SCOPE cap=20
   ```
   - `findings`: input is a findings artifact path or findings-formatted text (first non-blank line starts with `## Findings`, `## Issues`, `### Comment:`, or `**Status**: VALID ISSUE`; or inline prefix `From review:` / `From resolve:`).
   - `verifier-failure`: input is raw verifier stdout/stderr matching patterns like `FAILED`, `error TS[0-9]+:`, `^--- FAIL`, `^error\[E[0-9]+\]:`, `^error: could not compile`, or a stack trace block (3+ consecutive `file:line` / `at .* \(.*:\d+:\d+\)` lines). If embedded in prose with <50% structured lines, treat as `bug-spec`.
   - `bug-spec`: natural-language bug description; catch-all fallback.
   - Use bare `none` (not `<none>`) for empty target/guard; `*` for repo-wide scope.

2. **Resolve ambiguity** with a single-select `AskUserQuestion` (never `multiSelect`), one question per axis, when:
   - `MIXED_MODE`: both a findings artifact and verifier-failure output are present.
   - `LANG_UNKNOWN`: verifier-failure detected but no recognizable language/framework signal.
   - `SCOPE_AMBIGUOUS`: bug-spec with no file path, module, or component reference.

3. **Refuse protected branches.** Run `git branch --show-current`; if it matches `main`, `master`, `release/*`, or a branch the repo marks protected (check `.github/branch_protection` if present), emit `detected: ... — REFUSED: fix loop cannot run on protected branch <branch>; create a fix branch first` and stop.

4. **Detect verifier and guard.** Repo-native first (use `fd --max-depth 2` to locate): `Justfile` → `just test` (guard `just check`); `Makefile` → `make test` (guard `make check`); `package.json` → `test` script (guard `typecheck`/`lint` script); `dune-project` → `dune build @runtest` (guard `dune build`). Language fallbacks: TypeScript/JS → `pnpm exec vitest run`/`pnpm exec jest --passWithNoTests`/`pnpm test` (guard `pnpm exec tsc --noEmit && pnpm exec biome check .`); Python → `uv run pytest` (guard `uv run ruff check . && uv run pyright`); Rust → `cargo test` (guard `cargo clippy -- -D warnings`); Go → `go test ./...` (guard `golangci-lint run`); OCaml → `dune build @runtest` (guard `dune build`); Java/Kotlin → `./gradlew test`/`mvn test` (guard `./gradlew check`/`mvn verify`); C/C++ → `cmake --build . && ctest` (guard `clang-tidy`). Repo-native takes precedence over language fallback. When multiple verifiers are detected, run all per iteration; error count is the sum; guard is the union (all must pass); run faster verifiers (type checks, lints) before slower test suites.

5. **Compute baseline.** Run all verifiers, extract error counts per verifier pattern (`pytest`: `^FAILED ` or `N failed`; `tsc`: `error TS` lines; `eslint`: `\d+ errors`; `cargo test`: `^test .* FAILED`; `go test`: `^--- FAIL`; `clippy`: `^error\[`; `ruff`: `Found N errors`). If baseline errors == 0, emit `detected: ... — no failures found; exiting without changes` and stop.

6. **Iterative loop** (cap default 20, override via `iterations: N` / `--iterations N`):
   - Pick the highest-priority unfixed item. If none remains, break.
   - If the item has already had 3 attempts, SKIP it, increment `total_skips`, add to `blocked.md`; if `total_skips >= 3`, HALT with `3 items blocked — invoke root-cause investigation`.
   - Apply one minimal fix. Stage a checkpoint commit (`git commit`, capitalized imperative subject under 50 chars) — provisional until the guard is evaluated.
   - Run all verifiers and the guard. Compute `delta = previous_error_count - current_error_count`. If any count is unparseable, treat delta as 0 and DISCARD.
   - **Guard evaluation**: guard red if exit code non-zero, OR exit code 0 while stdout/stderr contains `error:`, `Error:`, `FAILED`, `warning [error]`, or `error[E`. Capture both stdout and stderr. Guard green requires exit 0 AND no error lines.
   - **Decide**: `delta > 0` + guard pass → **KEEP** (commit stays, update previous_errors). `delta > 0` + guard fail → **REWORK** (revert, retry; initial + max 2 reworks, 4th attempt → SKIP). `delta == 0` or `delta < 0` → **DISCARD** (revert immediately). Crash during verification → **DISCARD** (revert, log crash).
   - **Revert**: always `git revert HEAD --no-edit`. Never `git reset --hard` or `git checkout -- .`. After revert, re-run the verifier and confirm the error count matches the pre-fix baseline; if it does not, halt and report state mismatch.
   - Print progress every 5 iterations: `=== Fix Progress (iteration N / cap) === Baseline: B → Current: C (-D, -P%) Kept: K | Reverted: R | Skipped: S | Remaining cap: M`.

7. **Recursion guard.** When invoked with explicit `--mode <X>`, the classifier is bypassed entirely and no auto-routing fires. The `--mode` flag is the only bypass; its absence always runs the classifier. This prevents re-entrant loops from callers that delegate back into fix.

8. **Never suppress.** Do not add `@ts-ignore`, `# type: ignore`, `// eslint-disable`, or equivalent ignore flags to silence errors. Do not delete tests to make them pass. One fix per iteration — no "while I'm here" changes.

## Failure and recovery
- **No verifier output**: emit a warning, raise `LANG_UNKNOWN`, and ask which verifier to run.
- **3 strikes on one item**: SKIP, append to `blocked.md`, recommend root-cause investigation.
- **Guard ambiguous**: ask for the guard command via single-select `AskUserQuestion`.
- **Protected branch**: REFUSE before entering the loop.
- **State mismatch after revert**: halt and report; the working tree does not match the expected baseline.
- **Cap exhausted**: HALT and emit a summary with remaining errors.
- Partial results: kept commits from prior green iterations remain; the loop never widens scope beyond the classified target. Never swallow errors or claim the done predicate holds when the guard has not passed.

## Output
A session directory at `fix/{YYMMDD}-{HHMM}-{slug}/` (slug = short kebab-case label from the primary error or target file) containing:
- `fix-results.tsv` — iteration log: `iteration`, `category`, `target`, `delta`, `guard`, `status`, `description`.
- `summary.md` — what was fixed, what remains, and the session `fix_score`.
- `blocked.md` — errors that required 3+ attempts without resolution.

Terminal classification per item: `fixed` (KEEP), `rework`, `discard`, or `blocked`.

## Provenance

Origin: odin-1.x `skills/fix/SKILL.md` (project-owned, no third-party license). Adapted as a self-contained ODIN 2.0 procedure: reference files (`classifier.md`, `loop.md`, `verifiers.md`) folded inline; inter-skill dispatch routes and partner pointers removed; iterative-repair observable contract preserved.
