---
name: from-career-perspective
description: 'Use when a user wants an answer only from the career seat: effects on human trajectories. Not for any other from-* lens seat or multi-lens synthesis.'
---

# From career perspective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an answer only from the career seat (effects on human trajectories). |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Returns a career-perspective analysis in chat. |
| Done | Returns a career-perspective answer without blending. |

## Inputs

The question or topic to analyze. No files, credentials, or external services are required.

## Procedure

1. Restate the supplied question or topic. Done when: the question or topic is restated.
2. Adopt only the career seat and judge effects on human trajectories: career growth, skill acquisition, role transitions, professional risk, and human capital. Done when: the career-seat analysis covers the relevant trajectory effects.
3. Answer exclusively from that seat. Do not blend any other perspective lens into the answer. Done when: no content from another lens appears in the answer.
4. If the question has no career dimension, state that the career seat yields no independent answer rather than forcing one or borrowing another lens. Done when: a career dimension is found, or the no-dimension statement is emitted.
5. Emit the career-perspective analysis as chat output. Comparison with other lens outputs happens outside this skill; this skill never blends or compares. Done when: the analysis is emitted as chat output.

## Failure and recovery
- Blending: any sentence that argues from a seat other than career invalidates the answer. Discard it and re-answer from the career seat only.
- No career dimension: do not invent a career angle or substitute another lens. Return the explicit statement that the career seat yields no independent answer.
- Partial result: none; the answer is whole or it is rejected and re-emitted.
- Non-mutation: no rollback is needed; this skill produces chat output only.

## Output
A career-perspective analysis: the effects of the subject on human trajectories, argued only from the career seat, with no blended lenses.
