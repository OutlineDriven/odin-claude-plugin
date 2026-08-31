---
name: workflow-evidence-mining
description: 'Use when authorized workflow history may contain a repeated process worth extracting and replay-testing. Produces a contradiction-tested workflow mined from authorized history. Stop at the declared success, non-success, or bound.'
---

# Workflow evidence mining

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Authorized workflow history may contain a repeated process worth extracting and replay-testing. |
| Authority | AUTHORIZED_PRIVATE_SOURCE_READ |
| Side effect | Produces a contradiction-tested workflow mined from authorized history. |
| Done | The workflow survives at least three independent high-confidence successes and a fresh replay. |
| Stop | contradicted; insufficient evidence; blocked. Bound: Authorized corpus and pass cap. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: bound is frozen.
2. Execute the contradiction-tested workflow mined from authorized history inside the bound. Done when: execution completes with an outcome.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: terminal outcome is identified.
4. Confirm outcome.success holds or a named non_success/bound terminal applies. Done when: outcome is confirmed against the terminal classes.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: receipt.json is emitted.
6. Write an immutable K11 receipt with every K11 field. Done when: K11 receipt is written with all fields.

## Failure and recovery
- **Contradicted**: the workflow is contradicted by evidence. Stop. Terminal class: `contradicted`.
- **Insufficient evidence**: the authorized history does not contain enough to extract or test the workflow. Stop. Terminal class: `stalled` or `exhausted`.
- **Blocked**: the bound is hit before success. Stop. Terminal class: `blocked`.
- **Budget exhaustion**: never success unless it is the predeclared success predicate. Terminal class: `exhausted` or `pending`.

## Output
A contradiction-tested workflow mined from authorized history, with an immutable K11 receipt binding the outcome to the declared bound and pass cap.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
