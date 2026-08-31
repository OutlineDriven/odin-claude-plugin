---
name: cost-reduction
description: 'Use when a measured cost surface needs one-change-at-a-time reduction under frozen guardrails. Produces guardrail-safe measured cost reduction. Stop at the declared success, non-success, or bound.'
---

# Cost reduction

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A measured cost surface needs one-change-at-a-time reduction under frozen guardrails. |
| Authority | BILLING_INFRA_PRODUCTION_START_APPROVAL; approval: A1 One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Guardrail-safe measured cost reduction |
| Done | The fixed budget target is reached without any guardrail regression. |
| Stop | no safe saving; no progress; blocked. Bound: Exact approved billing/infra scope, budget, guardrails, and pass cap. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and no mutation has occurred.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift. Done when: start approval is collected via one harness question call, or the run ends on scope drift.
3. Execute the Guardrail-safe measured cost reduction inside the bound. Done when: the cost reduction executes within the frozen bound with one change at a time.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: the run stops at a declared success, non-success, or bound terminal.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: an immutable K11 receipt with every K11 field is written and the run result is persisted.

## Failure and recovery
- Approval absent: stop before mutation and return blocked; invocation or prior consent never substitutes for the A1 start approval.
- Scope drift: end the run immediately and classify it blocked; do not expand the frozen bound.
- No safe saving or no progress: stop and classify the receipt stalled; do not spend another pass to manufacture movement.
- Guardrail regression: roll back the last change and classify the run blocked; never count unsafe savings.
- Bound reached: classify capped or exhausted as declared; budget exhaustion is success only when predeclared as the success predicate.

## Output
Return, in order: terminal class (`success`, `capped`, `stalled`, `blocked`, `exhausted`, or `pending`); measured cost delta; guardrail result; frozen bound; and immutable K11 `receipt.json` location.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
