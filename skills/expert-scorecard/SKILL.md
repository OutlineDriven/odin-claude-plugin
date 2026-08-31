---
name: expert-scorecard
description: 'Use when An artifact needs fresh independent rescoring to a fixed multidimensional bar. Produces Independently rescored expert scorecard. Stop at the declared success, non-success, or bound.'
---

# expert-scorecard

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An artifact needs fresh independent rescoring to a fixed multidimensional bar. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Independently rescored expert scorecard |
| Done | Every fixed dimension reaches 5/5 and objective red checks are clear. |
| Stop | stagnation; blocked; budget exhausted. Bound: Fixed rubric and round cap.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Independently rescored expert scorecard inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
