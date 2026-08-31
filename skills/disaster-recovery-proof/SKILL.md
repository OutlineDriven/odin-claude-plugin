---
name: disaster-recovery-proof
description: 'Use when a disaster-recovery plan needs an isolated restore and repeated scenario proof. Produces a repeatable disaster-recovery proof. Stops at the declared success, non-success, or bound.'
---

# Disaster recovery proof

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A disaster-recovery plan needs an isolated restore and repeated scenario proof. |
| Authority | PRODUCTION_FAILOVER_START_APPROVAL; approval: A1 One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | A repeatable disaster-recovery proof. |
| Done | Every required recovery scenario meets the consecutive-success requirement. |
| Stop | exception pending approval; blocked; streak exhausted. Bound: Exact approved scenarios and fixed success streak. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. **Done when:** the bound is frozen before any mutation.

2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift. **Done when:** start approval is collected once or the run ends on scope drift.

3. Execute the repeatable disaster-recovery proof inside the bound. **Done when:** the proof executes within the bound.

4. Stop at outcome.success, any outcome.non_success, or outcome.bound. **Done when:** the run stops at a declared terminal.

5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). **Done when:** receipt.json is emitted before return.

## Verification
1. Confirm outcome.success holds or a named non_success/bound terminal applies. **Done when:** success or a named terminal is confirmed.
2. Write an immutable K11 receipt with every K11 field. **Done when:** the K11 receipt is written with every field.

## Output
A repeatable disaster-recovery proof with every required scenario meeting the consecutive-success requirement, plus an immutable K11 receipt, ordered bind → approve → execute → stop → persist → verify, stopping at the declared success, non-success, or bound.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
