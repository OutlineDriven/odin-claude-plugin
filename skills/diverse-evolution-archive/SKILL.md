---
name: diverse-evolution-archive
description: 'Use when an ML program or model needs bounded population search rather than one sequential refinement path. Produces a diversity-preserving MAP-Elites evolution archive. Stops at the declared success, non-success, or bound.'
---

# Diverse evolution archive

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An ML program or model needs bounded population search rather than one sequential refinement path. |
| Authority | REVERSIBLE_LOCAL_WITH_COMPUTE_SPEND_START_APPROVAL_WHEN_PAID; approval: A1 when paid compute/model calls occur. Use one harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Diversity-preserving MAP-Elites evolution archive |
| Done | The fixed compute budget produces a checkpointed archive of diverse valid high performers. |
| Stop | no valid child; smoke rejection; OOM or crash; blocked. Bound: Fixed total compute budget and probe-derived parallelism. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. **Done when:** the bound is frozen before mutation.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift. **Done when:** approval is collected once or scope drift ends the run.
3. Execute the diversity-preserving MAP-Elites evolution archive inside the bound. **Done when:** archive evolution runs inside the bound.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound. **Done when:** a declared terminal is reached.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). **Done when:** receipt.json is emitted before return.

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies. **Done when:** success or a named terminal is confirmed.
2. Write an immutable K11 receipt with every K11 field. **Done when:** the complete K11 receipt is written.

## Output
A checkpointed diversity-preserving MAP-Elites archive plus an immutable K11 receipt, ordered bind → approve → evolve → stop → persist → verify, stopping at the declared success, non-success, or bound.

## Provenance

- Profile P-ALS: source https://github.com/gaasher/Agent-Loop-Skills. Retain the upstream MIT copyright and license notice for adapted support code or expression.
