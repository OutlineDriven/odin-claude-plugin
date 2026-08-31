---
name: production-data-cleanup
description: 'Use when a production dataset violates a declared policy and the permitting classifier also needs correction. Make the production dataset policy-conformant and correct the classifier. Stop at the declared success, non-success, or bound.'
---

# Production data cleanup

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A production dataset violates a declared policy and the permitting classifier also needs correction. |
| Authority | PRODUCTION_DELETION_START_APPROVAL; approval: A1 One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Policy-conformant production dataset with a corrected classifier |
| Done | The approved dataset conforms and the classifier regression set passes. |
| Stop | uncertain records retained; blocked; approval denied. Bound: Exact dataset, policy, and deletion set. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and no mutation has occurred.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift. Done when: approval is collected or the run is ended on scope drift.
3. Make the production dataset policy-conformant and correct the classifier inside the bound. Done when: the approved dataset conforms and the classifier regression set passes.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: outcome.success holds or a named non_success/bound terminal applies.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: an immutable K11 receipt with every K11 field is written.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
