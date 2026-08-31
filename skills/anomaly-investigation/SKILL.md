---
name: anomaly-investigation
description: 'Use when A known observed anomaly needs a data-backed root cause rather than a guess. Produces Confirmed root cause for an observed data anomaly. Stop at the declared success, non-success, or bound.'
---

# anomaly-investigation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A known observed anomaly needs a data-backed root cause rather than a guess. |
| Authority | READ_ONLY_DATA_WITH_REVERSIBLE_REPORT |
| Side effect | Confirmed root cause for an observed data anomaly |
| Done | Exactly one candidate cause survives refutation and passes a positive confirming test. |
| Stop | budget exhausted without confirmation; blocked. Bound: Read-only dataset, explicit anomaly, and test budget.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Confirmed root cause for an observed data anomaly inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-ALS: source https://github.com/gaasher/Agent-Loop-Skills. Retain the upstream MIT copyright and license notice for adapted support code or expression.
