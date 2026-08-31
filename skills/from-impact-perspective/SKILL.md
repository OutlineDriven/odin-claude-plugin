---
name: from-impact-perspective
description: 'Use when asked to answer only from the impact seat: who and what actually moves. Returns an impact-perspective analysis that does not blend with other perspectives. Don''t use for tasks that require source or remote-system changes.'
---

# From impact perspective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an answer only from the impact seat (who and what actually moves). |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Emits an impact-perspective analysis to chat; no other surface is touched. |
| Done | An impact-perspective answer is emitted without blending. |

## Inputs

The question or subject to analyze from the impact seat (required). Optional: the codebase, change, or decision context under analysis.

## Procedure

1. Identify the subject and the impact seat's scope: which actors, components, or forces actually change state, position, or outcome as a result of the subject.
2. Trace what actually moves versus what merely appears to move or is assumed to move; mark unverified impact as inference.
3. Answer only from the impact seat. Do not blend other perspectives (business, codebase, career, breaking, stability) into the answer. If another seat is relevant, name it as a separate lens to run independently.
4. Emit the impact-perspective answer as a standalone analysis.

## Failure and recovery
- **Blended answer**: if the draft folds in another perspective, re-separate and re-emit from the impact seat only.
- **No observable impact**: if nothing actually moves, state that explicitly rather than inventing impact.
- **Blocked**: if the subject is too underspecified to identify movers, return a blocked result naming the missing input; do not widen scope or guess.

## Output
A standalone impact-perspective analysis identifying who and what actually moves, with unverified impact marked as inference.

## Provenance

Origin: user-curated perspective-lens brief (curated-068). Revision: null. License: project-owned. Clean-room procedural restatement of the single-perspective lens contract; no third-party expression copied.
