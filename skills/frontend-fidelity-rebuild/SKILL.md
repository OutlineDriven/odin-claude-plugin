---
name: frontend-fidelity-rebuild
description: 'Use when an authorized reference surface needs a clean-room frontend reconstruction across static, motion, and responsive fidelity. Not for styling or component work — use frontend-ui or frontend-design-deslop. Stops at declared success, non-success, or bound.'
---

# Frontend fidelity rebuild

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An authorized reference surface needs a clean-room frontend reconstruction. |
| Authority | IP_AUTHORIZATION_START_APPROVAL; approval: A1 One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Authorized frontend reconstruction across static, motion, and responsive fidelity. |
| Done | The clean-room reconstruction clears all three fixed fidelity gates. |
| Stop | capture blocked; authorization absent; stagnation. Bound: Exact approved reference, surfaces, and round cap. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Not for

- Styling or component work without a reference surface — use frontend-ui or frontend-design-deslop.
- Unauthorized reconstruction — IP authorization is required before any effect.

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and no further scope drift is accepted.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift. Done when: approval is collected or confirmed absent.
3. Execute the authorized frontend reconstruction across static, motion, and responsive fidelity inside the bound. Done when: all three fidelity gates clear or a terminal class applies.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: a terminal class is reached and recorded.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: receipt.json is emitted with every K11 field and outcome.success holds or a named non_success/bound terminal applies.

## Failure and recovery

- **Authorization absent**: stop before any effect; emit a blocked receipt naming the missing approval.
- **Scope drift after binding**: end the run; emit a stalled or blocked receipt.
- **Budget exhausted**: emit an exhausted receipt; budget exhaustion is never success unless it is the predeclared success predicate.

## Output

An immutable K11 receipt with every K11 field, recording the terminal class (success, capped, stalled, blocked, exhausted, or pending) and the reconstruction outcome.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
