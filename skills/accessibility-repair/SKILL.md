---
name: accessibility-repair
description: 'Use when Named product surfaces need mutating accessibility repair to an agreed standard. Produces Accessibility repair to the named standard. Stop at the declared success, non-success, or bound.'
---

# accessibility-repair

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Named product surfaces need mutating accessibility repair to an agreed standard. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Accessibility repair to the named standard |
| Done | Zero confirmed barriers remain in the agreed scope. |
| Stop | untested need; product blocker; budget exhausted. Bound: Agreed surfaces and named accessibility standard.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Accessibility repair to the named standard inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
