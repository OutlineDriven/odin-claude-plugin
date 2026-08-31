---
name: onboarding-journey-proof
description: 'Use when a first-time onboarding journey needs clean-session completion evidence and obstacle repair. Produces First-time onboarding journey proof. Stop at the declared success, non-success, or bound.'
---

# onboarding-journey-proof

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A first-time onboarding journey needs clean-session completion evidence and obstacle repair. |
| Authority | OBSERVE_ONLY_OR_REVERSIBLE_LOCAL |
| Side effect | First-time onboarding journey proof |
| Done | A first-time user completes the fixed journey in one uninterrupted clean session. |
| Stop | no safe fix; blocked; approval required. Bound: One onboarding journey and pass cap.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the First-time onboarding journey proof inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
