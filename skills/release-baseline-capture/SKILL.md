---
name: release-baseline-capture
description: 'Use when a verified release needs a reproducible append-only benchmark baseline. Produces a Release-bound benchmark baseline with a K11 receipt. Not for ad-hoc benchmarks — use the project''s benchmark runner directly.'
---

# Release baseline capture

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A verified release needs a reproducible append-only benchmark baseline. |
| Authority | READ_ONLY_OR_REVERSIBLE_LOCAL |
| Side effect | Release-bound benchmark baseline |
| Done | A reproducible valid baseline is bound to the verified release. |
| Stop | invalid run; no baseline; blocked. Bound: One release and bounded reruns. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Refusals

- **Budget exhaustion as success**: rejected unless it is the predeclared success predicate. The run stops at `exhausted`, not `success`.
- **Invalid run**: no baseline is bound. The run stops at `blocked` with the validation failure named.
- **Scope beyond one release**: rejected. The bound is one release and bounded reruns.

## Procedure

1. Bind the declared bound and freeze it before mutation. **Done when**: the bound is frozen and cannot change for the rest of the run.
2. Execute the Release-bound benchmark baseline inside the bound. **Done when**: the benchmark produces a terminal outcome (success, non_success, or bound).
3. Stop at `outcome.success`, any `outcome.non_success`, or `outcome.bound`. **Done when**: exactly one terminal class is assigned.
4. Persist per `profiles.persistence.P1` (durable_location `.outline/loops/<slug>/<run_id>/` when durable; emit `receipt.json` before return). **Done when**: `receipt.json` is written with every K11 field.
5. Confirm `outcome.success` holds or a named `non_success`/`bound` terminal applies. **Done when**: the terminal class is verified against the run outcome.
6. Write an immutable K11 receipt with every K11 field. **Done when**: the receipt is written and immutable.

## Output

A `receipt.json` with terminal class, bound, and every K11 field, ordered: bound freeze, benchmark execution, terminal assignment, persistence, receipt.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
