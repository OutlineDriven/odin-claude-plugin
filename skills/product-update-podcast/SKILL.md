---
name: product-update-podcast
description: 'Use when a product release window needs a source-grounded, scripted, and reviewed audio update. Produce a source-grounded product-update episode. Stop at the declared success, non-success, or bound.'
---

# Product update podcast

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A product release window needs a source-grounded scripted and reviewed audio update. |
| Authority | PUBLIC_PUBLISH_START_APPROVAL; approval: A1 One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Source-grounded product-update episode |
| Done | A review-ready episode is grounded in the release evidence, or the window truthfully yields no episode. |
| Stop | sources blocked; quality bound exhausted. Bound: One release window and bounded regeneration. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and no mutation has occurred.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift. Done when: approval is collected or the run is ended on scope drift.
3. Produce the source-grounded product-update episode inside the bound. Done when: a review-ready episode is grounded in the release evidence, or the window truthfully yields no episode.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: outcome.success holds or a named non_success/bound terminal applies.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: an immutable K11 receipt with every K11 field is written.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
