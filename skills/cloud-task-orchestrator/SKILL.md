---
name: cloud-task-orchestrator
description: 'Use when a human explicitly runs /cloud-task-orchestrator for a large task across cloud agents to drain a verified task graph. Not for local subagent coordination — use orchestration-patterns.'
disable-model-invocation: true
---

# Cloud task orchestrator

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human explicitly runs /cloud-task-orchestrator for a large task across cloud agents. |
| Authority | Act only under that explicit invocation; preview every remote target and consequence before using credentials, spawning agents or branches, writing orchestration state, or coordinating merges. |
| Side effect | Write only the approved orchestration state and create or change only the previewed remote agents, branches, and merges needed for the bounded task graph. |
| Done | The task graph is drained: every node has a verified handoff and a recorded terminal state, with approved merges coordinated or a truthful blocked or failed terminal result. |

## Inputs

The human must supply the objective, repository and starting revision, allowed scope, and permission to perform the previewed remote mutations. Obtain the acceptance criteria, branch and merge policy, available cloud-agent interface and credentials, and limits on concurrency, spend, and retries before execution; if any value is absent, treat the corresponding action as unauthorized rather than choosing it. Optional task decomposition or dependency information may be supplied and must be validated against the objective and repository state.

## Procedure

1. Validate the repository, starting revision, objective, acceptance criteria, permissions, credentials, and operational limits at their trust boundaries. Reject ambiguous targets, unusable credentials, contradictory criteria, and limits that cannot bound execution. Done when: all inputs are validated at their trust boundaries or rejected with a named conflict.
2. Inspect the bounded work and construct a finite dependency graph whose nodes have a single deliverable, allowed paths, prerequisites, acceptance check, and terminal states. Separate planning, implementation, and independent verification; do not add work that is not required by the objective. Done when: a finite dependency graph is constructed with every node having a deliverable, paths, prerequisites, acceptance check, and terminal states.
3. Present the graph, remote targets, branch plan, concurrency and spend limits, merge policy, and mutation consequences to the human before the first credential use or remote mutation. Stop if the preview does not fit the explicit authorization. Done when: the human approves the preview or the preview is rejected and no mutation occurs.
4. Dispatch only ready nodes. Give each worker its node contract, starting revision, branch, dependencies, acceptance check, and required handoff fields; never let a worker silently widen scope or infer missing evidence. Done when: every ready node is dispatched with its complete node contract.
5. Record each spawn and state transition. A worker handoff must identify its branch and revision, changed artifacts, checks actually run and observed results, unresolved risks, and terminal classification. Empty, malformed, or evidence-free handoffs are failures, not completions. Done when: every spawn and state transition is recorded with complete handoff fields.
6. Run the named acceptance check for each completed node and independently verify that its handoff matches the branch contents and node contract. Return rejected work to a bounded retry only while its retry allowance remains and the next attempt addresses a specific observed failure. Done when: every completed node's acceptance check is run and its handoff is independently verified.
7. Dispatch newly unblocked nodes after their prerequisites verify. Pause dependent dispatch on an andon condition: conflicting branches, stale starting revisions, unavailable checks, unsafe mutations, exhausted limits, repeated equivalent failures, or evidence that the graph is wrong. Done when: all newly unblocked nodes are dispatched or dependent dispatch is paused with a named andon condition.
8. Coordinate merges only in dependency order and under the approved merge policy. Revalidate the target revision and conflicts immediately before each merge; do not merge a node whose verification is missing, stale, or failed. Done when: all approved merges are coordinated in dependency order with revalidated target revisions.
9. Continue until every node is verified and merged as authorized, or terminally blocked, failed, or cancelled. Record the final graph state and report only observed checks and mutations; never claim the done predicate while a node remains running, pending, or unverifiable. Done when: every node has a terminal state (verified/merged, blocked, failed, or cancelled) and the final graph state is recorded.

## Failure and recovery

Classify failures as invalid input, authorization mismatch, spawn failure, worker failure, invalid handoff, verification failure, branch conflict, limit exhaustion, or orchestrator-state failure. Before a remote mutation, validation or preview failure leaves remote state unchanged. After partial execution, stop new dispatch, preserve successful verified handoffs and exact branch revisions, and avoid merging affected nodes; do not delete remote work or rewrite branches unless the human explicitly authorizes that separately after a new preview. Retry only within the supplied limit and only from the last verified state with a specific corrective instruction. If recovery cannot satisfy the original graph without wider scope, new authority, unavailable evidence, or repeated equivalent failures, return `blocked` with the specific blocker and the last verified graph state.

## Output

Return the final task graph with each node's terminal classification, branch and revision, verified handoff, checks actually observed, merge result, remote mutations performed, and remaining risks. Terminal classification: `completed`, `blocked`, `failed`, or `cancelled`; `completed` is valid only when the graph is drained and every authorized merge and verification satisfies the contract.
