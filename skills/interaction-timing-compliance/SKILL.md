---
name: interaction-timing-compliance
description: 'Use when interaction tokens and runtime behavior need measured timing compliance. Produces Runtime interaction timing compliance. Stop at the declared success, non-success, or bound.'
---

# interaction-timing-compliance

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Interaction tokens and runtime behavior need measured timing compliance. |
| Authority | REVERSIBLE_LOCAL_WITH_THIRD_PARTY_ASK |
| Side effect | Runtime interaction timing compliance |
| Done | Real-browser measurement finds zero violations against the fixed timing specification. |
| Stop | product blocker; third-party blocked; budget exhausted. Bound: Declared components and timing specification.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Runtime interaction timing compliance inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
