---
name: user-error-message-verification
description: 'Use when reachable user-facing errors need clear messages verified in their real states. Produces Reachable, verified user error-message pass. Stop at the declared success, non-success, or bound.'
---

# user-error-message-verification

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Reachable user-facing errors need clear messages verified in their real states. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Reachable, verified user error-message pass |
| Done | Every in-scope reachable user-facing error is clear and verified. |
| Stop | state unreachable; blocked; budget exhausted. Bound: Declared user-facing error surface.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Reachable, verified user error-message pass inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
