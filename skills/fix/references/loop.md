# Fix loop — full specification

## Overview

The fix loop is an atomic-commit-per-iteration cycle. One fix attempt per iteration. Each attempt stages a checkpoint commit then immediately verifies — kept on green, reverted on red. A commit is never kept without passing verification.

Each iteration:
1. Picks the highest-priority unfixed item
2. Applies a minimal fix
3. Stages a checkpoint commit (`git commit`) — provisional until step 5
4. Runs verifiers and the guard
5. KEEP if improvement + guard green; REWORK/DISCARD + `git revert HEAD --no-edit` otherwise


---

## Mode parameterization

The spine (attempt → verify → classify → retry-or-stop) is shared across all
modes. Each mode parameterizes four axes:

| Mode | Verifier | Commit policy | Ledger | Termination |
|------|----------|---------------|--------|-------------|
| `verifier-failure` / `findings` / `bug-spec` (default) | Repo-native test + lint guard | Checkpoint commit per iteration; revert on red | `fix-results.tsv` | Guard passes (KEEP), 3 skips HALT, or cap exhausted |
| `finder-fixer` | Next independent review | Never commit — working tree only | Verdict set (fixed/rejected/deferred per finding) | Every dispatched finding has a verdict |
| `iterative-improve` | Named external reviewer agent | Never commit — working tree only | `ledger.json` (cross-round, reloadable from disk) | Converged (zero critical/major), capped, escalated, or halted |
| `review-loop` | 8 specialist subagents | Committed fixes on reviewed branch | Append-only review log | Every finding has a disposition (fixed/unresolved/declined/out-of-scope/unverified) |

### Protected branch guard applicability

The protected branch guard applies only to modes that commit: the default
modes and `review-loop`. The non-committing modes (`finder-fixer`,
`iterative-improve`) do not mutate VCS state and skip this check.

### Verifier source by mode

- **Default modes**: repo-native test/lint detection per
  `references/verifiers.md`.
- **`iterative-improve`**: the named reviewer agent is the verifier. If it
  does not resolve, halt with `reviewer-unavailable` — do not substitute an
  inline imitation.
- **`review-loop`**: eight specialist subagents (api-contract,
  data-migration, maintainability, performance, red-team, security,
  simplification, testing) are the verifiers. See
  `references/review-loop.md`.
- **`finder-fixer`**: the next independent review verifies the work. Each
  behavioral fix carries a regression pin (a test that fails pre-fix) so the
  next review can confirm. See `references/finder-fixer.md`.
---

## Pseudocode

```
FUNCTION fix_loop(target, guard, scope, cap=20):
  baseline_errors = run_verifiers(target, scope)
  IF baseline_errors == 0:
    PRINT "detected: ... — no failures found; exiting without changes"
    RETURN

  iteration = 0
  kept = reverted = skipped = 0
  item_attempts = {}  # item_id → attempt_count
  total_skips = 0
  previous_errors = baseline_errors

  WHILE iteration < cap AND baseline_errors > 0:
    iteration++
    item = pick_highest_priority_unfixed_item()
    IF item is None:
      BREAK  # nothing left to try

    IF item_attempts[item.id] >= 3:
      SKIP item; total_skips++
      IF total_skips >= 3: HALT with "3 items blocked — invoke debug"
      CONTINUE

    apply_minimal_fix(item, scope)
    git_commit(item.description)  # capitalized imperative subject, under 50 chars
    item_attempts[item.id]++

    current_errors = run_verifiers(target, scope)
    delta = previous_errors - current_errors
    guard_result = run_guard(guard)

    action = decide(delta, guard_result)

    IF action == KEEP:
      kept++
      previous_errors = current_errors
      log_result("fixed")
    ELIF action == REWORK:
      git revert HEAD --no-edit
      reverted++
      log_result("rework")
    ELIF action == DISCARD:
      git revert HEAD --no-edit
      reverted++
      log_result("discard")

    IF iteration % 5 == 0:
      PRINT progress(iteration, kept, reverted, skipped, cap - iteration)

  emit_summary(kept, reverted, skipped, iteration, baseline_errors, current_errors)
```

---

## Decide matrix

| Condition | delta | Guard | Action | TSV status |
|-----------|-------|-------|--------|------------|
| Perfect/partial fix | > 0 | pass | KEEP — commit stays | fixed |
| Fix but guard regresses | > 0 | fail | REWORK — revert, try different approach (3 total attempts per item: initial + max 2 reworks; 4th attempt triggers SKIP) | rework |
| No effect | == 0 | — | DISCARD — revert immediately | discard |
| Made it worse | < 0 | — | DISCARD — revert immediately | discard |
| Crash during verification | any | fail | DISCARD — revert; log crash details | discard |
| 3rd attempt on same item | any | any | SKIP — add to blocked.md, move on; increment total_skips | blocked |
| total_skips >= 3 | — | — | HALT — emit "3 items blocked, invoke debug for root cause" | — |
| baseline_errors == 0 at start | — | — | EXIT without changes | — |
| cap exhausted | — | — | HALT — emit summary with remaining errors | — |

---

## Revert protocol

Always use:

```
git revert HEAD --no-edit
```

Never use `git reset --hard` — this discards uncommitted work that may exist in the workspace.

Never use `git checkout -- .` — same reason.

After revert, verify: re-run the verifier and confirm error count matches the pre-fix baseline. If it does not match, halt and report state mismatch.

---

## Progress print (every 5 iterations)

```
=== Fix Progress (iteration N / cap) ===
Baseline: B errors → Current: C errors (-D, -P%)
Kept: K | Reverted: R | Skipped: S | Remaining cap: M
```

---

## Recursion guard

When `fix` is invoked with explicit `--mode <X>` (e.g., `fix --mode verifier-failure`), the input classifier in SKILL.md is bypassed entirely. No GH auto-route fires. This prevents `gh-fix-ci` from re-entering `fix` which would call `gh-fix-ci` again.

The `--mode` flag is the ONLY bypass. Absence of `--mode` always runs the classifier.

---

## Protected branch guard

Before entering the loop, check:

```
git branch --show-current
```

If the branch matches `main`, `master`, `release/*`, or any branch the repo marks as protected (check `.github/branch_protection` if present), refuse and emit:

```
detected: ... — REFUSED: fix loop cannot run on protected branch <branch>; create a fix branch first
```

---

## Iteration cap override

Default cap: `20`. Override syntax in invocation:

```
/odin:fix
iterations: 30
```

or `fix --iterations 30`. Cap is applied as a hard ceiling; `stop` directive exits early.
