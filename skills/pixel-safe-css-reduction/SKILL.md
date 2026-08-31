---
name: pixel-safe-css-reduction
description: 'Use when shipped CSS needs evidence-backed reduction against a fixed state matrix. Produces Pixel-identical shipped-CSS reduction. Stop at the declared success, non-success, or bound.'
---

# pixel-safe-css-reduction

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Shipped CSS needs evidence-backed reduction against a fixed state matrix. |
| Authority | REVERSIBLE_LOCAL_WITH_UNCERTAIN_DELETE_ASK |
| Side effect | Pixel-identical shipped-CSS reduction |
| Done | CSS is smaller and every tested screen/state remains pixel-identical. |
| Stop | untested risk; no safe deletion; budget exhausted. Bound: Declared screen/state matrix and deletion cap.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Pixel-identical shipped-CSS reduction inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
