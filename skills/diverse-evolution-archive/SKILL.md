---
name: diverse-evolution-archive
description: 'Use when An ML program or model needs bounded population search rather than one sequential refinement path. Produces Diversity-preserving MAP-Elites evolution archive. Stop at the declared success, non-success, or bound.'
---

# diverse-evolution-archive

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An ML program or model needs bounded population search rather than one sequential refinement path. |
| Authority | REVERSIBLE_LOCAL_WITH_COMPUTE_SPEND_START_APPROVAL_WHEN_PAID; approval: A1 when paid compute/model calls occur One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Diversity-preserving MAP-Elites evolution archive |
| Done | The fixed compute budget produces a checkpointed archive of diverse valid high performers. |
| Stop | no valid child; smoke rejection; OOM or crash; blocked. Bound: Fixed total compute budget and probe-derived parallelism.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift.
3. Execute the Diversity-preserving MAP-Elites evolution archive inside the bound.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-ALS: source https://github.com/gaasher/Agent-Loop-Skills. Retain the upstream MIT copyright and license notice for adapted support code or expression.
