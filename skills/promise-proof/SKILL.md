---
name: promise-proof
description: 'Use when customer-facing promises need linked evidence before publication or release. Produces Customer-promise evidence ledger. Stop at the declared success, non-success, or bound.'
---

# Promise proof

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Customer-facing promises need linked evidence before publication or release. |
| Authority | READ_ONLY_WITH_RISKY_FIX_ASK; approval: A1 only when the proposed copy change is itself dangerous/public. One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Customer-promise evidence ledger |
| Done | Every in-scope promise is proved or safely narrowed. |
| Stop | unsupported; blocked; approval required. Bound: Declared promise inventory and pass cap. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and no mutation has occurred.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift. Done when: approval is collected or the run is ended on scope drift.
3. Execute the Customer-promise evidence ledger inside the bound. Done when: every in-scope promise is proved or safely narrowed.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: outcome.success holds or a named non_success/bound terminal applies.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: an immutable K11 receipt with every K11 field is written.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
