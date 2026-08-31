---
name: consecutive-pass-validation
description: 'Use when A result must prove repeated quality rather than one lucky pass. Produces Consecutive quality-bar proof. Stop at the declared success, non-success, or bound.'
---

# consecutive-pass-validation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A result must prove repeated quality rather than one lucky pass. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Consecutive quality-bar proof |
| Done | The fixed realistic case set passes the fixed quality bar N consecutive times. |
| Stop | blocked; stalled; budget exhausted. Bound: Pre-set N, quality bar, case set, and budget.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Consecutive quality-bar proof inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
