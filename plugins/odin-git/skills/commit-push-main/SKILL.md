---
name: commit-push-main
description: 'Use when a human explicitly asks to commit and push directly to the default branch, with no feature branch and no pull request. Not for another checked-out branch: use commit-push-current.'
disable-model-invocation: true
---

# Commit and push the default branch

Ship the working tree on the default branch of the repository. This skill mirrors `commit-push-current` with one difference: the push target is the resolved default branch, and the skill refuses any other branch. It never creates or switches branches. Explicit invocation authorizes the commit and the push on the default branch.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human explicitly invokes this skill to commit and push directly to the default branch. |
| Authority | Human-only: explicit human invocation is the authorization. The skill previews the exact push target and the commit set before the push. The write set is local commits on the default branch and one push to `origin/<default>`. Rollback is `git reset --hard <prior-HEAD>` for new commits and a revert commit for pushed work. No remote mutation beyond the previewed push. |
| Side effect | Local commits on the default branch and one `git push` to `origin/<default>`. No branch creation, no branch switch, no pull request, no force push. |
| Done | The default branch is committed and pushed: `git status --porcelain` is empty and `git rev-list --left-right --count origin/<default>...HEAD` prints `0 0`. |

## Inputs

- Working-tree state (`git status`, `git diff HEAD`): required, gathered by the skill.
- Current branch and recent history (`git branch --show-current`, `git log --oneline -10`): required, gathered by the skill.
- Remote default branch (`git rev-parse --abbrev-ref origin/HEAD`, then `git ls-remote --symref origin HEAD`, then `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'` verified against `git ls-remote --heads origin <default>`): required. When every resolver fails, the skill stops; a default branch is never guessed.
- Push-target state (`git rev-list --left-right --count origin/<default>...HEAD`): required, gathered by the skill. `NO_REMOTE_BRANCH` means the local tracking ref `origin/<default>` is absent, not that the branch is missing; step 1 verifies the remote and stops only when the branch is truly absent.

## Procedure

1. Gather context: run `git status`, `git diff HEAD`, `git branch --show-current`, `git log --oneline -10`, `git remote`, and `git rev-parse --abbrev-ref origin/HEAD 2>/dev/null || echo DEFAULT_BRANCH_UNRESOLVED`. When `git remote` lists no `origin`, skip the resolution: this skill cannot verify the default branch and nothing can be pushed. Report local-only and stop; never guess. Otherwise, strip the `origin/` prefix from the default branch; treat `DEFAULT_BRANCH_UNRESOLVED` or bare `HEAD` as unresolved. When unresolved, run `git ls-remote --symref origin HEAD` and take the branch named by the first `ref: refs/heads/<name>` line. When that fails too, run `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'` and accept its name only when `git ls-remote --heads origin <name>` lists it. When every resolver fails, report `DEFAULT_BRANCH_UNRESOLVED` and stop; never guess `main` or any other default. Then read `git rev-list --left-right --count origin/<default>...HEAD 2>/dev/null || echo NO_REMOTE_BRANCH`. On `NO_REMOTE_BRANCH`, the local tracking ref is missing, not necessarily the branch: verify with `git ls-remote --heads origin <default>`. Empty output: the remote has no `<default>` branch; report and stop. A failed call means the remote cannot be observed; report and stop. Non-empty: materialize the ref with `git fetch --no-tags origin refs/heads/<default>:refs/remotes/origin/<default>` and read the counts again. Done when: tree state, branch, history, default branch, and push-target counts are known, or the skill has stopped.
2. Gate on the branch. If the checked-out branch is not the resolved default branch, or HEAD is detached, report the mismatch and stop. This skill pushes only the default branch. `commit-push-current` handles the checked-out branch and `commit-push` a feature branch. Done when: HEAD is confirmed on the default branch, or the skill has stopped.
3. Classify the work state. Nothing to do (clean tree and zero on the right side of the push-target counts): report and stop. Clean tree with commits ahead of the push target: skip to step 6. Otherwise: continue. Done when: the state is classified and the skill continues or stops.
4. Author the commits with `commit`. Its message conventions, atomicity rules, and staging discipline apply. Do not restate them here. Its default-branch auto-branching does not apply: explicit invocation on the default branch is authorization to commit on it. Done when: `commit` reports the working tree committed, or reports nothing to commit.
5. Detect the remote with `git remote`. If no `origin` remote exists (empty output, or other remotes but none named `origin`), do not push and do not add or guess a remote. Report local-only and stop. Done when: `origin` is confirmed present, or the local-only result is reported.
6. Preview the push and wait for explicit human approval. Refresh the tracking tip with `git fetch --no-tags origin refs/heads/<default>:refs/remotes/origin/<default>`; when the fetch fails, report and stop without pushing. Name the target `origin/<default>` and list the full commit set with `git log --oneline origin/<default>..HEAD`. When the left count is non-zero, the remote holds commits HEAD lacks; name them in the preview, because the push will be rejected until they are integrated. Show the target and the commit list, then wait for the human to approve the exact mutation set (platform blocking question tool, chat fallback). On no answer or refusal, stop with nothing pushed. On approval, push with `git push -u origin HEAD`. Never force-push. Done when: the push is accepted, or the rejection or a stop is reported.
7. Verify: `git status --porcelain` is empty and `git rev-list --left-right --count origin/<default>...HEAD` prints `0 0`. Done when: both read clean, or the residue is reported.

## Failure and recovery

- Checked-out branch is not the default branch, or HEAD is detached: report the mismatch and stop. No commit is created.
- Nothing to do: report and stop. No mutation occurs.
- Default branch unresolved after `origin/HEAD`, `git ls-remote --symref origin HEAD`, and verified `gh`: report and stop. Never guess a default branch.
- `NO_REMOTE_BRANCH` with the branch verified absent on the remote (`git ls-remote --heads origin <default>` is empty): report that `origin/<default>` does not exist on `origin` and stop. This skill never creates the remote branch. When the branch exists, the step 1 explicit-refspec fetch materializes the missing local ref.
- Tracking-tip refresh fails before the preview: report and stop without pushing.
- No `origin` remote: report local-only with the commit list. Never add, invent, or guess a remote.
- Push rejected on a diverged remote branch: report the rejection and the counts from `git rev-list --left-right --count origin/<default>...HEAD`. Leave resolution to the user. Never force-push.
- Verification residue (non-empty `git status --porcelain`, or counts other than `0 0`): report the uncommitted files or unpushed commits. Do not claim done.

## Output

The committed working tree on the default branch, one push to `origin/<default>`, and a report naming the branch, the pushed commit hashes and subjects, and the verification result. When no `origin` remote exists, a local-only report naming the commits left unpushed.
