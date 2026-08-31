---
name: ad-network-readiness
description: 'Use when A free content or tool site is approaching advertising-network review or a material ad-layout change. Produces Content-site advertising-network readiness report. Stop at the declared success, non-success, or bound.'
---

# ad-network-readiness

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A free content or tool site is approaching advertising-network review or a material ad-layout change. |
| Authority | READ_ONLY_OR_REVERSIBLE_LOCAL; approval: A1 only if submission or publication is separately included One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Content-site advertising-network readiness report |
| Done | All declared content, policy, navigation, mobile, and ad-placement criteria pass. |
| Stop | evidenced no-go; policy uncertainty; blocked. Bound: Declared site, representative page sample, readiness criteria, and pass cap.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift.
3. Execute the Content-site advertising-network readiness report inside the bound.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-SHOW: source https://loops.show/loops. Record the loops.show URL, retrieval date, clean-room attestation, and unsupported upstream authorship/license fields. Expression reuse: none.
