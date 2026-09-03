---
name: extremely-optimize
description: 'Use when asked to run a performance campaign against a measured floor: rebuild hot paths from their floor, grade cold paths, and land each target as an atomic commit with a proven win. Not for hypothesis-only analysis without mutation — use fastopt.'
---

# Extremely optimize

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Subsystem or repo-wide performance campaign against a measured floor; the user says "make this as fast as possible", "extremely optimize", or "grill every inefficiency" |
| Authority | VCS-reversible destructive — changes restricted to VCS-tracked source targets, the exact set shown before mutation, version control used as recovery |
| Side effect | Hot-path source targets rewritten as atomic commits; non-wins reverted; boundary surfaces gated before any touch |
| Done | Hot units rebuilt with an even win, cold units graded fixed/at-floor/left, residue gone, verifier green, target landed atomically |

## Inputs

- A named subsystem path, or no path for a repo-wide survey. Repo-wide work is opt-in and never inferred. A bare invocation profiles the repo's own workload, then works the ranked list.
- One runnable workload command exercising the target with representative input and taking at least one second of wall clock. Must be supplied or constructed before measurement begins.
- The repo's own verifier command. Must be supplied or discovered before any target lands.

## Procedure

1. **Pin the workload and baseline.** Run `hyperfine --warmup 3 --min-runs 10 '<cmd>'`. Record median, stddev, min, max. Reject the measurement while stddev exceeds 20 % of median — pin CPU frequency, isolate the process, widen `--min-runs`, or enlarge the input until the noise clears. Use this number for every later comparison. Done when: a stable baseline median is recorded with stddev under 20 % of median.

2. **Split hot from cold.** Profile the workload. A unit is **hot** when it holds ≥ 5 % of total measured time or its call count scales with input size; everything else is **cold**. Write both lists down. Where a sampling profiler disagrees with a call-count argument, believe the call count and confirm by instrumentation. Done when: both hot and cold lists are written down.

3. **State the contract, compute the floor.** Work the hot list in descending order of time share. For each unit, write what it owes its callers based on call sites, tests, and the signature — never its own internals. Compute the floor from that contract alone: bytes that must move at achievable bandwidth, the algorithmic lower bound at a measured per-operation cost, and syscalls or round-trips the protocol cannot avoid. Show the arithmetic with `eval`, never in prose. Divide measured cost by floor; that multiple is the unit's headroom. A unit already within 2× of its floor is finished — record it and move on. Done when: every hot unit has its contract stated, floor computed, and headroom multiple recorded; units within 2× of floor are marked finished.

4. **Classify the surface, then derive blind.** Inventory the unit's consumers and mark each **interior** (every caller in-tree, nothing persisted or shipped) or **boundary** (public API, wire or on-disk format, config running in someone else's deployment, plugin point). Treat consumer channels that static analysis cannot resolve — reflection, string dispatch, generated code, external integration — as boundaries until evidence changes the classification. Build the replacement from the contract and the floor alone, without reading the old implementation for structure; reading it reproduces the costly shape. Choose the data layout that puts the floor in reach — contiguity, batching, hot and cold fields split, one pass where there were three — then write the code that layout implies. Done when: every consumer is classified interior or boundary, and the replacement is written from the contract and floor alone.

5. **Audit the divergence.** Walk the old implementation branch by branch and classify every behavior: folded into the replacement (**essential**) or cut (**residue**), each with a one-line reason. Read for behavior — guards, early returns, side effects, ordering guarantees, error semantics, state transitions. A branch never read is a feature deleted by accident; this walk is the only backstop. Done when: every old-implementation branch is classified as essential or residue with a one-line reason.

6. **Gate the boundary.** Present every surface marked boundary in step 4 and get an explicit answer before touching it. Interior surfaces need no ask; demolish them. Do not cut a boundary on silence or after a no. Done when: every boundary surface has an explicit answer before any touch; interior surfaces are demolished.

7. **Measure, prove, land.** Re-run the step 1 workload. A replacement that fails to beat the baseline median by 1.05× is not a win: revert it and keep the original. Run the repo's verifier, and cover every behavior classified essential in step 5 that no test reached. Delete the old unit and every symbol reachable only from it. Commit this target atomically before starting the next. Done when: the replacement beats the baseline by ≥ 1.05×, the verifier is green, essential behaviors are covered, the old unit is deleted, and the target is committed atomically.

8. **Grill the cold paths.** Cold code is off the clock; buying speed with complexity is a loss. Hunt waste that costs something other than time on this workload: complexity that bites at a larger N, allocations and retained memory, redundant IO and repeated round-trips, startup and build cost, artifact size and dependency weight. Every unit on the cold list takes one verdict: **fixed** (naming the cost that fell), **at floor**, or **left** (with the reason). A cold fix that adds a branch, a cache, or a configuration knob to buy microseconds is rejected. Done when: every cold unit has a verdict (fixed, at-floor, or left with reason).

Work one target at a time. Half-rebuilt is the forbidden state: finish a target or revert it. Scope equals the ask; never escalate a named target into a repo-wide campaign.

## Failure and recovery
| Code | Class and recovery |
|---|---|
| 10 | No workload — the target's cost cannot be reproduced on demand. Blocked: construct a runnable workload or stop. |
| 11 | Baseline too noisy — stddev exceeded 20 % of median and could not be cleared. Blocked: clear the noise or stop. |
| 12 | No headroom — every hot unit already sits within 2× of its floor. Terminal: nothing to rebuild. |
| 13 | No win — the replacement failed to beat the baseline by 1.05×. Recovery: revert the replacement, keep the original. |
| 14 | Divergence unclassified: old behavior neither folded in as essential nor cut as residue. Blocked: complete the step 5 walk. |
| 15 | Boundary cut without an answer — a published surface was destroyed on silence or after a no. Recovery: restore it and settle the question. |
| 16 | Campaign stalled mid-target — a target is half old, half new. Recovery: finish it or revert it; never ship it. |
| 17 | Scope exceeded — a repo-wide sweep ran off a named target. Recovery: revert the untargeted work. |

Partial-result rule: a target that has not reached the done predicate is reverted to its pre-campaign state; no half-rebuilt target is left in the tree. Non-mutation rule: non-wins are reverted; untargeted work is reverted. Never swallow an error or pretend the done predicate holds.

## Output
Exit code 0: hot units rebuilt against their floors with a proven win (≥ 1.05× over baseline), cold units each carrying a fixed / at-floor / left verdict, residue symbols returning nothing, verifier green, each target on its own commit. Any non-zero exit code above is a terminal classification with the specific blocker named.
