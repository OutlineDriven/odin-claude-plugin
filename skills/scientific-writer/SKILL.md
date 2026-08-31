---
name: scientific-writer
description: 'Use when a scientific draft with its data, figures, and optional code needs iterative expert review and revision. Produces a draft revised to a fixed multi-specialist quality bar, stopping at the declared success, non-success, or bound.'
---

# Scientific writer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A scientific draft with its data, figures, and optional code needs iterative expert review and revision. |
| Authority | Reversible-local with sandboxed source execution. |
| Side effect | Produces a scientific draft revised to a fixed multi-specialist quality bar. |
| Done | A fresh independent peer reviewer sets pass true after figure, content, style, format, and code checks. |
| Stop | Budget exhausted; plateau; missing source material. Bound: frozen draft intent, source corpus, rubric, patience, and budget. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. **Done when:** the bound is recorded and no further mutation of the bound is possible mid-run.
2. Revise the scientific draft to the fixed multi-specialist quality bar inside the bound. **Done when:** figure, content, style, format, and code checks each pass or a named non-success terminal applies.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. **Done when:** exactly one terminal class is emitted and recorded.
4. Persist per profiles.persistence.P1 (durable_location `.outline/loops/<slug>/<run_id>/` when durable; emit receipt.json before return). **Done when:** receipt.json exists with every K11 field populated.

## Failure and recovery

- **Budget exhausted before success:** emit `exhausted` unless the predeclared success predicate is budget exhaustion itself.
- **Plateau:** revisions stop improving the draft across bounded rounds. Emit `stalled`.
- **Missing source material:** a required input is absent. Emit `blocked` naming the missing source.

## Output

One receipt.json with terminal class, run_id, and evidence trail; the revised draft at the durable location when persistence is durable.

## Provenance

- Profile P-ALS: source https://github.com/gaasher/Agent-Loop-Skills. Retain the upstream MIT copyright and license notice for adapted support code or expression.
