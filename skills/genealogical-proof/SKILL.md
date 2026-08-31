---
name: genealogical-proof
description: 'Use when a genealogical identity or relationship needs correlation, conflict, and negative-search proof. Produces Genealogical proof finding. Stop at the declared success, non-success, or bound.'
---

# genealogical-proof

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A genealogical identity or relationship needs correlation, conflict, and negative-search proof. |
| Authority | READ_ONLY_WITH_PAID_OR_LIVING_DATA_ASK; approval: A1 for paid access or living-person data One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Genealogical proof finding |
| Done | The identity proposition is classified proved, disproved, likely, or possible with a proof note. |
| Stop | conflicting; unresolved; blocked. Bound: One proof question, approved repositories, date range, and pass cap.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift.
3. Execute the Genealogical proof finding inside the bound.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
