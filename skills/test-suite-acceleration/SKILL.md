---
name: test-suite-acceleration
description: 'Use when a test suite is too slow and must be accelerated without weakening it. Produces Test-suite acceleration under unchanged behavior and coverage. Stop at the declared success, non-success, or bound.'
---

# test-suite-acceleration

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A test suite is too slow and must be accelerated without weakening it. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Test-suite acceleration under unchanged behavior and coverage |
| Done | The fixed-baseline suite is faster without reliability, behavior, or coverage regression. |
| Stop | no safe gain; blocked; budget exhausted. Bound: Baseline environment and optimization budget.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Test-suite acceleration under unchanged behavior and coverage inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
