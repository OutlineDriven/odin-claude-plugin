---
name: automation-adoption-shortlist
description: 'Use when A team needs to choose which candidate automation, if any, deserves a manual trial. Produces Automation adoption shortlist. Stop at the declared success, non-success, or bound.'
---

# automation-adoption-shortlist

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A team needs to choose which candidate automation, if any, deserves a manual trial. |
| Authority | READ_ONLY |
| Side effect | Automation adoption shortlist |
| Done | At most three candidates and one manual-trial recommendation are supported by pinned evidence. |
| Stop | no suitable candidate; insufficient evidence. Bound: Pinned static or user-supplied roster and candidate cap.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Automation adoption shortlist inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
