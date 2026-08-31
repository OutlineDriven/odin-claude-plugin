---
name: principle-subtract-before-you-add
description: 'Use when asked to sequence an addition or rewrite, remove obsolete code first so new work rests on a simpler base. Don''t use for untracked data or changes without a version-control rollback.'
---

# Principle: subtract before you add

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Sequence an addition or rewrite. |
| Authority | VCS-reversible destructive: restrict changes to VCS-tracked targets; show the exact set before mutating; use version control as the recovery path. |
| Side effect | Deletes obsolete code. Deletion must be recoverable via `git checkout` of the committed state. |
| Done | New work rests on a simpler base. |

## Inputs

- **Addition or rewrite request** — required. The human's specification of what to add or change.
- **Scope of existing code** — required. The current files, functions, or structures that will receive the new work.
- **Git working-tree state** — must be clean or explicitly staged before deletion steps execute.

## Procedure

1. Identify the obsolete weight. Scan the existing code in the request's scope. Catalog every declaration, wrapper, indirection, compat shim, dead branch, or duplicate abstraction that the addition or rewrite makes unnecessary.
2. Announce the deletion set. List every VCS-tracked file and line range that will be removed. Do not proceed to step 3 until the human confirms or narrows the set.
3. Stage the deletions. Use `git add -p` or `git rm` to stage only the deletions. Each stage must preserve a compilable, green-test working tree.
4. Commit the deletions with a VCS-reversible message. Example: `git commit -m "chore: subtract obsolete X before adding Y"`. The commit SHA is the recovery anchor.
5. Validate the deletion commit. Run the project's compile and test gate. Stop if it fails; recover via `git revert` and abort the addition.
6. Sequence the addition or rewrite. Implement the new work on the simpler base confirmed in step 5.
7. Commit the new work. Gate on the project's compile and test gate before declaring done.

## Failure and recovery
| Failure class | Result |
|---|---|
| Working tree not clean at step 2 | Stop. Do not proceed with deletions until `git status` reports clean or the human explicitly stages the pending changes. |
| Human narrows deletion set to empty | Stop. No subtraction needed; proceed directly to the addition or rewrite. |
| Compile or test gate fails at step 5 | Revert the deletion commit via `git revert`. Abort the addition. Report the blocking failure. |
| Compile or test gate fails at step 7 | Do not revert the deletion commit. Fix the new work until the gate passes. |
| Revert fails | Block. Report the revert failure and the deletion commit SHA. Do not continue. |

## Output
Two commits on the current branch:
1. A deletion commit removing the obsolete weight, with a VCS-reversible message naming the deleted surface.
2. An addition or rewrite commit implementing the requested change.

The done predicate holds when both commits are green in CI and the human confirms the simpler base.

## Provenance

Origin: cursor/plugins (pstack/skills/principle-subtract-before-you-add/SKILL.md)
Revision: 68836ddaf5697224520f1847d90cdb90ca8babaa
License: MIT — adaptation of pstack skill authored by Lauren Tan (poteto), licensed under MIT per pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25.
