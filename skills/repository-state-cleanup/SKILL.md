---
name: repository-state-cleanup
description: 'Use when stale repository objects need evidence-backed cleanup after recoverable work is rescued. Produces evidence-backed repository-state cleanup with a K11 receipt. Not for speculative pruning or cleanup without rescue — rescue first, then clean.'
---

# Repository state cleanup

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Stale repository objects need evidence-backed cleanup after recoverable work is rescued. |
| Authority | DANGEROUS_GIT_START_APPROVAL; approval: A1 One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Evidence-backed repository-state cleanup |
| Done | Every remaining branch, PR, commit, and worktree is intentional. |
| Stop | uncertain state preserved; blocked; scope exhausted. Bound: Exact approved repositories and object classes. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Refusals

- **Uncertain state**: preserved, not cleaned. The run stops at `blocked` when object intent cannot be determined.
- **Unapproved destructive git action**: rejected. A1 start approval is required; no post-start discovery substitutes.
- **Budget exhaustion as success**: rejected unless predeclared. The run stops at `exhausted`.

## Procedure

1. Bind the declared bound and freeze it before mutation. **Done when**: the approved repositories and object classes are frozen.
2. If `authority.approval` is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift. **Done when**: one A1 approval is collected or the run ends on scope drift.
3. Execute the evidence-backed repository-state cleanup inside the bound. **Done when**: every remaining branch, PR, commit, and worktree is intentional or preserved with a reason.
4. Stop at `outcome.success`, any `outcome.non_success`, or `outcome.bound`. **Done when**: exactly one terminal class is assigned.
5. Persist per `profiles.persistence.P1` (durable_location `.outline/loops/<slug>/<run_id>/` when durable; emit `receipt.json` before return). **Done when**: `receipt.json` is written with every K11 field.
6. Confirm `outcome.success` holds or a named `non_success`/`bound` terminal applies. **Done when**: the terminal class is verified against the run outcome.
7. Write an immutable K11 receipt with every K11 field. **Done when**: the receipt is written and immutable.

## Output

A `receipt.json` with terminal class, bound, per-object disposition, and every K11 field, ordered: bound freeze, approval, cleanup execution, terminal assignment, persistence, receipt.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
