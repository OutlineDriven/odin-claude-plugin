---
name: scientific-figure
description: 'Use when scientific data needs a publication-quality figure and reproducible plot source. Produces the figure and plot code, then stops at the declared success, non-success, or bound. Not for architecture diagrams — use diagram-contract.'
---

# Scientific figure

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Scientific data needs a publication-quality figure and reproducible plot source. |
| Authority | REVERSIBLE_LOCAL_WITH_SANDBOXED_RENDER |
| Side effect | Produces a publication-quality scientific figure with reproducible plot code. |
| Done | A fresh critic sets critique.pass true and data spot-checks pass. |
| Stop | budget exhausted; plateau; render blocked. Bound: Frozen communication goal, data, rubric, patience, and budget. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and recorded before any generation.
2. Produce the publication-quality scientific figure and reproducible plot code inside the bound. Done when: a fresh critic sets critique.pass true and data spot-checks pass.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: outcome.success holds or a named non_success/bound terminal applies.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: an immutable K11 receipt with every K11 field is written.

## Provenance

- Profile P-ALS: source https://github.com/gaasher/Agent-Loop-Skills. Retain the upstream MIT copyright and license notice for adapted support code or expression.
