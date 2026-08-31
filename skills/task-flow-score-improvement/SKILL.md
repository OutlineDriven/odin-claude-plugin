---
name: task-flow-score-improvement
description: 'Use when a user task flow needs a before/after real-task score against a fixed checklist. Runs the checklist score improvement loop and stops at the declared success, non-success, or bound. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Task flow score improvement

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user task flow needs a before/after real-task score against a fixed checklist. |
| Authority | REVERSIBLE_LOCAL_WITH_BROWSER_CONSENT |
| Side effect | Fixed-checklist task-flow score improvement |
| Done | Clean-session task score improves without cross-screen regression. |
| Stop | two no-gain rounds; blocked; unsafe change. Bound: fixed checklist, task, screens, and round cap. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. **Bind the declared bound and freeze it before mutation.** Done when: the fixed checklist, task, screens, and round cap are frozen.
2. **Run the fixed-checklist task-flow score improvement within the bound.** Done when: outcome.success holds or a named non_success/bound terminal applies.
3. **Stop at the terminal.** Record outcome.success, any outcome.non_success, or outcome.bound. Done when: a receipt terminal class is assigned.
4. **Persist per profiles.persistence.P1.** Write to `durable_location .outline/loops/<slug>/<run_id>/` when durable; emit `receipt.json` before return. Done when: an immutable K11 receipt with every K11 field is written.

## Provenance

- Profile P-CATALOG source: https://signals.forwardfuture.com/loop-library/catalog.json. The derived provenance ledger records the catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
