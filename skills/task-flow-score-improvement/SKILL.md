---
name: task-flow-score-improvement
description: 'Use when a user task flow needs a before/after real-task score against a fixed checklist. Produces Fixed-checklist task-flow score improvement. Stop at the declared success, non-success, or bound.'
---

# task-flow-score-improvement

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user task flow needs a before/after real-task score against a fixed checklist. |
| Authority | REVERSIBLE_LOCAL_WITH_BROWSER_CONSENT |
| Side effect | Fixed-checklist task-flow score improvement |
| Done | Clean-session task score improves without cross-screen regression. |
| Stop | two no-gain rounds; blocked; unsafe change. Bound: Fixed checklist, task, screens, and round cap.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Fixed-checklist task-flow score improvement inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
