---
name: literature-set-verification
description: 'Use when a question needs a deduplicated relevant paper set with verified metadata. Produces Deduplicated DOI-verified relevant literature set. Stop at the declared success, non-success, or bound.'
---

# literature-set-verification

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A question needs a deduplicated relevant paper set with verified metadata. |
| Authority | READ_ONLY |
| Side effect | Deduplicated DOI-verified relevant literature set |
| Done | The verified relevant set clears the stated minimum-sample gate. |
| Stop | needs review; blocked; exhausted. Bound: Stated minimum sample and bounded query revisions.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Deduplicated DOI-verified relevant literature set inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
