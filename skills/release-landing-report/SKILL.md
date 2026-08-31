---
name: release-landing-report
description: 'Use when the user runs /release-landing-report, summarize landed changes and return a landing summary report. Don''t use for tasks that require source or remote-system changes.'
---

# Release landing report

## Contract

| Field | Bound contract |
|---|---|
| Trigger | the user runs /release-landing-report |
| Authority | read-only: inspect version-control history and landed changes; no file, VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | a landing summary in chat output; no state change |
| Done | a landing summary report is returned |

## Inputs

- Target repository with landed changes to summarize. Must be supplied; defaults to the current working repository.
- Optional landing-window bounds: a since-ref, branch, or count limit. When omitted, use the default window: changes landed since the last report, or the most recent landed changes when no prior report exists.

## Procedure

1. Bound scope before any inspection. Confirm the target repository path and the landing window. Accept an optional since-ref, branch, or count limit from the user; otherwise apply the default window.
2. Inspect landed changes read-only. Enumerate the commits and merged pull requests that landed inside the window using version-control history such as `git log` and merged-PR listings. Do not stage, commit, push, amend, reset, or otherwise mutate the repository, working tree, remotes, or credentials.
3. For each landed change, capture what changed, the motivating reason recorded in its commit message or linked pull request, and its observable impact on the codebase. Prefer the change's own recorded rationale; do not invent impact the history does not state.
4. Compose the landing summary. Group related landed changes, order them by landing time, and state the net effect of the window. Keep the summary to what the landed history supports.
5. Return the landing summary as chat output. Make no state change.

## Failure and recovery
- No landed changes in window: return a landing summary stating the window is empty; do not fabricate changes.
- Repository or history unreadable: stop and report the exact read failure; make no mutation and emit no partial landing summary.
- Ambiguous or unbounded window: stop and request the missing bound (since-ref, branch, or count) rather than widening scope or guessing.
- Partial-result rule: a landing summary is returned only when the full window was inspected; never return a partial summary as though complete.

## Output
A landing summary report, returned as chat output, covering the landed changes in the window with no state change.

## Provenance

Origin: https://github.com/garrytan/gstack at revision 07b59e396c6be5a86619a43151cb9ed62a15ae69. License: MIT, Copyright (c) 2026 Garry Tan. Adapted clean-room from landing-report/SKILL.md: the landed-change summarizing mechanism is re-derived, not copied wholesale.
