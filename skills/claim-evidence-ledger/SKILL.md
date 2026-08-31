---
name: claim-evidence-ledger
description: 'Use when One contested claim needs a persistent source-polarity, provenance, conflict, and negative-check ledger. Produces Contested-claim polarity and provenance ledger. Stop at the declared success, non-success, or bound.'
---

# claim-evidence-ledger

## Contract

| Field | Bound contract |
|---|---|
| Trigger | One contested claim needs a persistent source-polarity, provenance, conflict, and negative-check ledger. |
| Authority | READ_ONLY |
| Side effect | Contested-claim polarity and provenance ledger |
| Done | The declared confidence threshold is reached or the claim is contradicted. |
| Stop | underdetermined; blocked; no useful next action. Bound: One claim and declared pass limit.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Contested-claim polarity and provenance ledger inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
- Profile P-ALS: source https://github.com/gaasher/Agent-Loop-Skills. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
