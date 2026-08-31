---
name: data-analysis
description: 'Use when a bound dataset needs exploratory findings that are re-run and independently verified. Produces iterative, self-checked findings that stop at the declared success, non-success, or bound.'
---

# data-analysis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A bound dataset needs exploratory findings that are re-run and independently verified. |
| Authority | READ_ONLY_DATA_WITH_REVERSIBLE_REPORT |
| Side effect | Iterative self-checked findings over a bound dataset |
| Done | The dry-round threshold is reached with every retained finding independently re-derived and effect-sized. |
| Stop | budget exhausted; blocked. Bound: Read-only dataset, finding contract, dry-round patience, and budget. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is recorded and immutable for the run.
2. Execute the iterative, self-checked findings over a bound dataset inside the bound. Done when: the dry-round threshold is reached or a stop condition fires.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: exactly one terminal status is recorded.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: an immutable K11 receipt with every K11 field is written.

## Provenance

- Profile P-ALS: source https://github.com/gaasher/Agent-Loop-Skills. Retain the upstream MIT copyright and license notice for adapted support code or expression.
