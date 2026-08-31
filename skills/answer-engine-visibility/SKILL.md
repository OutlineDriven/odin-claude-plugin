---
name: answer-engine-visibility
description: 'Use when Priority content needs repeatable search and answer-engine visibility checks and bounded repair. Produces Search and answer-engine visibility repair. Stop at the declared success, non-success, or bound.'
---

# Answer engine visibility

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Priority content needs repeatable search and answer-engine visibility checks and bounded repair. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Search and answer-engine visibility repair |
| Done | No high-impact gap remains against the fixed crawl/query benchmark. |
| Stop | blocked; volatile evidence; budget exhausted. Bound: Priority pages, queries, engines, locale, and pass cap. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen.
2. Execute the Search and answer-engine visibility repair inside the bound. Done when: the visibility repair is complete inside the bound.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: a terminal class is assigned.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: receipt.json is emitted with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
