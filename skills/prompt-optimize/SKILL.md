---
name: prompt-optimize
description: 'Use when a prompt feeds a system with a user-supplied repeatable score and needs measured improvement. Produces Best verified prompt under a user-supplied black-box evaluation. Stop at the declared success, non-success, or bound.'
---

# prompt-optimize

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A prompt feeds a system with a user-supplied repeatable score and needs measured improvement. |
| Authority | REVERSIBLE_LOCAL_WITH_SANDBOXED_COMMAND |
| Side effect | Best verified prompt under a user-supplied black-box evaluation |
| Done | The target score is reached or a predeclared plateau returns the best checkpoint. |
| Stop | evaluation blocked; budget exhausted; no valid gain. Bound: Frozen eval command, prompt file, target, noise margin, patience, and budget. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and no mutation has occurred.
2. Execute the Best verified prompt under a user-supplied black-box evaluation inside the bound. Done when: the target score is reached or a predeclared plateau returns the best checkpoint.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: outcome.success holds or a named non_success/bound terminal applies.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: an immutable K11 receipt with every K11 field is written.

## Provenance

- Profile P-ALS: source https://github.com/gaasher/Agent-Loop-Skills. Retain the upstream MIT copyright and license notice for adapted support code or expression.
