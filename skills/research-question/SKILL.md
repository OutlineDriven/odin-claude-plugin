---
name: research-question
description: 'Use when a vague topic needs a few sharp, novel, feasible research questions. Produces Requested number of specific, answerable, novel, feasible, significant research questions. Stop at the declared success, non-success, or bound.'
---

# research-question

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A vague topic needs a few sharp, novel, feasible research questions. |
| Authority | READ_ONLY_OR_REVERSIBLE_LOCAL |
| Side effect | Requested number of specific, answerable, novel, feasible, significant research questions |
| Done | The requested number clears every frozen rubric axis. |
| Stop | budget exhausted; novelty check blocked. Bound: Topic, question count, rubric, novelty sources, and budget.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Requested number of specific, answerable, novel, feasible, significant research questions inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-ALS: source https://github.com/gaasher/Agent-Loop-Skills. Retain the upstream MIT copyright and license notice for adapted support code or expression.
