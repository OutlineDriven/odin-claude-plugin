---
name: automation-adoption-shortlist
description: 'Use when a team needs to choose which candidate automation, if any, deserves a manual trial. Produces an automation adoption shortlist. Not for source or remote-system changes.'
---

# Automation adoption shortlist

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A team needs to choose which candidate automation, if any, deserves a manual trial. |
| Authority | READ_ONLY |
| Side effect | Automation adoption shortlist |
| Done | At most three candidates and one manual-trial recommendation are supported by pinned evidence. |
| Stop | no suitable candidate; insufficient evidence. Bound: Pinned static or user-supplied roster and candidate cap. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and immutable for the run.
2. Execute the Automation adoption shortlist inside the bound. Done when: the shortlist is produced within the bound or a terminal class is reached.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: a terminal class is reached and the run stops.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: the receipt is written with every K11 field and persistence is confirmed.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
