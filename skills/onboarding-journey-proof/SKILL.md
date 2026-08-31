---
name: onboarding-journey-proof
description: 'Use when a first-time onboarding journey needs clean-session completion evidence and obstacle repair. Not for repository orientation or a tour — use onboard.'
---

# Onboarding journey proof

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A first-time onboarding journey needs clean-session completion evidence and obstacle repair. |
| Authority | OBSERVE_ONLY_OR_REVERSIBLE_LOCAL |
| Side effect | First-time onboarding journey proof |
| Done | A first-time user completes the fixed journey in one uninterrupted clean session. |
| Stop | no safe fix; blocked; approval required. Bound: One onboarding journey and pass cap. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and cannot be widened mid-run.
2. Execute the first-time onboarding journey proof inside the bound. Done when: the journey completes or a named non-success terminal applies.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: a named terminal class (success, capped, stalled, blocked, exhausted, pending) is recorded.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: receipt.json is written with every K11 field before return.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
