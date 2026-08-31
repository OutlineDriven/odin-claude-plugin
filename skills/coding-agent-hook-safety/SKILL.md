---
name: coding-agent-hook-safety
description: 'Use when a repository needs bounded coding-agent event guards for verification, scanning, or safe stopping. Produces documented, scoped hooks proved on allow and block paths, stopping at success, non-success, or the bound.'
---

# Coding-agent hook safety

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A repository needs bounded coding-agent event guards for verification, scanning, or safe stopping. |
| Authority | REVERSIBLE_LOCAL_CONFIGURATION. Approval: A1 if a proposed hook itself can perform a dangerous effect. Make one harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Documented, scoped, safe coding-agent event hooks proved on allow and block paths. |
| Done | Every configured hook behaves safely on representative allowed and denied events. |
| Stop | unsafe command; malfunction; unproved failure policy. Bound: Declared events, goals, command allowlist, configuration files, and test cases. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and recorded before any mutation occurs.
2. If authority.approval is not null, collect start approval once with the harness question tool, using the A1 sealed_fields list. Do this before the run starts, and end the run on scope drift. Done when: approval is collected or authority.approval is null, and scope drift ends the run.
3. Execute the documented, scoped, safe coding-agent event hooks inside the bound, and prove both allow and block paths. Done when: every configured hook is proved safe on representative allowed and denied events.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: a terminal class is assigned.
5. Persist per profiles.persistence.P1. When durable, use durable_location .outline/loops/<slug>/<run_id>/; emit receipt.json before returning. Done when: receipt.json is written with every K11 field and outcome.success holds or a named non_success/bound terminal applies.

## Provenance

- Profile P-SHOW: source https://loops.show/loops. Record the loops.show URL, retrieval date, clean-room attestation, and unsupported upstream authorship/license fields. Expression reuse: none.
