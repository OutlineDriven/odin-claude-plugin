---
name: pixel-safe-css-reduction
description: 'Use when shipped CSS needs evidence-backed reduction against a fixed state matrix. Produces pixel-identical shipped-CSS reduction. Stop at the declared success, non-success, or bound.'
---

# Pixel-safe CSS reduction

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Shipped CSS needs evidence-backed reduction against a fixed state matrix. |
| Authority | REVERSIBLE_LOCAL_WITH_UNCERTAIN_DELETE_ASK |
| Side effect | Pixel-identical shipped-CSS reduction |
| Done | CSS is smaller and every tested screen/state remains pixel-identical. |
| Stop | untested risk; no safe deletion; budget exhausted. Bound: Declared screen/state matrix and deletion cap. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen before any mutation.
2. Execute the pixel-identical shipped-CSS reduction inside the bound; stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: outcome.success holds or a named non_success/bound terminal applies.
3. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable); emit receipt.json before return. Done when: an immutable K11 receipt is written with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
