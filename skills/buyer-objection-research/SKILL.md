---
name: buyer-objection-research
description: 'Use when Product copy needs buyer-objection evidence collected through approved outreach. Produces Buyer-objection copy recommendation grounded in anonymized exact language. Stop at the declared success, non-success, or bound.'
---

# buyer-objection-research

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Product copy needs buyer-objection evidence collected through approved outreach. |
| Authority | OUTREACH_AND_PUBLIC_COPY_START_APPROVAL; approval: A1 One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Buyer-objection copy recommendation grounded in anonymized exact language |
| Done | The evidence supports a copy recommendation or shows the concern disappeared. |
| Stop | interview cap; access blocked; budget exhausted. Bound: Exact approved recipients in bounded batches, with a total interview cap.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift.
3. Execute the Buyer-objection copy recommendation grounded in anonymized exact language inside the bound.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
