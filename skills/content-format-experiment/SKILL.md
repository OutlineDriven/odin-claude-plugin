---
name: content-format-experiment
description: 'Use when a public content format needs a finite single-variable experiment. Runs the experiment to a material winner on comparable metrics, stopping at success, non-success, or the bound.'
---

# Content format experiment

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A public content format needs a finite single-variable experiment. |
| Authority | PUBLIC_PUBLISH_START_APPROVAL; approval: A1 One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Evidence-backed content-format experiment |
| Done | One format materially wins on comparable substantive replies, saves, and questions. |
| Stop | honest no-winner; metrics unavailable; approval blocked. Bound: A fixed approved finite post set and one changed variable. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and recorded before any mutation occurs.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift. Done when: approval is collected or authority.approval is null, and scope drift ends the run.
3. Execute the evidence-backed content-format experiment inside the bound. Done when: the experiment runs to a terminal outcome.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: a terminal class is assigned.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: receipt.json is written with every K11 field and outcome.success holds or a named non_success/bound terminal applies.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
