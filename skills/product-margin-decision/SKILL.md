---
name: product-margin-decision
description: 'Use when a physical or commerce product candidate needs demand, cost, margin, IP, MOQ, and investment evidence. Produces Validated product-margin decision. Stop at the declared success, non-success, or bound.'
---

# product-margin-decision

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A physical or commerce product candidate needs demand, cost, margin, IP, MOQ, and investment evidence. |
| Authority | FINANCIAL_EXTERNAL_CONTACT_START_APPROVAL; approval: A1 One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Validated product-margin decision |
| Done | The candidate is validated or receives an evidence-backed no-go. |
| Stop | blocked; approval required; research cap. Bound: Exact approved discovery feeds and round cap.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift.
3. Execute the Validated product-margin decision inside the bound.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
