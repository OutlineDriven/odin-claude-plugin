---
name: production-error-sweep
description: 'Use when a declared production-log window needs a sanitized, root-cause-backed error sweep. Produces Bounded production-log error sweep. Stop at the declared success, non-success, or bound.'
---

# Production error sweep

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A declared production-log window needs a sanitized, root-cause-backed error sweep. |
| Authority | SENSITIVE_READ_PLUS_REVERSIBLE_LOCAL |
| Side effect | Bounded production-log error sweep |
| Done | Actionable errors are fixed and verified, or the declared window is clean with no action. |
| Stop | access blocked; unreproduced; bound exhausted. Bound: Declared log window and issue cap. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and no mutation has occurred.
2. Execute the Bounded production-log error sweep inside the bound. Done when: actionable errors are fixed and verified, or the declared window is clean with no action.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: outcome.success holds or a named non_success/bound terminal applies.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: an immutable K11 receipt with every K11 field is written.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
