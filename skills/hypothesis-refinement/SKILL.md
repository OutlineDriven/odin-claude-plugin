---
name: hypothesis-refinement
description: 'Use when a contested question needs falsifiable alternatives, adversarial evidence, and a calibrated frontier. Produces an evidence-backed epistemic frontier. Stop at the declared success, non-success, or bound. Not for generating a hypothesis pool — use hypothesis-gen.'
---

# hypothesis-refinement

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A contested question needs falsifiable alternatives, adversarial evidence, and a calibrated frontier. |
| Authority | READ_ONLY |
| Side effect | Evidence-backed epistemic frontier |
| Done | One conclusion dominates after at least three falsifiable alternatives under the predefined rule. |
| Stop | underdetermined; blocked; exhausted. Bound: Predefined dominance rule and pass cap. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and cannot change mid-run.
2. Execute the Evidence-backed epistemic frontier inside the bound. Done when: one conclusion dominates after at least three falsifiable alternatives under the predefined dominance rule.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: one terminal class applies.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable) and emit an immutable K11 receipt with every K11 field before return. Done when: the receipt is written.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
