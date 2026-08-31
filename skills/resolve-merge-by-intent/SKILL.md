---
name: resolve-merge-by-intent
description: 'Use when a merge or rebase has stopped on conflicts. Resolve every conflict by reading both sides'' commit, PR, and issue intent, preserving compatible intents, naming trade-offs, and finishing as a green commit. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Resolve merge by intent

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A merge or rebase has stopped on conflicts. |
| Authority | Reversible local write: resolve conflict hunks and finish the merge or rebase; roll back via VCS if resolution is wrong. |
| Side effect | Resolved hunks, checks, and finished merge or rebase. |
| Done | Compatible intents preserved, trade-offs named, finished green commit. |

## Inputs

- **Required**: A merge or rebase in progress with unresolved conflict markers in the working tree.
- **Required**: Access to both sides' commit messages, PR descriptions, or linked issues that express the intent behind each change.
- **Optional**: Project test or check commands to validate the resolved tree before finishing.

## Procedure

1. Identify the merge or rebase type and list every conflicted file.
2. For each side of the conflict, read the commit messages, PR body, and linked issues to extract the intent behind the change. Record each intent as a short statement.
3. Compare the two intents per conflict hunk:
   a. If both intents are compatible (they address different concerns or can coexist), merge them into a single resolution that preserves both.
   b. If the intents conflict (they modify the same logic in incompatible ways), name the trade-off explicitly, choose the resolution that best serves the project's current priorities, and document the discarded intent in the commit message.
4. Resolve every conflicted hunk. Remove all conflict markers.
5. Run the project's test or check commands. If checks fail, diagnose whether the failure stems from the resolution or a pre-existing issue. Fix resolution failures; stop and report pre-existing failures without widening scope.
6. Stage the resolved files and finish the merge or rebase commit. Write a commit message that names the intents from both sides and the resolution rationale.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Intent ambiguity | Neither side's commit or PR expresses a clear intent. Stop. Report the ambiguous files and ask the human to supply the missing intent before continuing. |
| Check failure after resolution | If project checks fail due to the resolution, re-diagnose the conflicting hunk and re-resolve. If checks fail due to a pre-existing issue unrelated to the conflict, stop and report. Do not fix unrelated failures. |
| Scope creep | If resolving one conflict reveals additional unrelated conflicts or issues, stop at the current merge or rebase scope. Do not refactor, clean up, or fix code outside the conflicted hunks. |
| Non-convergence | If two resolution attempts produce the same check failure, stop and report the conflict pair, both attempted resolutions, and the failure output. |

Partial results: if some files resolve cleanly and others hit a failure class, commit the clean resolutions only if the merge or rebase tool supports partial staging. Otherwise stop and leave the tree as-is.

Rollback: if the resolution is wrong, abort the merge or rebase (`git merge --abort` or `git rebase --abort`) to restore the pre-resolution state.

## Output
- A finished merge or rebase commit with all conflict markers removed.
- A commit message naming both sides' intents and the resolution rationale.
- Green project checks (or a clear report of pre-existing failures that block finishing).

## Provenance

Adapted from mattpocock/skills `skills/engineering/resolving-merge-conflicts/SKILL.md` at revision `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`. Licensed MIT. Copyright (c) 2026 Matt Pocock. The copyright and permission notice is retained in `licenses/NOTICE`. This is a clean-room adaptation that preserves the intent-driven conflict resolution mechanism while re-scoping for the odin-code module trigger and authority contract.
