---
name: from-business-perspective
description: 'Use when the user wants an answer only from the business seat, produce a business-perspective analysis of money, customers, and timing without blending other lenses. Don''t use for tasks that require source or remote-system changes.'
---

# From business perspective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an answer only from the business seat (money, customers, timing). |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A business-perspective analysis (money, customers, timing) emitted as chat output. |
| Done | A business-perspective answer is emitted without blending with other lenses. |

## Inputs

The question or decision to analyze from the business seat. Optional: any supplied context about money, customers, or timing. No external data fetch is required.

## Procedure

1. Confirm the question is one the business seat can answer in terms of money, customers, or timing. If it is not, stop.
2. Adopt only the business perspective: revenue, cost, customers, and market timing. Do not import engineering, legal, design, or any other lens.
3. Analyze the question across the three business axes: money (revenue, cost, margin, funding), customers (who pays, who is served, demand, churn), and timing (market window, sequencing, deadlines).
4. Keep the answer self-contained within this lens. Do not blend conclusions from other perspectives mid-answer; comparison across lenses happens only after each lens has produced its own independent output.
5. Emit the business-perspective answer as chat output.

## Failure and recovery
- Non-business question: if the question cannot be answered from the business seat alone, stop and state that the question is outside this lens rather than forcing a business framing.
- Lens bleed: if analysis drifts into another perspective, discard the off-lens content and re-anchor on money, customers, and timing only.
- Missing data: state the missing business fact explicitly rather than inventing figures. Do not pretend the done predicate holds on incomplete evidence.
- Non-mutation: no rollback is needed; this skill produces chat output only.

## Output
A business-perspective analysis covering money, customers, and timing, returned as chat output, with no other lens blended in.

## Provenance

Origin: project-owned:user-curated-skill-ideas (Perspective lenses section) and project-owned:user-supplied-source-brief. No pinned revision; no third-party license (project-owned source). Clean-room adaptation: the user-curated brief defines the business lens as money, customers, and timing within an 11-lens set where each lens answers only from its named seat and lenses are compared only after their independent outputs exist.
