---
name: partition-scopes-to-subagents
description: 'Use when asked to partition non-overlapping scopes across subagents and drive each to completion. Not for concurrent independent sub-tasks: use parallel-launch.'
---

# Partition scopes to subagents

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User names work that decomposes into non-overlapping scopes and asks to partition and execute them with subagents. |
| Authority | Reversible local: writes only each subagent's assigned files, per-scope artifacts, and a coordination map; rollback is version control or undo. No remote mutation. |
| Side effect | Subagent briefs, per-scope work artifacts, review reports, fix reports, and an actual-work map written to local files only. |
| Done | All scopes return a review report and a fix report; an actual-work map lists every scope and its terminal status. |

## Inputs

- Scopes (required): Named, non-overlapping work units with explicit boundaries. Supplied by the user or derived from a map the user provides.
- Scope assignment (required): Which subagent owns which scope. Stated explicitly by the user or inferred from a DAG/map the user approves.
- Review duty (required): Each scope requires a fresh reviewer subagent after the implementer subagent completes. The reviewer is not the implementer.
- Compiled map (optional): A DAG, war map, or state machine providing deterministic skeleton routing. Provide it if the user supplied one; otherwise derive from the stated scopes.

## Procedure

1. **Validate scope non-overlap.** Before dispatching any subagent, confirm each named scope touches disjoint file sets or the user explicitly approved overlap. Stop if two scopes target the same file. Done when: all scopes are confirmed non-overlapping or overlap is user-approved.
2. **Compile the map.** If the user supplied a DAG or war map, adopt it as the execution skeleton. If not, derive a flat execution map from the stated scopes: one node per scope, no ordering edges. The map is the source of truth for what each subagent must do. Done when: the execution map is compiled and adopted as source of truth.
3. **Draft scope briefs.** For each scope, write a self-contained subagent brief containing: goal (one sentence), exact files or directories in scope, constraints from the parent task, and the completion predicate. Briefs are paths, not pasted content. Done when: a self-contained brief is written for each scope.
4. **Dispatch implementer subagents.** Dispatch one fresh implementer subagent per scope with its brief. Each implementer works in isolation and writes its result to a per-scope artifact file. Done when: one implementer is dispatched per scope with its brief.
5. **Dispatch fresh reviewer subagents.** After each implementer completes, dispatch a new reviewer subagent to audit that scope's artifact. The reviewer is not the same agent as the implementer. Collect the review report per scope. Done when: a fresh reviewer is dispatched per scope and review reports are collected.
6. **Route fix reports.** If the reviewer reports findings, dispatch a fix subagent for that scope and collect its fix report. Repeat review until the reviewer reports no blocking findings for that scope. Done when: each scope's reviewer reports no blocking findings.
7. **Record in the actual-work map.** After each scope reaches its terminal review status, write one entry in the actual-work map: scope name, implementer status, reviewer status, fix count, and terminal verdict. Done when: every scope has an entry in the actual-work map.
8. **Converge.** Once all scopes have terminal verdicts and all review reports are filed, the skill is done. Done when: all scopes have terminal verdicts and review reports are filed.

## Failure and recovery
- Scope overlap detected: Stop before dispatch. Return the conflicting scopes and ask the user to clarify boundaries.
- Subagent reports BLOCKED: Record BLOCKED in the actual-work map for that scope. Continue with other scopes. Report the full blocked list after all convergent scopes finish.
- Reviewer escalation: A reviewer finding that requires cross-scope knowledge returns to the controller, not to the implementer. Record the escalation in the actual-work map and resolve it before marking that scope done.
- Subagent crash: Re-dispatch the same brief to a fresh implementer subagent for that scope. Do not carry forward partial state from the crashed run.
- Non-converged result: If any scope remains BLOCKED after one re-dispatch, record the exhaustion and stop. Do not loop indefinitely.

## Output
One `actual-work-map.md` listing every scope with terminal status (done, blocked, or failed), reviewer verdict, and fix count, plus one review report per scope, one fix report per scope that required fixes, and one brief file per scope.
