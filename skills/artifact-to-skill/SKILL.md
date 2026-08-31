---
name: artifact-to-skill
description: 'Use when an authorized artifact contains a repeatable method that may deserve a reusable skill. Reconstruct the method as a reusable skill and validate it on a fresh case. Stop at the declared success, non-success, or bound.'
---

# Artifact to skill

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An authorized artifact contains a repeatable method that may deserve a reusable skill. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Produces a fresh-case-validated reusable skill reconstructed from an authorized artifact. |
| Done | The method generalizes on an independent fresh case. |
| Stop | provisional; not generalizable; blocked. Bound: At most two query/revision cycles. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen.
2. Inside the bound, reconstruct the reusable skill from the authorized artifact and validate it on a fresh case. Done when: the reconstructed skill is validated on a fresh case.
3. Stop at `outcome.success`, any `outcome.non_success`, or `outcome.bound`. Done when: a terminal class is assigned.
4. Persist per `profiles.persistence.P1` (`durable_location .outline/loops/<slug>/<run_id>/` when durable; emit `receipt.json` before return). Done when: `receipt.json` is emitted with every K11 field.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
