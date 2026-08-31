---
name: review-fix-grill-loop
description: 'Use when the user says grill these changes or wants their diff reviewed and fixed iteratively until clean. Produces zero open at-or-above-floor findings, or an explicit user deferral path. Not for a single review pass — use review; for analyzing one comment — use resolve.'
---

# Review fix grill loop

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says "grill my changes" or asks for the diff reviewed and fixed iteratively until clean |
| Authority | Reversible local: write only named local artifacts; rollback via `git revert HEAD --no-edit`. No push, no `reset --hard`, no `git clean`. |
| Side effect | Commits verified fixes with checkpoint commits; reverts regressions via `git revert` (forward commit); writes `.outline/review-fix-grill/` queue and iteration state. No push, no `reset --hard`, no `git clean`. |
| Done | Zero open findings at or above the severity floor (confidence ≥ medium) after consolidation and re-review; or an explicit user deferral, iteration-cap exhaustion, or stall-deferral path. |

## Inputs

- **Change-set** (required): resolved from the three-source union — tracked diff vs base ref, staged files, untracked-not-ignored files — per Step 1. Empty union exits immediately.
- `--severity-floor <critical|high|medium>` (optional): terminating floor; default `medium`.
- `--max-iterations N` (optional): outer-loop cap; default is scope-adaptive (5–15 based on change-set complexity per Step 2); an explicit value overrides the derived cap.
- `--quick` (optional flag): single review pass only; reports findings and exits without resolve, fix, or loop.
- `--domain <reviewer>` (optional): run one reviewer domain only; same consolidation and resolve contracts apply.
- `--resume` (optional flag): load `.outline/review-fix-grill/queue.json` if present and continue. If `caps` are absent (written by an older version), re-derive from `changedFiles[]` in Step 2 rather than assuming a scalar `maxIterations`.
- `scope` (optional path/glob/ref): overrides the change-set; grills that path instead of the resolved diff.
- `against <ref>` (optional): explicit base-ref override for diff resolution.

## Procedure

1. **Resolve change-scope.** Build the three-source union: tracked files in diff vs base ref, staged files, untracked-not-ignored files. Use the resolved `changedFiles[]` as the sole universe for every later step. Empty union exits immediately; launch no agents.

2. **Detect shape and derive caps.** Compute framework flags and priority signals over `changedFiles[]` only. Derive `scopeTier` from change-set complexity (file count, language spread, test-coverage presence, framework surface). Compute `caps.{maxIterations, fixAttemptCap, attemptsPerItem}`: outer cap 5–15, inner fix cap 20–80, per-item attempts 3–5 (= initial + reworks). Persist `caps` to the queue. On `--resume` with missing `caps`, re-derive from `changedFiles[]`.

3. **Select and dispatch reviewers.** Select ≤10 reviewers: 4 core always included (`code-quality`, `security`, `performance`, `test-quality`) plus conditional reviewers justified by the diff surface (e.g., `accessibility` when HTML/ARIA changes detected, `api-contract` when route/schema files changed, `database` when migration files present). Each reviewer receives: the `changedFiles[]` list, a role prompt specifying its domain, and a mandatory output schema requiring JSON with fields `file`, `line`, `severity` (critical/high/medium/low), `category`, `description`, `suggestion`, `confidence` (high/medium/low), and `falsePositive` (boolean + reason). Each reviewer prompt includes: "Flag findings you suspect are false positives with `falsePositive: true` and a non-empty `reason`. A dismissal without a reason is invalid and will be forced open." Reviewers are read-only; they return JSON only. Dispatch all selected reviewers in one parallel batch.

4. **Consolidate findings.** Merge all reviewer JSON outputs. Normalize field names and severity casing. For each finding flagged `falsePositive: true`: honor the dismissal only if `reason` is non-empty; otherwise force the finding open. Deduplicate findings that reference the same file+line+category. Apply the blocked-ratio gate before any zero-check: if ≥50% of findings are blocked (dismissed-with-reason or out-of-scope), surface the ratio to the user and halt consolidation until acknowledged. Extract findings with severity below the floor OR confidence below medium into `belowFloor[]`; do not place them in the fix queue.

