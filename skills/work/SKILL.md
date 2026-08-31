---
name: work
description: 'Use when implementing from a plan or spec path, a clear build request, or a single settled ticket. Drives end-to-end execution from input triage through shipping; a single settled ticket takes the narrow single-ticket entry. Don''t use for open-ended debugging (use debug), exploration, or read-only research.'
disable-model-invocation: true
---

# Work execution

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Implementation starts from a plan or spec path or a clear build request (not an open-ended bug). |
| Authority | Write only named local artifacts; rollback path is git. |
| Side effect | Implements plan units, lands commits, runs system-wide test checks, and executes the shipping tail (review plus residual-work gate). |
| Done | All plan units are implemented and verified, the shipping tail has run, and the work is shipped or handed off with residuals named. |

## Inputs

- `$ARGUMENTS`: plan path, spec path, or bare work description. Blank to auto-detect the newest implementation-ready code plan in `docs/plans/`. Non-empty string is treated as a path only when it resolves to an existing readable file.
- Plan document (path input resolves to file): read metadata before body.
- Bare prompt (no file resolves): scan work area, assess complexity, route.

## Procedure

### Phase 0: input triage

1. Route the input following the triage rules in `references/execution-detail.md`: plan document (classify `artifact_readiness`), blank invocation (auto-select newest implementation-ready plan), or bare prompt (scan and assess complexity). Done when: input is routed to Phase 1 or stopped with a named blocking condition.

### Phase 1: quick start

2. Read plan and clarify (skip if arriving from Phase 0 with a bare prompt). Do not read the whole plan first. Build a section map, then read: metadata, `Goal Capsule`, `Verification Contract`, `Definition of Done`, the `Implementation Units` heading list, and only the active U-ID section plus referenced R/F/AE/KTD excerpts. Note `Execution note`, `Deferred to Implementation`, and `Scope Boundaries` before starting. If anything is unclear, ask clarifying questions now. Do not edit the plan body during execution. Done when: relevant plan sections are read and clarifications are resolved.
3. Setup environment. Determine current and default branch. On a feature branch with an opaque name, suggest renaming. On the default branch, offer new branch, worktree, or explicit permission to commit to default. Done when: branch strategy is confirmed.
4. Create task list (skip if Phase 0 routed as Trivial). Derive tasks from implementation units, dependencies, files, test targets, and verification criteria. Preserve U-IDs as prefixes. Carry each unit's `Execution note` and `Patterns to follow`. Use each unit's `Verification` field as the primary done signal. Include dependencies, prioritization, and testing tasks. Done when: task list is created with U-ID prefixes and dependencies.
5. Choose execution engine and strategy. Probe the harness for engine availability per `references/execution-detail.md`. Prefer subagents for structured multi-unit plans. Parallelize independent units only after confirming harness isolation capability. Never nest worktrees. Done when: execution engine is selected and dispatch strategy is confirmed.

### Phase 2: execute

6. Task execution loop — for each task in priority order: mark in-progress; read referenced files; check for existing matching work; find similar patterns and existing tests; implement following existing conventions; honor `Execution note` (offensive-first tdd, characterization-first, or pragmatic); add/update/remove tests; run System-Wide Test Check per `references/execution-detail.md` before marking done; mark completed; evaluate for incremental commit per `references/execution-detail.md`. Done when: task is executed per its execution note with the system-wide check green.
7. Test continuously: run relevant tests after each behavior-bearing change. Fix failures immediately. Add new tests for new behavior. Done when: tests pass for the current change.
8. Simplify opportunistically: at phase boundaries or when the diff reaches 30 lines, reread the changed units and remove dead branches, repeated logic, tiny one-use wrappers, and special cases the general path can absorb. Preserve observable behavior and rerun changed-path checks. Done when: simplification pass is complete with behavior preserved.
9. Track progress: update task tracker as tasks complete. Note blockers using plan IDs (U-IDs, R/F/AE IDs); do not invent IDs the plan does not supply. For long-running work, write progress to `/tmp/odin/work/<run-id>/progress.json` so state survives context compaction. Done when: progress is recorded.

### Phase 3–4: quality check and shipping tail

10. Run a fresh diff review sized to the change. Check correctness, security boundaries, error paths, concurrency, resource ownership, changed-contract tests, and every affected caller. Skip only for a purely mechanical diff. Done when: review is complete with findings recorded.
11. Apply review findings: fix every actionable comment. For contested findings citing a project doc as mandating a change, resolve with evidence. For declined findings, record the reason. Done when: all findings are resolved or declined with reasons recorded.
12. Ship the work. If residuals remain after the review cycle, name each residual explicitly, report it, and yield. Done when: work is shipped or yielded with residuals named.

## Single-ticket mode

A single settled ticket or spec is the narrow entry of the end-to-end pipeline. Phase 0 routes it here instead of building a multi-unit task list. Read the settled plan or ticket end to end and extract the contract: the behaviour promised, the inputs and outputs that define it, and the seams the plan names for behavioural tests. Then implement the contract in code following existing project conventions, reuse existing patterns rather than introducing new ones, and write behavioural tests at each named seam that verify the contract from the caller's perspective (tests must fail on a plausible bug, not restate the source). Run the project's check suite; fix the implementation, never suppress a check or widen scope to unrelated code. Run a fresh diff review; if it reopens a settled decision, overreaches the contract, or leaves a seam untested, fix the gap before committing. Commit with a message that names the contract satisfied and the seams tested.

Never reopen or redesign the plan during single-ticket execution. If the plan is ambiguous, contradictory, or missing a named seam, stop and report the gap; do not infer scope. If the implementation reopens a settled plan decision, revert the overreach and implement only what the plan names. If a named seam has no behavioural test, add it before committing; do not defer. If scope widens beyond the plan, revert the unrelated changes and commit only the contracted work. Partial results are not committed; if the procedure cannot reach the done predicate, report the blocker and leave the working tree unchanged or revert partial edits via VCS.

## Failure and recovery
| Failure | Rule |
|---|---|
| Requirements-only plan | Stop. Request implementation-ready plan. |
| Invalid readiness value | Stop. Request plan repair. |
| Non-code/unclassified mode | Stop. Request explicit human decision. |
| Blank invocation, no implementation-ready plan | Stop. Ask for explicit path. |
| Large work, user declines planning pass | Proceed with task list and execution. |
| Harness isolation unavailable for parallel | Fall back to serial subagents or inline. |
| Contending units in shared workspace | Fall back to serial. |
| Serial unit review diff out of scope | Fix before next unit. |
| Review finding contested with doc evidence | Resolve with evidence; record declined finding with reason. |
| Non-converged after review cycle | Ship what passes. Name residuals explicitly. Yield terminal report. |
| Single-ticket plan ambiguous or contradictory | Stop. Report the specific gap. Do not guess or redesign. |
| Single-ticket implementation reopens a settled decision | Revert the overreach. Implement only what the plan names. |
| Named seam has no behavioural test | Add the test before committing. Do not defer. |
| Single-ticket scope widens beyond the plan | Revert unrelated changes. Commit only the contracted work. |

Partial-result rule: ship what is implemented and verified. Never claim done when tests fail or review findings are unresolved.

## Output
Shipped code (all plan units implemented, verified tests pass, commits landed, shipping tail run) or a terminal yield with residuals named when work cannot be completed.
