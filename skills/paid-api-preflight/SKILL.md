---
name: paid-api-preflight
description: 'Use when a paid API call needs a fresh integrity-checked provider decision before any spend. Produces Fresh signed paid-API preflight attestation. Stop at the declared success, non-success, or bound.'
---

# paid-api-preflight

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A paid API call needs a fresh integrity-checked provider decision before any spend. |
| Authority | SPEND_CREDENTIAL_START_APPROVAL; approval: A1 One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Fresh signed paid-API preflight attestation |
| Done | A verifiable provider fits the task's freshness, uptime, latency, price, budget, and deadline constraints. |
| Stop | missing data; invalid signature; no provider fits. Bound: Exact providers and one task/spend budget.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift.
3. Execute the Fresh signed paid-API preflight attestation inside the bound.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
