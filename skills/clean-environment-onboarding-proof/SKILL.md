---
name: clean-environment-onboarding-proof
description: 'Use when Onboarding instructions need proof from a clean disposable environment. Produces Clean-environment onboarding proof. Stop at the declared success, non-success, or bound.'
---

# clean-environment-onboarding-proof

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Onboarding instructions need proof from a clean disposable environment. |
| Authority | ISOLATED_ENVIRONMENT |
| Side effect | Clean-environment onboarding proof |
| Done | A documented ready state is reached from a disposable environment using only published instructions. |
| Stop | blocked; unsafe setup; retry exhausted. Bound: Disposable environments and retry cap.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Clean-environment onboarding proof inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
