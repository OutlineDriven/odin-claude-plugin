---
name: feedback-pattern-sweep
description: 'Use when recent resolved feedback may reveal a broader recurring defect pattern: sweep resolved feedback for shared root causes, then verify no generalized recurrence remains across the project. Not for source-level feedback collection and ack — use feedback-sweep.'
---

# Feedback pattern sweep

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Recent resolved feedback may reveal a broader recurring defect pattern. |
| Authority | Reversible local: write only named local artifacts; state and follow the rollback path before mutating. |
| Side effect | Root-cause pattern sweep over recent resolved feedback; local writes limited to the declared bound. |
| Done | Reported issues are closed and a fresh whole-project search finds no generalized recurrence. |

## Inputs

- The declared feedback window (which resolved items to sweep) and the project surface to search for recurrence. Required.
- The bound: freeze both before any mutation.

## Procedure

1. Bind the declared feedback window and project surface; freeze both before any mutation. Done when: the window and surface are named and frozen.
2. Sweep the resolved feedback inside the bound for shared root causes; cluster items that trace to one root. Done when: every resolved item in the window is classified by root cause or marked isolated.
3. For each root cause, search the whole project for generalized recurrence — code that shares the root pattern. Done when: every root cause has a recurrence result (found and addressed, or confirmed absent).
4. Stop at success (all recurrences addressed), any non-success terminal (capped, stalled, blocked), or the bound. Done when: a terminal class is reached and named.
5. Persist the run per the durability policy; emit the receipt before return. Done when: the run record and receipt are written.

## Failure and recovery

- **Access blocked**: a source or surface in the bound cannot be read. Stop; report the blocked source and what was swept before the block.
- **Ambiguous feedback**: an item cannot be classified by root cause. Mark it isolated; do not force a cluster.
- **Budget exhausted**: the declared budget is spent before every root cause is checked. Terminal `capped`; report which roots were checked and which remain. Budget exhaustion is never success unless it is the predeclared success predicate.
- **Partial result**: emit every root cause and recurrence result obtained; never present an unchecked root as addressed.

## Output

A terminal classification (`success`, `capped`, `stalled`, `blocked`, `exhausted`, or `pending`) plus the root-cause clusters, per-root recurrence results, and the run receipt.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
