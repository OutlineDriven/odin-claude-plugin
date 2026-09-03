---
name: feedback-pattern-sweep
description: 'Use when recent resolved feedback may reveal a broader recurring defect pattern: sweep resolved feedback for shared root causes, search the project surface for generalized recurrence, and verify no recurrence remains. Not for source-level feedback collection; use feedback-sweep for that.'
---

# Feedback pattern sweep

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Recent resolved feedback may reveal a broader recurring defect pattern. |
| Authority | Reversible local: write only named local artifacts; state and follow the rollback path before mutating. |
| Side effect | Root-cause pattern sweep over recent resolved feedback; local writes limited to the declared bound. |
| Done | All root-cause clusters checked, every confirmed recurrence addressed, and a fresh search finds no generalized recurrence. |
| Stop | Stalled; blocked; exhausted; capped. Bound: declared feedback window and project surface. |

## Inputs

- Feedback window (required): which resolved items to sweep, bounded by date range or item list.
- Project surface (required): the path or glob set to search for recurrence.
- Budget (required): the effort or time limit, declared before work begins.

## Procedure

1. Bind the feedback window, project surface, and budget. Freeze all three before any mutation. Done when: the window, surface, and budget are named and frozen.
2. Sweep the resolved feedback inside the window for shared root causes. For each resolved item, extract the defect description and the fix applied. Cluster items that trace to one root cause by matching the underlying fault pattern, not the surface symptom. Mark items that share no root as isolated. Done when: every resolved item in the window is classified by root cause or marked isolated.
3. For each root-cause cluster, search the project surface for generalized recurrence. Use word-boundary search for the root-cause pattern: the code shape, the missing check, the wrong assumption, or the invariant violation that produced the original defect. Record each hit with its file, line, and the root-cause cluster it matches. Done when: every root cause has a recurrence result (found and addressed, or confirmed absent).
4. Triage and address confirmed recurrences. For each hit, confirm the root-cause pattern applies by reading the surrounding code. Apply the minimal fix that removes the fault class, the same root-shape repair that resolved the original feedback. Do not patch the symptom; remove the pattern. Done when: every confirmed recurrence is addressed or explicitly deferred with a reason.
5. Verify absence. Run a fresh search over the project surface for each root-cause pattern. Confirm zero remaining hits. Done when: the fresh search finds no generalized recurrence, or remaining hits are justified exclusions with recorded reasons.
6. Stop at success (all recurrences addressed and verified absent), any non-success terminal, or the bound. Done when: a terminal class is reached and named.
7. Persist the run record to `.outline/loops/feedback-pattern-sweep/<run_id>/` when durable. Emit `receipt.json` before return. Done when: the receipt is written with the terminal class, root-cause clusters, per-root recurrence results, and verification status.

## Failure and recovery

- Access blocked: a source or surface in the bound cannot be read. Stop; report the blocked source and what was swept before the block. Terminal class: `blocked`.
- Ambiguous feedback: an item cannot be classified by root cause. Mark it isolated; do not force a cluster.
- Budget exhausted before every root cause is checked: terminal `capped`; report which roots were checked and which remain. Budget exhaustion is never success unless it is the predeclared success predicate.
- Stalled: a root-cause pattern is identified but the recurrence cannot be addressed inside the budget. Terminal `stalled`; report the pattern and the blocking condition.
- Partial result: emit every root cause and recurrence result obtained; never present an unchecked root as addressed.

## Output

A terminal classification (`success`, `capped`, `stalled`, `blocked`, `exhausted`, or `pending`) plus the root-cause clusters, per-root recurrence results, verification status, and the run receipt.
