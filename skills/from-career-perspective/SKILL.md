---
name: from-career-perspective
description: 'Use when a user wants an answer only from the career seat (effects on human trajectories). Emits a career-perspective analysis without blending other lenses. Don''t use for tasks that require source or remote-system changes.'
---

# From career perspective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an answer only from the career seat (effects on human trajectories). |
| Authority | read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A career-perspective analysis emitted as chat output. |
| Done | A career-perspective answer is emitted without blending. |

## Inputs

The question or topic to analyze. No files, credentials, or external services are required.

## Procedure

1. Restate the supplied question or topic.
2. Adopt only the career seat: judge effects on human trajectories — career growth, skill acquisition, role transitions, professional risk, and human capital.
3. Answer exclusively from that seat. Do not blend any other perspective lens into the answer.
4. If the question has no career dimension, state that the career seat yields no independent answer rather than forcing one or borrowing another lens.
5. Emit the career-perspective analysis as chat output. Comparison with other lens outputs happens outside this skill; this skill never blends or compares.

## Failure and recovery
- **Blending**: any sentence that argues from a seat other than career invalidates the answer. Discard it and re-answer from the career seat only.
- **No career dimension**: do not invent a career angle or substitute another lens. Return the explicit statement that the career seat yields no independent answer.
- **Partial result**: none — the answer is whole or it is rejected and re-emitted.
- No mutation occurs on any failure; the only effect is chat output.

## Output
A career-perspective analysis: the effects of the subject on human trajectories, argued only from the career seat, with no blended lenses.

## Provenance

Origin: user-curated skill brief at `project-owned:user-curated-skill-ideas` (Perspective lenses section). Pinned revision: none. License: project-owned. Adaptation: clean-room restatement of the user's curated lens contract; no third-party expression copied.
