---
name: loop-portfolio-scorecard
description: 'Use when a portfolio of existing loops needs comparable evidence and a keep/pivot/retire/kill decision. Produces a Loop-portfolio scorecard and stops at the declared success, non-success, or bound. Don''t use for single-artifact rescoring — use expert-scorecard.'
---

# loop-portfolio-scorecard

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A portfolio of existing loops needs comparable evidence and a keep/pivot/retire/kill decision. |
| Authority | READ_ONLY |
| Side effect | Loop-portfolio scorecard |
| Done | Every declared loop is classified KEEP, PIVOT, RETIRE, KILL, or INSUFFICIENT_EVIDENCE. |
| Stop | insufficient evidence; blocked. Bound: Declared loop portfolio and fixed formulas. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind and freeze the declared bound before any mutation. Done when: the bound is frozen and no mutation has occurred.
2. Run the Loop-portfolio scorecard inside that bound. Done when: outcome.success holds or a named non_success/bound terminal applies.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: the run has stopped at one declared terminal.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: an immutable K11 receipt with every K11 field is written.

## Output

One receipt: terminal classification (success, capped, stalled, blocked, exhausted, pending), per-loop verdicts (KEEP, PIVOT, RETIRE, KILL, INSUFFICIENT_EVIDENCE), and the K11 receipt fields.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
