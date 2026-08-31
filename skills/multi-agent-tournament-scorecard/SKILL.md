---
name: multi-agent-tournament-scorecard
description: 'Use when agent strategies need a reproducible finite tournament under a frozen evaluation protocol. Produces Reproducible multi-agent tournament scorecard. Stop at the declared success, non-success, or bound.'
---

# multi-agent-tournament-scorecard

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Agent strategies need a reproducible finite tournament under a frozen evaluation protocol. |
| Authority | READ_ONLY_EVALUATION |
| Side effect | Reproducible multi-agent tournament scorecard |
| Done | The fixed matrix completes with saved move records, scores, and hidden-identity validation. |
| Stop | incomplete matchup; invalid run; blocked. Bound: Explicit finite matchup/round matrix.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. Execute the Reproducible multi-agent tournament scorecard inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
