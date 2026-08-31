---
name: persona-coherence
description: 'Use when existing personas need contradiction checks against recent authorized evidence. Produces Evidence-coherent personas. Stop at the declared success, non-success, or bound.'
---

# persona-coherence

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Existing personas need contradiction checks against recent authorized evidence. |
| Authority | AUTHORIZED_RESEARCH_READ_REVERSIBLE_LOCAL |
| Side effect | Evidence-coherent personas |
| Done | Each persona is coherent or rebuilt from recent labeled evidence. |
| Stop | insufficient research; human review; rebuild cap. Bound: Declared personas, coherence threshold, and rebuild limit.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Evidence-coherent personas inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
