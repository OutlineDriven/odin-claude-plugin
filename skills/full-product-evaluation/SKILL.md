---
name: full-product-evaluation
description: 'Use when a complete product, rather than one component, needs production-like acceptance evidence against its documented acceptance criteria. Stops at declared success, non-success, or bound.'
---

# Full-product evaluation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A complete product, rather than one component, needs production-like acceptance evidence. |
| Authority | REVERSIBLE_LOCAL_WITH_PRODUCTION_ASK; approval: A1 when production action is included. One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Full-product acceptance evaluation. |
| Done | Every in-scope capability meets its documented acceptance criteria. |
| Stop | blocked handoff; budget exhausted. Bound: Documented capability inventory and pass cap. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Not for

- Single-component or single-function evaluation — scope to that component instead.
- Evaluation without documented acceptance criteria — stop and request them.

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and no further scope drift is accepted.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift. Done when: approval is collected or confirmed absent.
3. Execute the full-product acceptance evaluation inside the bound. Done when: every in-scope capability meets its documented acceptance criteria or a terminal class applies.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: a terminal class is reached and recorded.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: receipt.json is emitted with every K11 field and outcome.success holds or a named non_success/bound terminal applies.

## Failure and recovery

- **Blocked handoff**: a dependency or precondition is missing; emit a blocked receipt naming the missing item.
- **Budget exhausted**: emit an exhausted receipt; budget exhaustion is never success unless it is the predeclared success predicate.

## Output

An immutable K11 receipt with every K11 field, recording the terminal class (success, capped, stalled, blocked, exhausted, or pending) and the evaluation outcome.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
