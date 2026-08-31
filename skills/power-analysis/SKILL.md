---
name: power-analysis
description: 'Use when a two-arm comparison needs sample sizing and validity review before data collection. Produces a preregistered two-arm sample-size design. Stop at the declared success, non-success, or bound.'
---

# Power analysis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A two-arm comparison needs sample sizing and validity review before data collection. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Preregistered two-arm sample-size design |
| Done | Simulated power meets the fixed target and the validity checklist has no open flaw. |
| Stop | budget exhausted with flaws; unsupported design family; blocked. Bound: Two-sample mean or two-proportion design, fixed alpha/effect/power target, and simulation budget. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen before any mutation.
2. Execute the preregistered two-arm sample-size design inside the bound; stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: outcome.success holds or a named non_success/bound terminal applies.
3. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable); emit receipt.json before return. Done when: an immutable K11 receipt is written with every K11 field.

## Provenance

- Profile P-ALS: source https://github.com/gaasher/Agent-Loop-Skills. Retain the upstream MIT copyright and license notice for adapted support code or expression.
