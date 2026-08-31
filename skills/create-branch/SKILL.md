---
name: create-branch
description: 'Use when the user asks to create a new branch or start work on a new branch, create a local git branch named <type>/<short-description> on the correct base with no name collisions. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Create branch

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to create a new branch or start work on a new branch. |
| Authority | Reversible local write: creates and checks out one local git branch only; no remote, force, or history mutation. |
| Side effect | Creates a local git branch and moves HEAD onto it; rollback is `git switch -` plus `git branch -d <branch>` when the branch has no commits beyond its base. |
| Done | A branch named `<type>/<short-description>` exists on the correct base with no collisions and HEAD points at it. |

## Inputs

- Branch type and short description, taken from the user request. Type follows the team convention (commonly `feature`, `fix`, `chore`, `docs`, `refactor`, `test`). Short description is lowercase, hyphen-separated, no spaces.
- Base commit, optional. Defaults to the current branch HEAD. The user may name a branch, tag, or commit SHA.

## Procedure

1. Derive `<type>` and `<short-description>` from the user request. If either is missing or ambiguous, stop and ask the user to supply both before any mutation.
2. Compose the branch name as `<type>/<short-description>`.
3. Resolve the base. If the user named a base, confirm it resolves with `git rev-parse --verify <base>`; if it does not resolve, stop. If no base was named, use the current branch HEAD.
4. Verify the name does not already exist: `git rev-parse --verify <branch>` must fail. If it succeeds, stop and report the collision rather than overwriting or suffixing.
5. Inspect the working tree with `git status --porcelain`. If uncommitted changes are present and the user has not accounted for them, stop and report the changed files so the user can stash, commit, or abort before branching.
6. Create and switch in one step: `git checkout -b <type>/<short-description> <base>`.
7. Confirm success: `git rev-parse --abbrev-ref HEAD` equals the new branch name and `git rev-parse HEAD` equals the resolved base commit.

## Failure and recovery
- Name collision: the branch already exists. Do not create or overwrite. Report the existing branch and its base; suggest a different name or `git switch <branch>` to reuse it.
- Invalid base: the named base does not resolve. Stop before mutation; report the unresolved ref and ask for a valid base.
- Dirty working tree: uncommitted changes would carry onto the new branch. Stop before `checkout -b`; list the changed files and let the user decide to stash, commit, or abort.
- Partial creation: if `checkout -b` created the branch but the switch failed, delete the half-created branch with `git branch -d <branch>` only when it has no commits beyond the base, then report the failure. Never force-delete a branch with divergent commits.
- Non-mutation rule: every validation in steps 3-5 runs before the mutation in step 6, so a blocked attempt leaves the repository unchanged.

## Output
The new branch is checked out. Report the branch name, the base commit SHA it was created from, and confirmation that HEAD points at the new branch. If the attempt was blocked, report the failure class and the exact blocker with no branch created.

## Provenance

Origin: getsentry/skills, revision `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241`, license Apache-2.0. Clean-room adaptation: the branch-naming, base-resolution, collision-check, and clean-tree-gate mechanism is re-expressed here; no third-party expression is copied.
