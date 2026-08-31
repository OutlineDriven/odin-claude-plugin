---
name: ticket-to-review-ready-patch
description: 'Turn a ticket into the smallest credible review-ready patch backed by root-cause analysis. Not for unstructured fixes or remote, credential, publish, deploy, or irreversible changes.'
---

# Ticket to review-ready patch

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A ticket needs a root-cause-backed review-ready patch rather than an unstructured fix. |
| Authority | Reversible local: edit named source files; rollback via VCS. |
| Side effect | Ticket to smallest credible review-ready patch. |
| Done | Reproduction, root cause, patch, regression rerun, and reviewer evidence are complete. |
| Stop | Cannot reproduce; blocked; budget exhausted. Bound: one ticket and bounded reproduction attempts. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Refusals

- Will not ship a patch without a reproduced root cause.
- Will not claim success when the budget is exhausted unless exhaustion was the predeclared success predicate.
- Will not apply an unstructured fix that skips reproduction or root-cause analysis.

## Procedure

1. Bind the declared bound and freeze it before mutation. **Done when:** the bound is recorded and no mutation has begun.
2. Execute the ticket-to-patch flow inside the bound: reproduce, root-cause, patch, rerun regressions, assemble reviewer evidence. **Done when:** reproduction, root cause, patch, regression rerun, and reviewer evidence are complete.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. **Done when:** a terminal class is assigned.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Write an immutable K11 receipt with every K11 field. **Done when:** the receipt is written with every K11 field.

## Output

A receipt.json with the terminal class, bound, and patch evidence, persisted at .outline/loops/<slug>/<run_id>/ — ordering: bound, reproduction and root-cause evidence, patch and regression results, terminal verdict, receipt.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
