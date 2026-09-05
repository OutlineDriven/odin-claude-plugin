---
name: from-impact-perspective
description: 'Use when asked to answer only from the impact seat: who and what actually moves. Not for rebuilding from primitives: use from-first-principle.'
---

# From impact perspective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an answer only from the impact seat (who and what actually moves). |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Returns an impact-perspective analysis in chat; no other surface is touched. |
| Done | Returns an impact-perspective answer without blending. |

## Not for

- Rebuilding a design from primitives: use from-first-principle.
- Blended multi-seat analysis: run each from-*-perspective seat independently and compare after.
- Source or remote mutation: this skill is read-only.

## Inputs

The question or subject to analyze from the impact seat (required). Optional: the codebase, change, or decision context under analysis.

## Procedure

1. Identify the subject and the impact seat's scope: which actors, components, or forces actually change state, position, or outcome as a result of the subject. Done when: the movers are identified.
2. Trace what actually moves versus what merely appears to move or is assumed to move; mark unverified impact as inference. Done when: each claimed impact is labeled observed or inference.
3. Answer only from the impact seat. Do not blend other perspectives (business, codebase, career, breaking, stability) into the answer. If another seat is relevant, name it as a separate lens to run independently. Done when: the answer contains no blended perspective.
4. Return the impact-perspective answer in chat as a standalone analysis. Done when: the answer is emitted and stands alone.

## Failure and recovery

- Blended answer: if the draft folds in another perspective, re-separate and re-emit from the impact seat only.
- No observable impact: if nothing actually moves, state that explicitly rather than inventing impact.
- Blocked: if the subject is too underspecified to identify movers, return a blocked result naming the missing input; do not widen scope or guess.

## Output

A standalone impact-perspective analysis identifying who and what actually moves, with unverified impact marked as inference, no blended perspectives.
