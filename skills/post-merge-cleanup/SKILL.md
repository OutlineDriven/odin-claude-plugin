---
name: post-merge-cleanup
description: 'Use when a landed merge, release, or change needs its cleanup surface reconciled. Scans for stale TODOs, satisfied deprecations, unused flags, and documentation gaps; fixes bounded local items and tickets the rest. Not for unrelated refactoring.'
---

# Post-merge cleanup

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A merge, release, or completed change has landed and its cleanup surface must be reconciled |
| Authority | Reversible-local: write only named local artifacts; state the rollback path before any mutation |
| Side effect | Reconciles stale TODOs, deprecation notices, feature flags, and documentation gaps; makes only bounded safe follow-ups or files tracked tickets for the rest |
| Done | Each follow-up is either completed with focused verification or recorded with an owner; no unrelated refactor was smuggled in |

## Inputs

- **Merge reference** (required): the merge commit SHA, merged PR number, or release tag that just landed
- **Working branch** (optional): a named branch to stage proposed fixes; defaults to `cleanup/<merge-sha>`
- **Budget** (optional): maximum number of files and lines changed; defaults to 5 files / 100 lines
- **State file** (optional): a `post-merge-state.md` tracking completed, pending, and deferred items; created on first run if absent

Inputs are validated at their trust boundary: the merge reference must resolve to a real VCS commit; the state file is read-only if it exists and is well-formed.

## Procedure

1. **Resolve the merge reference.** Fetch the diff of the landed commit or PR. Confirm it merges into the tracked branch (main, trunk, or equivalent). Reject if the reference does not resolve or is not on the tracked branch. Done when: the merge reference resolves to a real commit on the tracked branch.
2. **Scan the diff for cleanup surface.** Enumerate all changed files and comments. Collect candidates across every distinct surface: stale TODO/FIXME/XXX comments with or without linked tickets; deprecation notices satisfied by the diff; `// remove after <date>` or `// TODO: remove after <event>` comments fulfilled by the merge; unused feature flags (defined in the diff, not referenced downstream); documentation gaps (doc comments, README entries, or API examples inconsistent with the landed diff); changelog entries now stale or redundant. Done when: all cleanup candidates are collected across every surface.
3. **Filter out noise and out-of-scope items.** Reject commits authored by `dependabot`, `renovate`, or any automated dependency bot; items in denylisted paths (`auth/`, `payments/`, and any path touching a public API contract); items where the cleanup surface is referenced in a sibling or child repository (flagged for escalation, not acted on); candidates with fewer than 3 lines of diff context unless they carry a linked ticket. Done when: noise and out-of-scope items are filtered with escalations flagged.
4. **Apply size budget.** A safe fix is within budget when it touches no more than 5 files, changes no more than 100 lines total, does not alter behavior except for explicit dead-code removal, and all changed files are under version control with a rollback path (the pre-merge commit). Done when: each candidate is classified as within-budget or out-of-budget.
5. **Execute or ticket.** For each in-scope candidate within budget: create a named worktree from the tracked branch, apply the minimal fix, run the project's existing test suite as the verifier, and open a PR. For each out-of-budget item, large change, or flagged escalation: create a ticket with the merge SHA, affected path, candidate class, and owner unset. Do not open a single cleanup PR touching more than 10 files without human approval. Done when: every in-budget candidate has a PR and every out-of-budget item has a ticket.
6. **Update state.** Record each item as `completed`, `deferred`, or `ticket-created` in the state file. Prune entries older than 14 days. Done when: the state file is updated with all item statuses and old entries pruned.
7. **Verify.** Confirm the test suite passes on the proposed worktree changes. Revert immediately if any test fails and reclassify the item as `deferred`. Done when: the test suite passes on all worktree changes or failing items are reverted and reclassified.

## Failure and recovery
| Failure class | Partial-result rule | Recovery |
|---|---|---|
| Smuggled behavior change | Revert all changes; do not open PR | Reclassify as `deferred` with the revert SHA recorded |
| Same item fails twice | Stop attempting; do not retry | Escalate to human with both attempt SHAs |
| Budget exceeded | Abandon the worktree; do not force-push | Reclassify the item as `ticket-created` |
| Merge reference does not resolve | Stop; report failure | Return `blocked: unresolved-merge-ref`; do not proceed |
| State file is malformed | Read-only pass; report only | Do not write; return `blocked: corrupt-state-file` |
| Escalation item detected (cross-repo flag, public API deprecation) | Do not act; do not defer silently | Create ticket immediately with `escalated` label |

The result is blocked if the done predicate does not hold. A blocked result includes the list of items that were not resolved and the reason each was not resolved.

## Output
A `post-merge-cleanup-report.md` summarizing the merge reference, candidates found, candidates acted on (with worktree or PR link), candidates deferred (with reason), and tickets created (with owner unset) — plus an updated `post-merge-state.md`, zero or more open PRs for safe-fix candidates, and zero or more tickets for out-of-budget, escalated, or deferred candidates; or a single confirmation line when no cleanup surface is detected.

## Provenance

Origin: cobusgreyling/loop-engineering, pattern `post-merge-cleanup`.
Revision: d03dcb92cc1e0efb59789a2557131c6ad5897ccc.
License: MIT.
Adaptation: clean-room reimplementation of the post-merge cleanup loop pattern adapted to the odin-run delivery-operations charter. The original loop-engineering pattern provided the state machine, failure modes, verification strategy, and human handoff taxonomy. The odin-run skill restates those as a bounded reversible-local procedure with explicit budget enforcement and no L3 automation. MIT license permits adaptation.
