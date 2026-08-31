---
name: scientific-writer
description: 'Use when a scientific draft with its data, figures, and optional code needs iterative expert review and revision. Produces Scientific draft revised to a fixed multi-specialist quality bar. Stop at the declared success, non-success, or bound.'
---

# scientific-writer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A scientific draft with its data, figures, and optional code needs iterative expert review and revision. |
| Authority | REVERSIBLE_LOCAL_WITH_SANDBOXED_SOURCE_EXECUTION |
| Side effect | Scientific draft revised to a fixed multi-specialist quality bar |
| Done | A fresh independent peer reviewer sets pass true after figure, content, style, format, and code checks. |
| Stop | budget exhausted; plateau; missing source material. Bound: Frozen draft intent, source corpus, rubric, patience, and budget.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Scientific draft revised to a fixed multi-specialist quality bar inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-ALS: source https://github.com/gaasher/Agent-Loop-Skills. Retain the upstream MIT copyright and license notice for adapted support code or expression.
