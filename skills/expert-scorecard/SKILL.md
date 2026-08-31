---
name: expert-scorecard
description: 'Use when an artifact needs fresh independent rescoring to a fixed multidimensional bar. Produces an independently rescored expert scorecard. Stop at the declared success, non-success, or bound.'
---

# Expert scorecard

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An artifact needs fresh independent rescoring to a fixed multidimensional bar. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Independently rescored expert scorecard |
| Done | Every fixed dimension reaches 5/5 and objective red checks are clear. |
| Stop | stagnation; blocked; budget exhausted. Bound: Fixed rubric and round cap. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen before any mutation.
2. Execute the independently rescored expert scorecard inside the bound. Done when: the expert scorecard is independently rescored.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: a terminal condition is reached (success, non_success, or bound).
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: the receipt is persisted with every K11 field and outcome.success holds or a named non_success/bound terminal applies.

## Failure and recovery
- Stagnation: stop and report the stall; do not grind past the round cap.
- Blocked: report the blocker and what was tried.
- Budget exhausted: report the exhaustion; budget exhaustion is never success unless it is the predeclared success predicate.

## Output
An independently rescored expert scorecard with every fixed dimension at 5/5 and objective red checks clear, plus an immutable K11 receipt.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
