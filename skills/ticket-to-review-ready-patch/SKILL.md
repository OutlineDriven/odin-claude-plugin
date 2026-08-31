---
name: ticket-to-review-ready-patch
description: 'Use when a ticket needs a root-cause-backed review-ready patch rather than an unstructured fix. Produces Ticket to smallest credible review-ready patch. Stop at the declared success, non-success, or bound.'
---

# ticket-to-review-ready-patch

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A ticket needs a root-cause-backed review-ready patch rather than an unstructured fix. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Ticket to smallest credible review-ready patch |
| Done | Reproduction, root cause, patch, regression rerun, and reviewer evidence are complete. |
| Stop | cannot reproduce; blocked; budget exhausted. Bound: One ticket and bounded reproduction attempts.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Ticket to smallest credible review-ready patch inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
