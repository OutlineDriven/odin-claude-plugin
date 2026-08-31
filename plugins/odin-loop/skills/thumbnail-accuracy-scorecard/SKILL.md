---
name: thumbnail-accuracy-scorecard
description: 'Score thumbnail concepts with real-size, accuracy-first criteria without misleading claims. Not for generating thumbnails — use a generation tool; not for remote, credential, publish, deploy, or irreversible changes.'
---

# Thumbnail accuracy scorecard

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Thumbnail concepts need real-size, accuracy-first scoring without misleading claims. |
| Authority | Reversible local with asset approval. |
| Side effect | Accuracy-gated thumbnail scorecard. |
| Done | One accurate winner and two accurate runners-up clear the fixed rubric threshold. |
| Stop | No accurate winner; approval blocked; round cap. Bound: platform, audience, rubric, assets, and round cap. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Refusals

- Will not score thumbnails at sizes other than real platform dimensions.
- Will not declare a winner that fails the accuracy rubric.
- Will not claim success when the budget is exhausted unless exhaustion was the predeclared success predicate.

## Procedure

1. Bind the declared bound and freeze it before mutation. **Done when:** the bound is recorded and no mutation has begun.
2. Execute the accuracy-gated thumbnail scorecard inside the bound. **Done when:** one accurate winner and two accurate runners-up clear the fixed rubric threshold, or a non-success terminal applies.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. **Done when:** a terminal class is assigned.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Write an immutable K11 receipt with every K11 field. **Done when:** the receipt is written with every K11 field.

## Output

A receipt.json with the terminal class, bound, and scorecard evidence, persisted at .outline/loops/<slug>/<run_id>/ — ordering: bound, scorecard evidence, terminal verdict, receipt.
