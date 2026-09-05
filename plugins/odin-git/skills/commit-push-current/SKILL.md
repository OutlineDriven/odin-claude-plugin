---
name: commit-push-current
description: 'Use when a human explicitly asks to commit and push to the checked-out branch, with no branch creation and no pull request. Not for the default branch by name: use commit-push-main.'
disable-model-invocation: true
---

# Commit and push the current branch

Ship the working tree on the branch that is checked out. This skill never creates or switches branches. Explicit invocation on a branch, including the default branch, authorizes the push to that branch. For a feature branch off the default, use `commit-push`.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human explicitly invokes this skill to commit and push to the checked-out branch. |
| Authority | Human-only: explicit human invocation is the authorization. The skill previews the exact push target and the commit set before the push. The write set is local commits on the checked-out branch and one push to `origin/<current-branch>`. Rollback is `git reset --hard <prior-HEAD>` for new commits and a revert commit for pushed work. No remote mutation beyond the previewed push. |
| Side effect | Local commits on the checked-out branch and one `git push` to `origin/<current-branch>`. No branch creation, no branch switch, no pull request, no force push. |
| Done | The checked-out branch is committed and pushed: `git status --porcelain` is empty and `git rev-list --left-right --count origin/<current-branch>...HEAD` prints `0 0`. |

## Inputs

- Working-tree state (`git status`, `git diff HEAD`): required, gathered by the skill.
- Current branch and recent history (`git branch --show-current`, `git log --oneline -10`): required, gathered by the skill.
- Push-target state (`git rev-list --left-right --count origin/<current-branch>...HEAD`): required, gathered by the skill. `NO_REMOTE_BRANCH` means the local tracking ref is absent; step 5 observes the remote with `git ls-remote --heads origin <current-branch>` to decide whether the branch is new.
- Default branch (`git rev-parse --abbrev-ref origin/HEAD`, then `git ls-remote --symref origin HEAD`, then `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'` verified against `git ls-remote --heads origin <default>`): required as the preview base for a branch new to `origin`. When every resolver fails, the skill stops; a default branch is never guessed.

## Procedure

1. Gather context: run `git status`, `git diff HEAD`, `git branch --show-current`, `git log --oneline -10`, `git remote`, `git rev-list --left-right --count origin/$(git branch --show-current)...HEAD 2>/dev/null || echo NO_REMOTE_BRANCH`, and `git rev-parse --abbrev-ref origin/HEAD 2>/dev/null || echo DEFAULT_BRANCH_UNRESOLVED`. When `git remote` lists no `origin`, skip the resolution below; step 4 reports local-only. Otherwise, strip the `origin/` prefix from the default branch; treat `DEFAULT_BRANCH_UNRESOLVED` or bare `HEAD` as unresolved. When unresolved, run `git ls-remote --symref origin HEAD` and take the branch named by the first `ref: refs/heads/<name>` line. When that fails too, run `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'` and accept its name only when `git ls-remote --heads origin <name>` lists it. When every resolver fails, report `DEFAULT_BRANCH_UNRESOLVED` and stop; never guess. Done when: tree state, branch, recent history, push-target counts, and default branch are known, or the skill has stopped.
2. Classify the branch state. Done when: the state is classified and the skill continues or stops.
   - Detached HEAD (empty branch name): there is no branch ref to push. Report that this skill pushes only the checked-out branch and stop. `commit-push` creates a feature branch when one is wanted.
   - Nothing to do (clean tree and zero on the right side of the push-target counts): report and stop.
   - Clean tree with commits ahead of the push target, or `NO_REMOTE_BRANCH` when `origin` exists: skip to step 5. Without `origin`, continue to step 4 and report local-only.
   - Otherwise: continue.
3. Author the commits with `commit`. Its message conventions, atomicity rules, and staging discipline apply. Do not restate them here. Its default-branch auto-branching does not apply: invocation on the checked-out branch is explicit authorization to commit on it. Done when: `commit` reports the working tree committed, or reports nothing to commit.
4. Detect the remote with `git remote`. If no `origin` remote exists (empty output, or other remotes but none named `origin`), do not push and do not add or guess a remote. Report local-only and stop. Done when: `origin` is confirmed present, or the local-only result is reported.
5. Preview the push and wait for explicit human approval. Name the target `origin/<current-branch>` and observe the remote: `git ls-remote --heads origin <current-branch>`. Non-empty output (branch exists on `origin`): refresh the tracking tip with `git fetch --no-tags origin refs/heads/<current-branch>:refs/remotes/origin/<current-branch>`; when the fetch fails, report and stop without pushing. List `git log --oneline origin/<current-branch>..HEAD`. Empty output (branch new to `origin`): say so, then list the full commit range `git log --oneline origin/<default>..HEAD`, materializing the base first with `git fetch --no-tags origin refs/heads/<default>:refs/remotes/origin/<default>`; when that fetch fails and no local `origin/<default>` exists, report and stop without pushing, never falling back to an unanchored or truncated listing. A failed `ls-remote` call means the remote cannot be observed: report and stop without pushing. The push always targets `origin`, even when the configured upstream points elsewhere. Show the target and the commit list, then wait for the human to approve the exact mutation set (platform blocking question tool, chat fallback). On no answer or refusal, stop with nothing pushed. On approval, push with `git push -u origin HEAD`. Never force-push. Done when: the push is accepted, or the rejection or a stop is reported.
6. Verify: `git status --porcelain` is empty and `git rev-list --left-right --count origin/<current-branch>...HEAD` prints `0 0`. Done when: both read clean, or the residue is reported.

## Failure and recovery

- Detached HEAD: report and stop. No commit is created. Suggest `commit-push` for a feature branch.
- Nothing to do: report and stop. No mutation occurs.
- No `origin` remote: report local-only with the commit list. Never add, invent, or guess a remote.
- Default branch unresolved after `origin/HEAD`, `git ls-remote --symref origin HEAD`, and verified `gh`: report and stop. A branch new to `origin` has no honest preview base without it. Never guess a default branch.
- No fetched base for a new-branch preview (fetch of `<default>` failed and `origin/<default>` is absent): report and stop before the push. The commit set is never previewed from HEAD alone or truncated.
- Tracking-tip refresh fails before an existing-branch preview: report and stop without pushing.
- Push rejected on a diverged remote branch: report the rejection and the counts from `git rev-list --left-right --count origin/<current-branch>...HEAD`. Leave resolution to the user. Never force-push.
- Verification residue (non-empty `git status --porcelain`, or counts other than `0 0`): report the uncommitted files or unpushed commits. Do not claim done.

## Output

The committed working tree on the checked-out branch, one push to `origin/<current-branch>`, and a report naming the branch, the pushed commit hashes and subjects, and the verification result. When no `origin` remote exists, a local-only report naming the commits left unpushed.
