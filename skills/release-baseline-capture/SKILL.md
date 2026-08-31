---
name: release-baseline-capture
description: 'Use when a verified release needs a reproducible append-only benchmark baseline. Produces Release-bound benchmark baseline. Stop at the declared success, non-success, or bound.'
---

# release-baseline-capture

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A verified release needs a reproducible append-only benchmark baseline. |
| Authority | READ_ONLY_OR_REVERSIBLE_LOCAL |
| Side effect | Release-bound benchmark baseline |
| Done | A reproducible valid baseline is bound to the verified release. |
| Stop | invalid run; no baseline; blocked. Bound: One release and bounded reruns.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Release-bound benchmark baseline inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
