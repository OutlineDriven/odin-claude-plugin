---
name: database-query-shape-audit
description: 'Use when database-backed public query code changes or shows measured performance or correctness risk. Produces a measured audit of query shape, pagination, indexes, N+1 queries, bounds, and render safety. Not for schema migration review — use database-migration-safety-review.'
---

# database-query-shape-audit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Database-backed public query code changes or shows measured performance or correctness risk. |
| Authority | REVERSIBLE_LOCAL; approval: A1 only for production schema migration. One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Measured query-shape, pagination, index, N+1, bounds, and render-safety audit |
| Done | Public query paths are bounded, free of identified N+1 defects, and indexed where evidence warrants. |
| Stop | blocked; migration required but unapproved. Bound: Declared list/detail query paths, workload assumptions, plans, and result bounds. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is recorded and immutable for the run.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift. Done when: approval is granted or the run is terminated on scope drift.
3. Execute the measured query-shape, pagination, index, N+1, bounds, and render-safety audit inside the bound. Done when: the audit completes or hits a stop condition.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: exactly one terminal status is recorded.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: an immutable K11 receipt with every K11 field is written.

## Provenance

- Profile P-SHOW: source https://loops.show/loops. Record the loops.show URL, retrieval date, clean-room attestation, and unsupported upstream authorship/license fields. Expression reuse: none.
