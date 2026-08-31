---
name: environment-contract-audit
description: 'Use when environment-dependent code, templates, or deployment configuration changes, or when runtime configuration is missing. Produces bidirectionally reconciled environment-variable contract. Stop at the declared success, non-success, or bound.'
---

# Environment contract audit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Environment-dependent code, templates, or deployment configuration changes, or runtime configuration is missing. |
| Authority | READ_ONLY_OR_REVERSIBLE_LOCAL. Approval: A1 only for production secret, credential, or remote configuration mutation. Make one harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Bidirectionally reconciled environment-variable contract. |
| Done | Every referenced variable is supplied and documented at the correct required/optional and public/secret scope. |
| Stop | exact blocker; unsafe exposure. Bound: Declared code, templates, runtime config, and deployment-config surfaces. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen before any mutation.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift. Done when: start approval is collected or the run ends on scope drift.
3. Execute the bidirectionally reconciled environment-variable contract inside the bound. Done when: the environment-variable contract is bidirectionally reconciled.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: a terminal condition is reached (success, non_success, or bound).
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: the receipt is persisted with every K11 field and outcome.success holds or a named non_success/bound terminal applies.

## Failure and recovery
- Exact blocker: stop and report the blocker; do not proceed past the bound.
- Unsafe exposure: stop before exposing a secret or credential in an unsafe scope; report the exposure risk.

## Output
A bidirectionally reconciled environment-variable contract with every referenced variable supplied and documented at the correct required/optional and public/secret scope, plus an immutable K11 receipt.

## Provenance

- Profile P-SHOW: source https://loops.show/loops. Record the loops.show URL, retrieval date, clean-room attestation, and unsupported upstream authorship/license fields. Expression reuse: none.
