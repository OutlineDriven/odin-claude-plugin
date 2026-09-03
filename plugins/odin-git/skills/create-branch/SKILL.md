---
name: create-branch
description: 'Use when the user asks to create a new branch or start work on one. Creates a local git branch named <type>/<short-description> on the correct base with no name collisions. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

- Take the branch type and short description from the user request. The type follows the team convention (commonly `feature`, `fix`, `chore`, `docs`, `refactor`, `test`). The short description is lowercase and hyphen-separated, with no spaces.
- Base commit, optional. Defaults to the current branch HEAD. The user may name a branch, tag, or commit SHA.

## Procedure

1. Derive `<type>` and `<short-description>` from the user request. If either is missing or ambiguous, stop and ask the user to supply both before any mutation. Done when: both type and short-description are derived from the request or the user is asked to supply them.
2. Compose the branch name as `<type>/<short-description>`. Done when: the branch name is composed in the `<type>/<short-description>` format.
3. Resolve the base. If the user named a base, confirm it resolves with `git rev-parse --verify <base>`; if it does not resolve, stop. If no base was named, use the current branch HEAD. Done when: the base commit is resolved and verified, or an unresolvable base is reported.
4. Verify the name does not already exist: `git rev-parse --verify <branch>` must fail. If it succeeds, stop and report the collision rather than overwriting or suffixing. Done when: the branch name is confirmed not to exist, or a collision is reported.
5. Inspect the working tree with `git status --porcelain`. If uncommitted changes are present and the user has not accounted for them, stop and report the changed files so the user can stash, commit, or abort before branching. Done when: the working tree is clean or uncommitted changes are reported for user decision.
6. Create and switch in one step: `git checkout -b <type>/<short-description> <base>`. Done when: `git rev-parse --abbrev-ref HEAD` equals the new branch name and `git rev-parse HEAD` equals the resolved base commit.

## Failure and recovery
- Name collision: the branch already exists. Do not create or overwrite. Report the existing branch and its base; suggest a different name or `git switch <branch>` to reuse it.
- Invalid base: the named base does not resolve. Stop before mutation; report the unresolved ref and ask for a valid base.
- Dirty working tree: uncommitted changes would carry onto the new branch. Stop before `checkout -b`; list the changed files and let the user decide to stash, commit, or abort.
- Partial creation: if `checkout -b` created the branch but the switch failed, delete the half-created branch with `git branch -d <branch>` only when it has no commits beyond the base, then report the failure. Never force-delete a branch with divergent commits.
- Non-mutation rule: every validation in steps 3-5 runs before the mutation in step 6, so a blocked attempt leaves the repository unchanged.

## Output
On success, report the new branch name, its base commit SHA, and confirmation that HEAD points to it. If the attempt was blocked, report the failure class and exact blocker, and confirm that no branch was created.
