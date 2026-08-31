---
name: from-business-perspective
description: 'Use when the user wants an answer only from the business seat, to produce a business-perspective analysis of money, customers, and timing without blending other lenses. Not for any other from-* lens seat or multi-lens synthesis.'
---

# From business perspective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an answer only from the business seat (money, customers, timing). |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Returns a business-perspective analysis (money, customers, timing) in chat. |
| Done | Returns a business-perspective answer without blending other lenses. |

## Inputs

The question or decision to analyze from the business seat. Optional: any supplied context about money, customers, or timing. No external data fetch is required.

## Procedure

1. Confirm the question is one the business seat can answer in terms of money, customers, or timing. If it is not, stop. Done when: the question is confirmed answerable from the business seat, or the skill stops with a stated mismatch.
2. Adopt only the business perspective: revenue, cost, customers, and market timing. Do not import engineering, legal, design, or any other lens. Done when: the analysis is anchored on money, customers, and timing with no imported lens.
3. Analyze the question across the three business axes: money (revenue, cost, margin, funding), customers (who pays, who is served, demand, churn), and timing (market window, sequencing, deadlines). Done when: all three axes are addressed.
4. Keep the answer self-contained within this lens. Do not blend conclusions from other perspectives mid-answer; comparison across lenses happens only after each lens has produced its own independent output. Done when: no off-lens content appears in the answer.
5. Emit the business-perspective answer as chat output. Done when: the answer is emitted as chat output.

## Failure and recovery
- Non-business question: if the question cannot be answered from the business seat alone, stop and state that it is outside this lens rather than forcing a business framing.
- Lens bleed: if analysis drifts into another perspective, discard the off-lens content and re-anchor on money, customers, and timing only.
- Missing data: state the missing business fact explicitly rather than inventing figures. Do not pretend the done predicate holds on incomplete evidence.
- Non-mutation: no rollback is needed; this skill produces chat output only.

## Output
A business-perspective analysis covering money, customers, and timing, returned as chat output, with no other lens blended in.
