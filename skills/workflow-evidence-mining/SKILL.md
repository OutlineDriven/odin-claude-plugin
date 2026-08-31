---
name: workflow-evidence-mining
description: 'Use when authorized workflow history may contain a repeated process worth extracting and replay-testing. Produces Contradiction-tested workflow mined from authorized history. Stop at the declared success, non-success, or bound.'
---

# workflow-evidence-mining

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Authorized workflow history may contain a repeated process worth extracting and replay-testing. |
| Authority | AUTHORIZED_PRIVATE_SOURCE_READ |
| Side effect | Contradiction-tested workflow mined from authorized history |
| Done | The workflow survives at least three independent high-confidence successes and a fresh replay. |
| Stop | contradicted; insufficient evidence; blocked. Bound: Authorized corpus and pass cap.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Contradiction-tested workflow mined from authorized history inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
