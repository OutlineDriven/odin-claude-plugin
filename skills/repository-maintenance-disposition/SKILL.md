---
name: repository-maintenance-disposition
description: 'Use when an authorized repository set needs bounded maintenance triage with per-item proof. Produces a proven maintenance disposition across authorized repositories with a K11 receipt. Not for unbounded sweeps or unapproved remote mutations.'
---

# Repository maintenance disposition

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An authorized repository set needs bounded maintenance triage with per-item proof. |
| Authority | ACTION_DEPENDENT_WITH_DANGEROUS_START_APPROVAL; approval: A1 for remote or destructive actions. Make one harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Proven maintenance disposition across authorized repositories |
| Done | Every selected item reaches a proved terminal or is preserved with an owner and reason. |
| Stop | permission blocked; scope cap. Bound: Exact repository set, item classes, and timebox. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Refusals

- **Scope drift**: rejected. The run ends when inspection drifts outside the frozen repository set, item classes, or timebox.
- **Unapproved remote or destructive action**: rejected. A1 start approval is required before the run; no post-start discovery or prior-run consent substitutes.
- **Budget exhaustion as success**: rejected unless predeclared. The run stops at `exhausted`.

## Procedure

1. Bind the declared bound and freeze it before mutation. **Done when**: the repository set, item classes, and timebox are frozen.
2. If `authority.approval` is not null, use the harness question tool once to collect start approval with the A1 sealed_fields list; end the run on scope drift. **Done when**: one A1 approval is collected or the run ends on scope drift.
3. Execute the proven maintenance disposition across authorized repositories inside the bound. **Done when**: every selected item reaches a proved terminal or is preserved with an owner and reason.
4. Stop at `outcome.success`, any `outcome.non_success`, or `outcome.bound`. **Done when**: exactly one terminal class is assigned.
5. Persist per `profiles.persistence.P1` (durable_location `.outline/loops/<slug>/<run_id>/` when durable; emit `receipt.json` before return). **Done when**: `receipt.json` is written with every K11 field.
6. Confirm `outcome.success` holds or a named `non_success`/`bound` terminal applies. **Done when**: the terminal class is verified against the run outcome.
7. Write an immutable K11 receipt with every K11 field. **Done when**: the receipt is written and immutable.

## Output

A `receipt.json` with terminal class, bound, per-item disposition, and every K11 field, ordered: bound freeze, approval, disposition execution, terminal assignment, persistence, receipt.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
