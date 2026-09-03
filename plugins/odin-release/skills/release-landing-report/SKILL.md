---
name: release-landing-report
description: 'Use when the user runs /release-landing-report to summarize landed changes and return a landing summary report. Not for tasks that require source or remote-system changes.'
---

# Release landing report

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /release-landing-report. |
| Authority | Read-only: inspect version-control history and landed changes; no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A landing summary in chat output; no state change. |
| Done | A landing summary report is returned. |

## Refusals

- Repository mutation: rejected. Do not stage, commit, push, amend, reset, or otherwise mutate the repository, working tree, remotes, or credentials.
- Fabricating changes: rejected. If no changes landed in the window, state that the window is empty.
- Partial summary as complete: rejected. A landing summary is returned only when the full window was inspected.

## Inputs

- Target repository with landed changes to summarize. Must be supplied; defaults to the current working repository.
- Optional landing-window bounds: a since-ref, branch, or count limit. When omitted, use the default window: changes landed since the last report, or the most recent landed changes when no prior report exists.

## Procedure

1. Bound scope before any inspection. Confirm the target repository path and the landing window. Accept an optional since-ref, branch, or count limit from the user; otherwise apply the default window. **Done when**: the repository path and window bounds are confirmed.
2. Inspect landed changes read-only. Enumerate the commits and merged pull requests that landed inside the window using version-control history such as `git log` and merged-PR listings. Do not mutate the repository. **Done when**: every commit and merged PR in the window is enumerated.
3. For each landed change, capture what changed, the motivating reason recorded in its commit message or linked pull request, and its observable impact on the codebase. Prefer the change's own recorded rationale; do not invent impact the history does not state. **Done when**: each landed change has what-changed, reason, and impact captured.
4. Compose the landing summary. Group related landed changes, order them by landing time, and state the net effect of the window. Keep the summary to what the landed history supports. **Done when**: the summary is composed with grouping, ordering, and net effect.
5. Return the landing summary as chat output. Make no state change. **Done when**: the summary is returned.

## Failure and recovery

- No landed changes in window: return a landing summary stating the window is empty; do not fabricate changes.
- Repository or history unreadable: stop and report the exact read failure; make no mutation and emit no partial landing summary.
- Ambiguous or unbounded window: stop and request the missing bound (since-ref, branch, or count) rather than widening scope or guessing.

## Output

A landing summary report as chat output covering landed changes in the window with no state change, ordered: scope, landed changes by time, net effect.
