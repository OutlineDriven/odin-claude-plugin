---
name: orchestrate
description: 'Use when a human explicitly requests orchestration of a large task across cloud agents to drain a verified task graph. Don''t use for tasks that require source or local-only changes or without explicit authorization for remote mutations.'
disable-model-invocation: true
---

# Orchestrate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human explicitly requests orchestration of a large task across cloud agents. |
| Authority | Act only under that explicit invocation; preview every remote target and consequence before using credentials, spawning agents or branches, writing orchestration state, or coordinating merges. |
| Side effect | Write only the approved orchestration state and create or change only the previewed remote agents, branches, and merges needed for the bounded task graph. |
| Done | The task graph is drained: every node has a verified handoff and a recorded terminal state, with approved merges coordinated or a truthful blocked or failed terminal result. |

## Inputs

The human must supply the objective, repository and starting revision, allowed scope, and permission to perform the previewed remote mutations. Obtain the acceptance criteria, branch and merge policy, available cloud-agent interface and credentials, and limits on concurrency, spend, and retries before execution; if any value is absent, treat the corresponding action as unauthorized rather than choosing it. Optional task decomposition or dependency information may be supplied and must be validated against the objective and repository state.

## Procedure

1. Validate the repository, starting revision, objective, acceptance criteria, permissions, credentials, and operational limits at their trust boundaries. Reject ambiguous targets, unusable credentials, contradictory criteria, and limits that cannot bound execution.
2. Inspect the bounded work and construct a finite dependency graph whose nodes have a single deliverable, allowed paths, prerequisites, acceptance check, and terminal states. Separate planning, implementation, and independent verification; do not add work that is not required by the objective.
3. Present the graph, remote targets, branch plan, concurrency and spend limits, merge policy, and mutation consequences to the human before the first credential use or remote mutation. Stop if the preview does not fit the explicit authorization.
4. Dispatch only ready nodes. Give each worker its node contract, starting revision, branch, dependencies, acceptance check, and required handoff fields; never let a worker silently widen scope or infer missing evidence.
5. Record each spawn and state transition. A worker handoff must identify its branch and revision, changed artifacts, checks actually run and observed results, unresolved risks, and terminal classification. Empty, malformed, or evidence-free handoffs are failures, not completions.
6. Run the named acceptance check for each completed node and independently verify that its handoff matches the branch contents and node contract. Return rejected work to a bounded retry only while its retry allowance remains and the next attempt addresses a specific observed failure.
7. Dispatch newly unblocked nodes after their prerequisites verify. Pause dependent dispatch on an andon condition: conflicting branches, stale starting revisions, unavailable checks, unsafe mutations, exhausted limits, repeated equivalent failures, or evidence that the graph is wrong.
8. Coordinate merges only in dependency order and under the approved merge policy. Revalidate the target revision and conflicts immediately before each merge; do not merge a node whose verification is missing, stale, or failed.
9. Continue until every node is verified and merged as authorized, or terminally blocked, failed, or cancelled. Record the final graph state and report only observed checks and mutations; never claim the done predicate while a node remains running, pending, or unverifiable.

## Failure and recovery
Classify failures as invalid input, authorization mismatch, spawn failure, worker failure, invalid handoff, verification failure, branch conflict, limit exhaustion, or orchestration-state failure. Before a remote mutation, validation or preview failure leaves remote state unchanged. After partial execution, stop new dispatch, preserve successful verified handoffs and exact branch revisions, and avoid merging affected nodes; do not delete remote work or rewrite branches unless the human explicitly authorizes that separately after a new preview. Retry only within the supplied limit and only from the last verified state with a specific corrective instruction. If recovery cannot satisfy the original graph without wider scope, new authority, unavailable evidence, or exhausted limits, terminate as `blocked`; use `failed` when an attempted node or merge definitively violated its contract, and `cancelled` when the human revokes authority. Include the failing node, observed error, completed mutations, preserved partial results, and the exact human action or evidence required. Never swallow an error, fabricate a handoff, or report success from an incomplete graph.

## Output
Return the final task graph with each node's terminal classification, branch and revision, verified handoff, checks actually observed, merge result, remote mutations performed, and remaining risks. The overall terminal classification is `completed`, `blocked`, `failed`, or `cancelled`; `completed` is valid only when the graph is drained and every authorized merge and verification satisfies the contract.

## Provenance

Adapted from `cursor/plugins` candidate `source:source-cursor:cursor-orchestrate` at revision `68836ddaf5697224520f1847d90cdb90ca8babaa`, licensed MIT. This adaptation preserves planner, dispatcher, cloud-worker spawning, branch coordination, structured handoff, independent verifier, and stop-condition mechanisms while expressing a self-contained ODIN procedure.
