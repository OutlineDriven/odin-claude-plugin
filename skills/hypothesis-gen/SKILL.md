---
name: hypothesis-gen
description: 'Use when a research question or domain needs a pool of novel, testable, literature-grounded hypotheses. Stop at the declared success, non-success, or bound. Not for refining a contested question into a calibrated frontier — use hypothesis-refinement.'
---

# hypothesis-gen

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A research question or domain needs a pool of novel, testable, literature-grounded hypotheses. |
| Authority | AUTHORIZED_RESEARCH_READ_REVERSIBLE_LOCAL |
| Side effect | Literature-vetted pool of novel testable hypotheses |
| Done | The requested number clears the frozen novelty, feasibility, specificity, and significance rubric, or saturation is proved. |
| Stop | budget exhausted; literature blocked. Bound: Requested pool size, dry-round patience, and budget. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and cannot change mid-run.
2. Execute the Literature-vetted pool of novel testable hypotheses inside the bound. Done when: the requested pool size clears the frozen novelty, feasibility, specificity, and significance rubric, or saturation is proved.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: one terminal class applies.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable) and emit an immutable K11 receipt with every K11 field before return. Done when: the receipt is written.

## Provenance

- Profile P-ALS: source https://github.com/gaasher/Agent-Loop-Skills. Retain the upstream MIT copyright and license notice for adapted support code or expression.
