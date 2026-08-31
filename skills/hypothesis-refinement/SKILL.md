---
name: hypothesis-refinement
description: 'Use when a contested question needs falsifiable alternatives, adversarial evidence, and a calibrated frontier. Produces Evidence-backed epistemic frontier. Stop at the declared success, non-success, or bound.'
---

# hypothesis-refinement

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A contested question needs falsifiable alternatives, adversarial evidence, and a calibrated frontier. |
| Authority | READ_ONLY |
| Side effect | Evidence-backed epistemic frontier |
| Done | One conclusion dominates after at least three falsifiable alternatives under the predefined rule. |
| Stop | underdetermined; blocked; exhausted. Bound: Predefined dominance rule and pass cap.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Evidence-backed epistemic frontier inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
