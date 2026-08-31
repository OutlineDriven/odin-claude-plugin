---
name: consecutive-pass-validation
description: 'Use when a result must prove repeated quality rather than one lucky pass. Runs the fixed case set against the fixed quality bar N consecutive times, stopping at success, non-success, or the bound.'
---

# Consecutive pass validation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A result must prove repeated quality rather than one lucky pass. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Consecutive quality-bar proof |
| Done | The fixed realistic case set passes the fixed quality bar N consecutive times. |
| Stop | blocked; stalled; budget exhausted. Bound: Pre-set N, quality bar, case set, and budget. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and recorded before any mutation occurs.
2. Execute the consecutive quality-bar proof inside the bound. Done when: the proof runs to a terminal outcome.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: a terminal class is assigned.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: receipt.json is written with every K11 field and outcome.success holds or a named non_success/bound terminal applies.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
