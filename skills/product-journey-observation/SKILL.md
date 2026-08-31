---
name: product-journey-observation
description: 'Use when a product journey needs observed persona-specific moments and ranked recommendations. Produces Persona-grounded product-journey feedback. Stop at the declared success, non-success, or bound.'
---

# product-journey-observation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A product journey needs observed persona-specific moments and ranked recommendations. |
| Authority | OBSERVE_ONLY |
| Side effect | Persona-grounded product-journey feedback |
| Done | The persona journey map and evidence-linked recommendations are complete. |
| Stop | journey blocked; evidence insufficient. Bound: One pass per declared persona.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Persona-grounded product-journey feedback inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
