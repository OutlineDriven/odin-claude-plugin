---
name: claim-evidence-ledger
description: 'Use when one contested claim needs a persistent source-polarity, provenance, conflict, and negative-check ledger. Produces a polarity and provenance ledger. Stop at the declared success, non-success, or bound.'
---

# Claim evidence ledger

## Contract

| Field | Bound contract |
|---|---|
| Trigger | One contested claim needs a persistent source-polarity, provenance, conflict, and negative-check ledger. |
| Authority | READ_ONLY |
| Side effect | Contested-claim polarity and provenance ledger |
| Done | The declared confidence threshold is reached or the claim is contradicted. |
| Stop | underdetermined; blocked; no useful next action. Bound: One claim and declared pass limit. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. **Done when:** the bound is frozen and recorded.
2. Execute the Contested-claim polarity and provenance ledger inside the bound. **Done when:** the ledger is produced or a terminal outcome is reached.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. **Done when:** outcome.success holds or a named non_success/bound terminal applies.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). **Done when:** an immutable K11 receipt with every K11 field is written.

## Failure and recovery
- **Underdetermined:** the evidence does not reach the confidence threshold and no useful next action remains. Terminal class `stalled` or `blocked`.
- **Budget exhaustion:** terminal class `exhausted`, never success unless predeclared as the success predicate.
- **No useful next action:** terminal class `blocked`; report what blocked progress and stop.

## Output
A contested-claim polarity and provenance ledger, plus an immutable K11 receipt with every K11 field and the terminal class (success, capped, stalled, blocked, exhausted, or pending).

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
- Profile P-ALS: source https://github.com/gaasher/Agent-Loop-Skills. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
