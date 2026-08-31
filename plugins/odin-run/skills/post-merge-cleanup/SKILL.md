---
name: post-merge-cleanup
description: 'Use when a landed merge, release, or completed change needs its cleanup surface reconciled. Scans the diff for stale TODOs, satisfied deprecations, unused flags, and documentation gaps; applies bounded local fixes in a worktree and files tickets with assigned ownership for the rest. Not for unrelated refactoring.'
---

# Post-merge cleanup

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A merge, release, or completed change has landed and its cleanup surface must be reconciled. |
| Authority | Reversible-local write to source files in a worktree, plus authorized creation of remote PRs and tickets for out-of-budget or escalated items. State the rollback path before any mutation. |
| Side effect | Reconciles stale TODOs, deprecation notices, feature flags, and documentation gaps. Makes bounded safe fixes or files tracked tickets with ownership assigned. |
| Done | Each follow-up is either completed with focused verification or recorded as a ticket with an owner assigned or explicitly tracked. No unrelated refactor was smuggled in. |

## Inputs

- Merge reference (required): merge commit SHA, merged PR number, or release tag that just landed.
- Working branch (optional): a named branch to stage proposed fixes. Defaults to `cleanup/<merge-sha>`.
- Size budget (optional): maximum files and lines changed. Defaults to 5 files and 100 lines total. A single unified budget applies to every candidate.
- State file (optional): a `post-merge-state.md` tracking completed, pending, and deferred items. Created on first run if absent, updated on subsequent runs.

## Procedure

1. Resolve the merge reference and scan the diff for cleanup candidates. Fetch the diff of the landed commit or PR. Confirm it merges into the tracked branch (main, trunk, or equivalent). Reject if the reference does not resolve or is not on the tracked branch. Collect candidates across every surface: stale TODO/FIXME/XXX comments with or without linked tickets; deprecation notices satisfied by the diff; `// remove after <date>` or `// TODO: remove after <event>` comments fulfilled by the merge; unused feature flags defined in the diff but not referenced downstream; documentation gaps where doc comments, README entries, or API examples are inconsistent with the landed diff; changelog entries now stale or redundant. Done when: the merge reference resolves and all cleanup candidates are collected.
2. Filter noise and classify candidates by the single unified size budget. Reject commits authored by `dependabot`, `renovate`, or any automated dependency bot. Reject items in denylisted paths (`auth/`, `payments/`, and any path touching a public API contract). Flag items referenced in a sibling or child repository for escalation rather than acting on them. Reject candidates with fewer than 3 lines of diff context unless they carry a linked ticket. Classify each remaining candidate as within-budget (touches no more than 5 files, changes no more than 100 lines total, does not alter behavior except explicit dead-code removal) or out-of-budget. Done when: noise is filtered, escalations are flagged, and each candidate is classified.
3. Apply safe, in-budget fixes in a worktree and verify with tests. For each within-budget candidate: create a named worktree from the tracked branch, apply the minimal fix, and run the project's existing test suite. Revert immediately if any test fails and reclassify the item as deferred. Do not open a single cleanup PR touching more than 10 files without human approval. Done when: every in-budget candidate has a verified fix or is reverted and deferred.
4. File tickets for out-of-budget or escalated items with ownership assigned. For each out-of-budget item, large change, or flagged escalation: create a ticket with the merge SHA, affected path, candidate class, and an owner. If no owner can be determined, assign the ticket to the merge author or the team owning the affected path, and mark ownership as `auto-assigned` so it is explicitly tracked rather than unset. Done when: every out-of-budget or escalated item has a ticket with ownership assigned or explicitly tracked.
5. Update the state file and summarize. Record each item as `completed`, `deferred`, or `ticket-created` in the state file. Prune entries older than 14 days. Write a report summarizing the merge reference, candidates found, candidates acted on with worktree or PR link, candidates deferred with reason, and tickets created with owner. Done when: the state file is updated and the report is written.

## Failure and recovery

| Failure class | Recovery |
|---|---|
| Unresolvable merge reference | Stop. Return `blocked: unresolved-merge-ref`. Do not proceed. |
| State file corrupted | Read-only pass. Report only. Do not write. Return `blocked: corrupt-state-file`. |
| Test failure on a fix | Revert the worktree change. Reclassify the item as `deferred`. Record the revert SHA. |
| Smuggled behavior change | Revert all changes. Do not open a PR. Reclassify as `deferred` with the revert SHA recorded. |
| Same item fails twice | Stop attempting. Escalate to human with both attempt SHAs. |

## Output

A `post-merge-cleanup-report.md` summarizing the merge reference, candidates found, candidates acted on (with worktree or PR link), candidates deferred (with reason), and tickets created (with owner assigned or explicitly tracked), plus an updated `post-merge-state.md`. Or a single confirmation line when no cleanup surface is detected.
