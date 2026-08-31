---
name: loop-portfolio-scorecard
description: 'Use when a portfolio of existing loops needs comparable evidence and a keep/pivot/retire/kill decision. Produces Loop-portfolio scorecard. Stop at the declared success, non-success, or bound.'
---

# loop-portfolio-scorecard

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A portfolio of existing loops needs comparable evidence and a keep/pivot/retire/kill decision. |
| Authority | READ_ONLY |
| Side effect | Loop-portfolio scorecard |
| Done | Every declared loop is classified KEEP, PIVOT, RETIRE, KILL, or INSUFFICIENT_EVIDENCE. |
| Stop | insufficient evidence; blocked. Bound: Declared loop portfolio and fixed formulas.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Loop-portfolio scorecard inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
