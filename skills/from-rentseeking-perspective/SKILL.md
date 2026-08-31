---
name: from-rentseeking-perspective
description: 'Use when a user wants an answer only from the rent-seeking seat (extraction without building). A rent-seeking-perspective answer is emitted without blending. Don''t use for tasks that require source or remote-system changes.'
---

# From rentseeking perspective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an answer only from the rent-seeking seat (extraction without building). |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A rent-seeking-perspective analysis emitted as chat output only. |
| Done | A rent-seeking-perspective answer is emitted without blending. |

## Inputs

The subject to analyze must be supplied by the user. Optional: the specific question to answer about that subject; if omitted, answer the most direct rent-seeking question the subject raises.

## Procedure

1. Confirm the subject is supplied. If it is absent, ask for it and stop; emit no analysis.
2. Adopt only the rent-seeking seat: judge everything as extraction without building — who captures value without creating it, where rents accrue, and what barriers protect them.
3. Answer the question solely from that seat. Do not blend business, codebase, career, innovation, stability, moat, human, or skeptic reasoning into the answer mid-answer.
4. Keep the output self-contained as one perspective. Comparison with other lenses happens after this output, not inside it.
5. Emit the analysis as chat output. Make no file, VCS, credential, paid, published, deployed, or remote change.

## Failure and recovery
- Blending failure: if the answer begins to mix seats, restart from step 2 and keep only rent-seeking reasoning.
- Missing subject: if no subject is supplied, ask for one and stop; emit no partial analysis.
- Non-mutation: this skill never mutates anything, so no rollback is needed. A blocked result is an explicit "subject required" message, never a fabricated analysis.

## Output
A chat-only rent-seeking-perspective analysis that answers the question from the extraction-without-building seat, with no other perspective blended in.

## Provenance

Origin: project-owned:user-curated-skill-ideas (user-curated perspective-lens brief; "from-rentseeking-perspective: extraction without building"). Revision unpinned. Project-owned marker. Clean-room adaptation: the seat definition is restated in this skill's own words; no third-party expression is copied.
