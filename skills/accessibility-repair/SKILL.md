---
name: accessibility-repair
description: 'Use when named product surfaces need accessibility repair to meet an agreed standard. Produces accessibility repair to the named standard. Stop at the declared success, non-success, or bound.'
---

# Accessibility repair

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Named product surfaces need mutating accessibility repair to an agreed standard. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Accessibility repair to the named standard |
| Done | Zero confirmed barriers remain in the agreed scope. |
| Stop | untested need; product blocker; budget exhausted. Bound: Agreed surfaces and named accessibility standard. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen.
2. Perform accessibility repair to the named standard inside the bound. Done when: repair is complete inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: a terminal class is assigned.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: receipt.json is emitted with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
