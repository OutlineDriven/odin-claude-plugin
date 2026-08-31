---
name: meaningful-test-coverage
description: 'Use when a test surface needs meaningful coverage raised to a configured target without vacuous tests. Produces Meaningful coverage to a configured target. Stop at the declared success, non-success, or bound.'
---

# meaningful-test-coverage

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A test surface needs meaningful coverage raised to a configured target without vacuous tests. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Meaningful coverage to a configured target |
| Done | The configured target is met with assertions that survive mutation/value checks. |
| Stop | justified exclusion; blocked; budget exhausted. Bound: Configured target, scope, and test budget.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Meaningful coverage to a configured target inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
