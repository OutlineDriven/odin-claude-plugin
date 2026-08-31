---
name: action-accountability
description: 'Use when a sequence of actions needs explicit before-state, predicted delta, after-state evidence, and continue/stop decisions. Produces a world-state action-accountability ledger. Stop at the declared success, non-success, or bound.'
---

# Action accountability

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A sequence of actions needs explicit before-state, predicted delta, after-state evidence, and continue/stop decisions. |
| Authority | ACTION_CLASS_DEPENDENT_WITH_DANGEROUS_START_APPROVAL; approval: A1 when any action is dangerous. One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | World-state action-accountability ledger |
| Done | The declared goal state is reached or evidence shows no justified next action. |
| Stop | prediction failure; blocked; approval required. Bound: Declared goal state and action cap. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift. Done when: approval is collected or authority.approval is null.
3. Execute the World-state action-accountability ledger inside the bound. Done when: the ledger is complete inside the bound.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: a terminal class is assigned.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: receipt.json is emitted with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
