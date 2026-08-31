---
name: scientific-figure
description: 'Use when scientific data needs a publication-quality figure and reproducible plot source. Produces Publication-quality scientific figure with reproducible plot code. Stop at the declared success, non-success, or bound.'
---

# scientific-figure

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Scientific data needs a publication-quality figure and reproducible plot source. |
| Authority | REVERSIBLE_LOCAL_WITH_SANDBOXED_RENDER |
| Side effect | Publication-quality scientific figure with reproducible plot code |
| Done | A fresh critic sets critique.pass true and data spot-checks pass. |
| Stop | budget exhausted; plateau; render blocked. Bound: Frozen communication goal, data, rubric, patience, and budget.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Publication-quality scientific figure with reproducible plot code inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-ALS: source https://github.com/gaasher/Agent-Loop-Skills. Retain the upstream MIT copyright and license notice for adapted support code or expression.
