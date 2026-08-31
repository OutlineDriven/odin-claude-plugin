---
name: coding-agent-hook-safety
description: 'Use when A repository needs bounded coding-agent event guards for verification, scanning, or safe stopping. Produces Documented, scoped, safe coding-agent event hooks proved on allow and block paths. Stop at the declared success, non-success, or bound.'
---

# coding-agent-hook-safety

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A repository needs bounded coding-agent event guards for verification, scanning, or safe stopping. |
| Authority | REVERSIBLE_LOCAL_CONFIGURATION; approval: A1 if a proposed hook itself can perform a dangerous effect One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Documented, scoped, safe coding-agent event hooks proved on allow and block paths |
| Done | Every configured hook behaves safely on representative allowed and denied events. |
| Stop | unsafe command; malfunction; unproved failure policy. Bound: Declared events, goals, command allowlist, configuration files, and test cases.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift.
3. Execute the Documented, scoped, safe coding-agent event hooks proved on allow and block paths inside the bound.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-SHOW: source https://loops.show/loops. Record the loops.show URL, retrieval date, clean-room attestation, and unsupported upstream authorship/license fields. Expression reuse: none.
