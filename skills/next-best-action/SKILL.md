---
name: next-best-action
description: 'Use when a project is between phases, the author asks what to do next, too many threads are open, or work needs re-entry. Returns exactly one next action with an observable done-when and a cited reason it beats other visible options. Not for gating whether one named task may proceed.'
---

# Next best action

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A project is between phases, the author asks what to do next, too many valid threads are open, or the work needs re-entry into frame, build, drive, memo, assumption testing, restart, or ship |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | None — returns one action recommendation |
| Done | The recommendation cites the state it read; there is exactly one next action; the action has a clear done-when observable; a reader can tell why this action beats the other visible options |

## Inputs

- Project state description from the author: where the project is, what is blocked, what the goal is. **Required — absent required state blocks the skill; it does not proceed with caveats.**
- Current supplied context: any plan files, task lists, or recent task outputs present in the conversation's current context. Optional.
- Explicit redacted evidence: any named artifact the author explicitly supplies as redacted evidence for this invocation. Optional.
- Named current task/plan artifacts: any plan, brief, or task file reachable as a named artifact in the current session. Optional.

## Procedure

1. Read the current supplied context: plan files, task lists, recent task outputs, and named current task/plan artifacts present in the conversation. Done when: all available context is read.
2. Identify the highest-priority unblocked task, the most critical blocker, or the single action whose completion would most advance the stated goal. Done when: one candidate action is identified.
3. Select exactly one action as the next best action. Done when: exactly one action is selected.
4. Cite the specific evidence from step 1 that supports this selection. Done when: the evidence citation names the source artifact or context.
5. State the done-when observable: a concrete, verifiable condition that marks the action complete. Done when: the done-when is observable and verifiable.
6. Name one alternative option that was considered and state why the selected action beats it. Done when: one alternative is named with a stated reason the selection wins.

## Failure and recovery

| Failure class | Condition | Result |
|---|---|---|
| insufficient-state | No author-supplied state description and no current supplied context reachable as a named artifact | Block: return "blocked: insufficient state — supply a project state description or make a plan/task artifact available in the current context" |
| missing-required-evidence | Author-supplied state description is absent | Block: do not proceed; return "blocked: required project state description missing" |
| ambiguous-priority | Multiple actions tie for highest priority | Pick one based on the author's stated goal; note the tie in the recommendation |
| no-clear-done-when | Selected action has no observable completion condition | Do not return it; state "no clear next action" and stop |

Partial-result rule: if optional evidence exists but is incomplete, return what is readable with a caveat that the recommendation is partial.
Non-mutation rule: authority is read-only; return no changes to any file, variable, or state.

## Output

One prioritized action recommendation: next action, evidence citation, done-when observable, reason it beats one alternative — in that order, plain text, exactly one action.
