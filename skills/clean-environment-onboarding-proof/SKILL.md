---
name: clean-environment-onboarding-proof
description: 'Use when onboarding instructions need proof from a clean disposable environment. Runs the published instructions to a declared ready state, stopping at success, non-success, or the bound.'
---

# Clean-environment onboarding proof

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Onboarding instructions need proof from a clean disposable environment. |
| Authority | ISOLATED_ENVIRONMENT |
| Side effect | Clean-environment onboarding proof |
| Done | A documented ready state is reached from a disposable environment using only published instructions. |
| Stop | blocked; unsafe setup; retry exhausted. Bound: Disposable environments and retry cap. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and recorded before any mutation occurs.
2. Execute the clean-environment onboarding proof inside the bound. Done when: the proof runs to a terminal outcome.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: a terminal class is assigned.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: receipt.json is written with every K11 field and outcome.success holds or a named non_success/bound terminal applies.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
