---
name: tabular-cleanup
description: 'Use when a messy tabular dump needs deterministic cleanup to an approved inferred data contract. Cleans a copy of the dataset to satisfy the contract and classifies every residual violation. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Tabular cleanup

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A messy tabular dump needs deterministic cleanup to an approved inferred data contract. |
| Authority | REVERSIBLE_LOCAL_COPY_ONLY |
| Side effect | Cleaned copy of a tabular dataset satisfying an approved deterministic contract |
| Done | Every approved check passes, or every residual violation is explicitly classified. |
| Stop | budget exhausted; contract approval blocked; protected-column violation. Bound: approved inferred contract, protected columns, retention/imputation caps, and iteration budget. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. **Bind the declared bound and freeze it before mutation.** Done when: the approved contract, protected columns, retention/imputation caps, and iteration budget are frozen.
2. **Execute the cleanup inside the bound.** Produce a cleaned copy satisfying the approved deterministic contract. Done when: outcome.success holds or a named non_success/bound terminal applies.
3. **Stop at the terminal.** Record outcome.success, any outcome.non_success, or outcome.bound. Done when: a receipt terminal class is assigned.
4. **Persist per profiles.persistence.P1.** Write to `durable_location .outline/loops/<slug>/<run_id>/` when durable; emit `receipt.json` before return. Done when: an immutable K11 receipt with every K11 field is written.

## Provenance

- Profile P-ALS: source https://github.com/gaasher/Agent-Loop-Skills. Retain the upstream MIT copyright and license notice for adapted support code or expression.