5. **Resolve gate.** For each confirmed open finding at or above the severity floor, record a `resolveDecision`: `VALID`, `NOT-AN-ISSUE`, or `NEEDS-CLARIFICATION`. For each `VALID` finding, produce three distinct solution approaches with a recommendation and an in-scope/out-of-scope classification. `NEEDS-CLARIFICATION` and `out-of-scope` solutions escalate via `AskUserQuestion`; do not proceed to fix until the user resolves. `VALID` findings with in-scope recommended approaches feed the fix queue.

6. **Fix in verified batches.** For each item in the fix queue, apply one minimal patch per attempt. Before applying, create a checkpoint commit. Run the repo-native verifier (auto-detected: if `package.json` scripts contain `test` or `check`, run that; if `Makefile` has a `test` or `check` target, run that; if `Cargo.toml` exists, run `cargo test`; if `go.mod` exists, run `go test ./...`; if none detected, run `git diff --check` as a syntax-only fallback). On green: `KEEP` the commit. On red: `git revert HEAD --no-edit` (forward commit, no history rewrite). Up to `caps.attemptsPerItem` attempts per item before `SKIP` that item and continue. Refuse to enter this step on protected branches (`main`, `master`, `release/*`); if detected, halt and report.

7. **Targeted re-review and loop.** Re-review only files changed in this iteration (not the full `changedFiles[]`). Re-consolidate using the same rules as Step 4. Re-run the blocked-ratio gate. Test the loop condition: `openAtOrAboveFloor > 0 && iteration < caps.maxIterations`, counting only findings with `severity ≥ floor && confidence ≥ medium`.

8. **Decision gate and loop control.** If the loop condition is true, fire a decision gate with options: `continue-fixing` / `create-issues-for-rest` / `move-remainder-to-debt` / `leave-in-queue`. Detect stalls: if the set of open-at-or-above-floor finding hashes is identical in two consecutive iterations, drop the `continue-fixing` recommendation from the gate. Track two distinct counters: outer iteration count (review→resolve→fix→re-review cycles, capped by `caps.maxIterations`) and inner fix-attempt count (per-batch patches, capped by `caps.fixAttemptCap`). Report both in progress output. If the user selects `continue-fixing`, return to Step 3. Any other selection proceeds to Output.

Under `--quick`: terminate after Step 4 (consolidation and below-floor extraction). Bypass Steps 5–8.

## Failure and recovery
| Failure | Rule |
|---|---|
| Empty change-set in Step 1 | Exit immediately with a clean report; launch no agents. |
| Fix batch fails verification | `git revert HEAD --no-edit`, increment attempt counter. After `caps.attemptsPerItem` failures, `SKIP` that item and continue. |
| Stall detected (identical open-at-or-above-floor hash twice) | Surface the decision gate without `continue-fixing`. Do not auto-continue. |
| Reviewer findings schema invalid | Reject that reviewer's output; do not ingest it into the queue. |
| Out-of-scope or `NEEDS-CLARIFICATION` during resolve | Escalate via `AskUserQuestion`; do not proceed to fix until the user resolves. |
| Protected branch detected before Step 6 | Refuse to enter the fix loop; report and halt. |

## Output
A structured report saved to `.outline/review-fix-grill/queue.json` and `.outline/review-fix-grill/iterations/<n>.json`, containing:

- Change-scope and base ref used
- Selected reviewers
- Outer iteration count
- Findings fixed by severity (critical / high / medium)
- Remaining open findings at or above floor
- Below-floor count
- All resolve decisions including out-of-scope escalations
- Verifier commands executed and results
- Regressions rolled back
- Queue file path

Terminal output: a one-paragraph summary of the final state matching the completion contract.

## Provenance

Origin: project-internal skill from `skills/review-fix-grill-loop/SKILL.md` in the current catalog.
Adaptation: restructured per the ODIN 2.0 authoring contract; all content self-contained with no external skill or reference-file dependencies; authority and side effects scoped to reversible local mutations only.
License: project-internal.
