---
name: pain-point-saturation
description: 'Use when authorized qualitative evidence needs a privacy-preserving saturation map. Produces an evidence-saturated pain-point map. Stop at the declared success, non-success, or bound.'
---

# Pain point saturation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Authorized qualitative evidence needs a privacy-preserving saturation map. |
| Authority | AUTHORIZED_SENSITIVE_RESEARCH_READ |
| Side effect | Evidence-saturated pain-point map |
| Done | After the minimum evidence, two consecutive batches add no new pain-point cluster. |
| Stop | transcript cap; low-quality input; blocked; human review. Bound: Authorized transcript cap, minimum evidence, minimum clusters, and batch size. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen before any mutation.
2. Execute the evidence-saturated pain-point map inside the bound; stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: outcome.success holds or a named non_success/bound terminal applies.
3. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable); emit receipt.json before return. Done when: an immutable K11 receipt is written with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
