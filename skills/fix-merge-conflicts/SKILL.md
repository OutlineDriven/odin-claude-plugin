---
name: fix-merge-conflicts
description: 'Use when asked to resolve an in-progress merge conflict. Leave no conflict markers and verify resolution choices with scoped checks. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Fix merge conflicts

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An in-progress merge or rebase has unresolved conflict markers. |
| Authority | Write only local working-tree files under conflict and stage resolutions. Roll back with git merge --abort, git rebase --abort, or git checkout -- <file> on any staged but uncommitted resolution. |
| Side effect | Edits and stages resolved files; regenerates lockfiles with package manager tools; runs scoped compile, lint, and tests. |
| Done | No conflict markers remain in any tracked file and scoped checks pass. |

## Inputs

A repository with an in-progress merge or rebase producing conflict markers is required. The conflict file set is derived from git status. Project compile, lint, and test commands are optional; run only those that exist.

## Procedure

1. Confirm an in-progress merge or rebase via git status. If neither is in progress, stop.
2. List every file with conflict markers from git status --porcelain and a marker scan.
3. For each conflicting file, read both sides of every conflict hunk. Resolve with minimal, correctness-first edits: preserve both sides when the changes are independent and safe; otherwise choose the variant that compiles and preserves public behavior.
4. Remove all conflict markers from each resolved file.
5. If a lockfile is among the conflicting files, regenerate it with the project package manager rather than hand-editing.
6. Stage each resolved file with git add.
7. Run the project compile, lint, and test commands that exist. Scope runs to the resolution; do not introduce new changes to make checks pass.
8. Verify no conflict markers remain in any tracked file.

## Failure and recovery
Unresolvable conflict: both sides are logically incompatible. Leave the file marked, do not stage it, report the hunk and the incompatibility.

Lockfile regeneration fails: do not hand-edit the lockfile; report the failure and leave it unresolved.

Scoped checks fail after resolution: report the failing check and its output; do not push, tag, or commit the merge. The human may adjust the resolution or abort.

Non-mutation rule: never push, tag, or commit during conflict resolution. Roll back any staged resolution with git restore --staged <file> followed by git checkout -- <file>, or abort the whole merge or rebase with git merge --abort or git rebase --abort.

## Output
List of files resolved and staged. Notable resolution choices per file (which side was kept, or both merged). Lockfile regeneration result. Scoped check outcome (pass or named failure).

## Provenance

Origin: cursor/plugins, cursor-team-kit/skills/fix-merge-conflicts/SKILL.md. Pinned revision: 68836ddaf5697224520f1847d90cdb90ca8babaa. License: MIT, declared by the cursor/plugins root README and the candidate plugin manifest. Adaptation: clean-room rewrite preserving the repository-state conflict-resolution mechanism—detect conflicts, resolve with minimal correctness-first edits, regenerate lockfiles with tooling, run scoped checks, stage and summarize—in ODIN 2.0 contract form.
