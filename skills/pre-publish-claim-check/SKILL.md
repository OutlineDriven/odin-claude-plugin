---
name: pre-publish-claim-check
description: 'Use when a draft is approaching publication and every checkable claim needs source verification. Produces a whole-draft claim-to-source publication gate. Stop at the declared success, non-success, or bound.'
---

# Pre-publish claim check

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A draft is approaching publication and every checkable claim needs source verification. |
| Authority | READ_ONLY_WITH_SENSITIVE_EDIT_ASK; approval: A1 only when a dangerous/public edit is included. One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Whole-draft claim-to-source publication gate |
| Done | Every checkable claim is supported or visibly flagged, or the draft has no checkable claims. |
| Stop | blocked; unverifiable; correction cap. Bound: One draft and bounded correction rounds. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen before any mutation.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift. Done when: approval is collected or scope drift ends the run.
3. Execute the whole-draft claim-to-source publication gate inside the bound; stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: outcome.success holds or a named non_success/bound terminal applies.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable); emit receipt.json before return. Done when: an immutable K11 receipt is written with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
