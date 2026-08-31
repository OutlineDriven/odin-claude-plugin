---
name: fixed-view-visual-benchmark
description: 'Use when a visual needs repeatable fixed-view rendering and independent rubric scoring. Produces Fixed-view visual benchmark. Stop at the declared success, non-success, or bound.'
---

# fixed-view-visual-benchmark

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A visual needs repeatable fixed-view rendering and independent rubric scoring. |
| Authority | REVERSIBLE_LOCAL_WITH_CAPTURE_CONSENT |
| Side effect | Fixed-view visual benchmark |
| Done | The saved render clears the frozen rubric threshold. |
| Stop | stagnation; render blocked; budget exhausted. Bound: Fixed view rig, threshold, and render budget.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Fixed-view visual benchmark inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
