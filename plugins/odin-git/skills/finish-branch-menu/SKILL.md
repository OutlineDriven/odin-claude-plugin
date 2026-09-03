---
name: finish-branch-menu
description: 'Use when implementation is complete and the full test suite is green and an integration decision is needed for a development branch or worktree. Don''t use for branches with failing tests or for starting new work.'
disable-model-invocation: true
---

# Finish branch menu

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Implementation is complete and the full test suite is green; an integration decision is needed for a development branch or worktree. |
| Authority | Human-only. Every remote or destructive effect — push and PR, branch delete, worktree removal, discard — sits behind the user's explicit per-run menu selection; discard also requires the typed word `discard`. Preview the target and consequence before any remote mutation or irreversible deletion. |
| Side effect | Merge with branch delete, or push plus PR with the worktree preserved, or keep as-is. Worktree removal only for framework-owned worktrees; a refused removal hands the user a commit, move, or delete choice for untracked files. |
| Done | The chosen option executed on a green suite, with tests re-run on the merged result for the merge option; on failure, stop and investigate rather than clean up; the tree state matches the provenance table. |

## Inputs

- The development branch or worktree to finish (the current checkout).
- The project's full test-suite command, run on the tree being integrated — a green run only proves the tree it ran on.
- The base branch this work forked from. Optional: take it from the plan, the conversation, or the branch's upstream; if it is not already known, ask and confirm before merging.
- Optional: the forge's CLI or PR-creation URL and the repo's PR template and conventions, used only for the push-and-PR option.

## Procedure

1. Run the project's full test suite on the current tree. If it fails, report the failures and stop — the menu comes only after a green suite. Done when: the full test suite is green on the current tree, or the skill stops on failure.
2. Detect the environment and capture, before any directory change, the values cleanup will need:

   ```bash
   GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
   GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
   WORKTREE_PATH=$(git rev-parse --show-toplevel)
   ```

   `GIT_DIR == GIT_COMMON` is a normal repo. `GIT_DIR != GIT_COMMON` with a named branch is a worktree this skill may clean up. `GIT_DIR != GIT_COMMON` with a detached HEAD is an externally managed workspace — present the reduced menu and leave it in place. Done when: `GIT_DIR`, `GIT_COMMON`, and `WORKTREE_PATH` are captured and the environment is classified.

3. Determine the base branch from the plan, the conversation, or the branch's upstream. If it is not already known, ask and confirm before merging — merging into the wrong base is expensive to undo. Done when: the base branch is determined and confirmed.
4. Present the menu exactly as written and wait for the user's selection; the integration decision is theirs.

   Normal repo or named-branch worktree:

   ```
   Implementation complete. What would you like to do?

   1. Merge back to <base-branch> locally
   2. Push and create a Pull Request
   3. Keep the branch as-is (I'll handle it later)

   Which option?
   ```

   Detached HEAD:

   ```
   Implementation complete. You're on a detached HEAD (externally managed workspace).

   1. Push as new branch and create a Pull Request
   2. Keep as-is (I'll handle it later)

   Which option?
   ```

   Done when: the user selects an option.

5. Execute the chosen option. Merge first and verify success before removing anything.

   - **Merge locally:** change to the main repo root, then checkout the base, pull, and merge the feature branch:

     ```bash
     MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
     cd "$MAIN_ROOT"
     git checkout <base-branch>
     git pull
     git merge <feature-branch>
     ```

     Re-run the full test suite on the merged result. If it fails, stop and investigate — leave the worktree and branch in place; nothing has been pushed, so the merge is local and recoverable. Only once the merged result is green: clean up the worktree (step 7), then delete the branch with `git branch -d <feature-branch>`.

   - **Push and create PR:** push the branch (from a detached HEAD, push `HEAD:refs/heads/<new-branch>`):

     ```bash
     git push -u origin <feature-branch>
     # detached HEAD: git push origin HEAD:refs/heads/<new-branch>
     ```

     Create the pull or merge request against the base branch with the forge's tooling — its CLI if available, or the creation URL most forges print on push — following the repo's PR template and conventions if present, and report the URL. Keep the worktree; PR feedback is iterated there.

   - **Keep as-is:** report the branch name and the worktree path; preserve both.

   Done when: the chosen option is executed — merge verified green with branch deleted, PR created with URL reported, or branch and worktree preserved.

6. Discard runs only as a response to an explicit user request to throw the work away. Preview the consequence and require the typed word `discard`:

   ```
   This will permanently delete:
   - Branch <name>
   - All commits: <commit-list>
   - Worktree at <path>

   Type 'discard' to confirm.
   ```

   Wait for that exact confirmation. When it arrives, change to the main repo root, clean up the worktree (step 7), then force-delete the branch:

   ```bash
   MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
   cd "$MAIN_ROOT"
   git branch -D <feature-branch>
   ```

   Done when: the typed word `discard` is received and the branch is force-deleted, or the confirmation is not given and nothing is deleted.

7. Clean up the workspace. This runs for merge and confirmed discard only; push-and-PR and keep always preserve the worktree. Both callers have already changed directory to the main repo root — worktree removal must run from outside the worktree — and use the `GIT_DIR`, `GIT_COMMON`, and `WORKTREE_PATH` captured in step 2, from before that directory change.

   - `GIT_DIR == GIT_COMMON`: normal repo, no worktree to clean up.
   - `WORKTREE_PATH` under `.worktrees/` or `worktrees/`: framework-owned. Remove it and prune stale registrations:

     ```bash
     git worktree remove "$WORKTREE_PATH"
     git worktree prune
     ```

     If removal is refused (`contains modified or untracked files`), never `--force` unprompted — those files exist nowhere else. Show what is at stake and ask:

     ```bash
     git -C "$WORKTREE_PATH" status --porcelain -uall
     ```

     ```
     Worktree removal refused — these files were never committed:

     <file list>

     1. Commit them to <branch> before cleanup
     2. Move them into <main repo root>
     3. Delete them (unrecoverable)

     Which?
     ```

     Carry out the choice, then remove the worktree.

   - Otherwise: the host environment owns this workspace — leave it in place.

   Done when: the workspace is cleaned up (worktree removed or left in place per the rules above), or untracked files are resolved via the user's commit/move/delete choice.

## Failure and recovery
- Tests fail on the tree to integrate: report the failures and stop. Do not present the menu; a green run only proves the tree it ran on.
- Merged-result tests fail: stop and investigate. Leave the worktree and branch in place; the merge is local and recoverable because nothing has been pushed. Do not clean up to mask the failure.
- Worktree removal refused (modified or untracked files): never `--force` on the agent's own initiative. Show the file list and let the user choose commit, move, or delete; carry out the choice, then remove.
- Push rejected (the remote moved): investigate; force-push only on the user's explicit request.
- Discard requested without the typed word `discard`: do not delete. Re-present the consequence and wait for the exact confirmation.
- Partial-result rule: no option is half-executed. The merge is verified green before any removal; a failed merged result leaves the branch and worktree intact, so there is nothing to roll back locally.
- Blocked or non-converged result: stop with the current tree state and the failing check named. Do not widen scope, invent evidence, or clean up to hide the failure.

## Output
The chosen integration outcome executed on a green suite, plus a report of the resulting state: the merged branch deleted, the PR URL, or the preserved branch and worktree path. The tree state matches the provenance table:

| Option | Merge | Push | Keep Worktree | Cleanup Branch |
|---|---|---|---|---|
| Merge locally | yes | - | - | yes |
| Create PR | - | yes | yes | - |
| Keep as-is | - | - | yes | - |
| Discard (explicit request only) | - | - | - | yes (force) |
