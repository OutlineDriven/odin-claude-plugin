---
name: database-migration-safety-review
description: 'Use when A database schema or migration artifact changes. Produces Migration compatibility, destructive-effect, index, and rollback safety review. Stop at the declared success, non-success, or bound.'
---

# database-migration-safety-review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A database schema or migration artifact changes. |
| Authority | REVERSIBLE_LOCAL_GENERATION_AND_REVIEW; approval: A1 only for a separate production migration or data change One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Migration compatibility, destructive-effect, index, and rollback safety review |
| Done | No unexpected destructive operation remains and the migration plan is reviewed. |
| Stop | blocked; unreviewed irreversible effect. Bound: One schema baseline and migration artifact set.. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift.
3. Execute the Migration compatibility, destructive-effect, index, and rollback safety review inside the bound.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return).

## Verification

1. Confirm outcome.success holds or a named non_success/bound terminal applies.
2. Write an immutable K11 receipt with every K11 field.

## Provenance

- Profile P-SHOW: source https://loops.show/loops. Record the loops.show URL, retrieval date, clean-room attestation, and unsupported upstream authorship/license fields. Expression reuse: none.
