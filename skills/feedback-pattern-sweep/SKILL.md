---
name: feedback-pattern-sweep
description: 'Use when Recent resolved feedback may reveal a broader recurring defect pattern. Produces Recent-feedback root-cause pattern sweep. Stop at the declared success, non-success, or bound.'
---

# feedback-pattern-sweep

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Recent resolved feedback may reveal a broader recurring defect pattern. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Recent-feedback root-cause pattern sweep |
| Done | Reported issues are closed and a fresh whole-project search finds no generalized recurrence. |
| Stop | access blocked; ambiguous feedback; budget exhausted. Bound: Declared feedback window and project surface.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Recent-feedback root-cause pattern sweep inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
