---
name: isolate-workspace-gate
description: 'Use when asked to start feature work that needs isolation, or before executing an implementation plan. Creates an isolated git worktree with symlinked hooks, runs setup, and gates on a green baseline test suite. Not for loop-run worktree lifecycle — use isolate-work-in-worktree.'
---

# Isolate workspace gate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Starting feature work that needs isolation, or before executing an implementation plan. |
| Authority | Reversible-local: may create a git worktree, add and commit a gitignore entry, symlink hooks, and run setup. Roll back via `git worktree remove` or revert the gitignore commit. |
| Side effect | May create a git worktree with the native harness tool preferred, add and commit a gitignore entry if the target directory is not already ignored, symlink the parent hooks directory, and run project setup. |
| Done | An isolated workspace path plus branch is reported, or in-place work is reported; setup has run; and the baseline test suite is green, or failures are surfaced with a proceed-or-investigate question. |

## Inputs

- Branch name (required): the feature branch to create or attach.
- Base branch (optional): defaults to the current HEAD branch.
- Setup command (optional): project-specific setup to run inside the worktree (e.g. `pnpm install --frozen-lockfile`, `make setup`). If omitted, no setup step runs.

## Procedure

1. **Detect environment.** Run `git rev-parse --git-common-dir` and `git rev-parse --git-dir`. If `GIT_COMMON_DIR` differs from `GIT_DIR`, the session is already inside a worktree. If the repo root contains a `.gitmodules` file and the current directory is a submodule, stop and report that isolation must run from the superproject.

2. **Determine isolation mode.** If already inside a worktree and the user has not requested a new one, report the existing worktree path and branch, then skip to step 6. Otherwise proceed to create a new worktree.

3. **Create worktree.** Run `git worktree add <path> -b <branch-name> <base-branch>` using the native harness tool preferred by the environment. If the branch already exists, omit `-b` and attach to the existing branch. If worktree creation fails (disk full, path conflict, locked index), fall back to in-place work on the current branch and report the fallback reason.

4. **Gitignore entry.** If the worktree directory is not already matched by `.gitignore`, add an entry for it and commit the change. If it is already ignored, skip.

5. **Symlink hooks.** Locate the parent repository's hooks directory via `git rev-parse --git-common-dir` from the worktree. Symlink the worktree's hooks directory to it so shared hooks apply. If symlink creation fails (permission, cross-filesystem), report the failure and continue without hooks.

6. **Run setup.** If a setup command was supplied, execute it inside the worktree. If it exits non-zero, surface the error and stop.

7. **Gate on baseline tests.** Run the project's baseline test suite inside the worktree (or in-place if fallback). If all tests pass, report success. If tests fail, surface the failures and ask the user to proceed or investigate.

## Failure and recovery
| Failure class | Recovery |
|---|---|
| Worktree creation fails (disk, path, lock) | Fall back to in-place work on the current branch. Report the fallback reason. |
| Submodule guard triggers | Stop. Report that isolation must run from the superproject. |
| Hook symlink fails (permission, cross-filesystem) | Continue without hooks. Report the failure. |
| Setup command exits non-zero | Stop. Surface the error output. Do not proceed to the test gate. |
| Baseline tests fail | Surface the failures. Ask the user: proceed with the isolated workspace despite failures, or investigate first. |

Partial results are never silently accepted. Each failure class has a specific stop-or-continue rule. No step is skipped without a reported reason.

## Output
- On success: the isolated workspace absolute path, the branch name, and confirmation that the baseline test suite is green.
- On in-place fallback: the current working directory, the branch name, the fallback reason, and test suite status.
- On test failure: the workspace path, the branch name, and the test failure summary with a proceed-or-investigate question.
