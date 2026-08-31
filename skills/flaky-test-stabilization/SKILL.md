---
name: flaky-test-stabilization
description: 'Use when a confirmed flaky test needs root-cause repair and consecutive-run proof without blind retries. Produces Flake-free test stabilization. Stop at the declared success, non-success, or bound.'
---

# flaky-test-stabilization

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A confirmed flaky test needs root-cause repair and consecutive-run proof without blind retries. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Flake-free test stabilization |
| Done | N consecutive comparable full-suite runs are green. |
| Stop | root cause blocked; visible quarantine; budget exhausted. Bound: Preselected N and comparable environment.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Flake-free test stabilization inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
