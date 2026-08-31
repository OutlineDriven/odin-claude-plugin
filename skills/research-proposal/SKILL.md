---
name: research-proposal
description: 'Use when an existing research proposal needs iterative literature-grounded strengthening to a fixed grade. Produces Literature-grounded research proposal that clears a fixed grade. Stop at the declared success, non-success, or bound.'
---

# research-proposal

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An existing research proposal needs iterative literature-grounded strengthening to a fixed grade. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Literature-grounded research proposal that clears a fixed grade |
| Done | A fresh judge sets verdict.pass true without changing the frozen research intent. |
| Stop | budget exhausted; plateau; literature blocked. Bound: Frozen intent, rubric, pass grade, patience, and budget.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Literature-grounded research proposal that clears a fixed grade inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-ALS: source https://github.com/gaasher/Agent-Loop-Skills. Retain the upstream MIT copyright and license notice for adapted support code or expression.
