---
name: next-action-gate
description: 'Use when a task needs an evidence-based PASS, DELAY, or BLOCK status plus a separate next-action permission. Not for choosing what to work on next — use next-best-action.'
---

# next-action-gate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A task needs an evidence-based PASS, DELAY, or BLOCK status and a separate next-action permission. |
| Authority | READ_ONLY |
| Side effect | Evidence-backed task status and next-action permission |
| Done | Returns PASS or DELAY with GO/HOLD/CAP and a gated next action. |
| Stop | BLOCK; task or evidence unidentifiable. Bound: One scoped task and evidence packet. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and cannot be widened mid-run.
2. Execute the evidence-backed task status and next-action permission inside the bound. Done when: a PASS, DELAY, or BLOCK status is determined with a GO/HOLD/CAP next-action permission.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: a named terminal class (success, capped, stalled, blocked, exhausted, pending) is recorded.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: receipt.json is written with every K11 field before return.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
