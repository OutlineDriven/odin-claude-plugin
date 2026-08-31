---
name: cost-reduction
description: 'Use when A measured cost surface needs one-change-at-a-time reduction under frozen guardrails. Produces Guardrail-safe measured cost reduction. Stop at the declared success, non-success, or bound.'
---

# cost-reduction

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A measured cost surface needs one-change-at-a-time reduction under frozen guardrails. |
| Authority | BILLING_INFRA_PRODUCTION_START_APPROVAL; approval: A1 One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Guardrail-safe measured cost reduction |
| Done | The fixed budget target is reached without any guardrail regression. |
| Stop | no safe saving; no progress; blocked. Bound: Exact approved billing/infra scope, budget, guardrails, and pass cap.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift.
3. Execute the Guardrail-safe measured cost reduction inside the bound.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
