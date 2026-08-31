---
name: goal-contract
description: 'Use when a goal or product contract needs complete requirement provenance, done evidence, and pre-build convergence, stopping at the declared success, non-success, or bound. Not for goal scaffolding before work starts — use goal-init.'
---

# Goal contract

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A goal or product contract needs complete requirement provenance, done evidence, and pre-build convergence. |
| Authority | READ_ONLY_WITH_RISKY_FIX_ASK; approval: A1 only when an approved dangerous fix is included. One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Implementation-ready requirement-to-evidence goal contract |
| Done | Every requirement is evidenced or reasoned N/A, the specification is ready, and the fixed review gate approves it. |
| Stop | open; weak; contradicted; unimplemented; blocked; review cap. Bound: One supplied product contract, goal packet, fixed rubric, and pass cap. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the stated action, evidence, and guard all hold.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift. Done when: the stated action, evidence, and guard all hold.
3. Execute the Implementation-ready requirement-to-evidence goal contract inside the bound. Done when: the stated action, evidence, and guard all hold.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: outcome.success holds or a named non_success/bound terminal applies.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: an immutable `receipt.json` exists before return with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
