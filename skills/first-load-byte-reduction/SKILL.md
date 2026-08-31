---
name: first-load-byte-reduction
description: 'Use when A first screen needs lower transfer bytes without visual or behavioral change. Produces Pixel-identical first-load byte reduction. Stop at the declared success, non-success, or bound.'
---

# first-load-byte-reduction

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A first screen needs lower transfer bytes without visual or behavioral change. |
| Authority | REVERSIBLE_LOCAL_WITH_DEPENDENCY_ASK |
| Side effect | Pixel-identical first-load byte reduction |
| Done | The fixed first screen transfers fewer compressed bytes with pixel identity and passing tests. |
| Stop | no safe reduction; blocked; budget exhausted. Bound: Fixed screens, environment, and byte budget.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Pixel-identical first-load byte reduction inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
