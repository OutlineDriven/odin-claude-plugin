---
name: from-codebase-perspective
description: 'Use when asked to answer only from the codebase seat, reporting what existing code tolerates or punishes, then emit that single-perspective analysis without blending other lenses. Don''t use for tasks that require source or remote-system changes.'
---

# From codebase perspective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an answer only from the codebase seat (what existing code tolerates or punishes). |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A codebase-perspective analysis emitted as chat output. |
| Done | A codebase-perspective answer is emitted without blending. |

## Inputs

The question or proposal to analyze from the codebase seat. The codebase under analysis must be readable in the working tree; if it is not reachable, stop and report that the seat has no evidence.

## Procedure

1. Confirm the seat is codebase only. State that money, customers, timing, impact, career, breaking, rent-seeking, innovation, stability, and moat perspectives are out of scope for this answer.
2. Read the existing code, structure, conventions, and constraints that bear on the question.
3. Determine what the existing code currently tolerates: patterns, shapes, and directions it already accepts without friction.
4. Determine what the existing code punishes: patterns, shapes, and directions that fight the current structure, require rework, or break invariants.
5. Emit the answer strictly from the codebase seat. Do not blend any other perspective into the same answer; if another seat is relevant, name it as a separate lens to run independently.

## Failure and recovery
- Unreachable codebase: stop. Report that the codebase seat has no evidence and emit no analysis.
- Question outside the codebase seat: stop. Name the seat the question belongs to and emit no codebase answer.
- Pressure to blend lenses mid-answer: refuse. The non-blending rule is load-bearing; comparison happens only after independent outputs.
- Partial evidence: emit only the portion grounded in read code and label the rest as unverified. Never present inference as observed code behavior.

## Output
One codebase-perspective analysis in chat: what the existing code tolerates, what it punishes, and the code evidence for each. No decision is selected or recorded; comparison with other lenses happens after their independent outputs.

## Provenance

Origin: user-curated perspective-lens brief (local curated-ideas, candidate curated-067). License: project-owned, clean-room adaptation. The lens rule that each seat answers only from its named seat and that lenses do not blend mid-answer is preserved from the source.
