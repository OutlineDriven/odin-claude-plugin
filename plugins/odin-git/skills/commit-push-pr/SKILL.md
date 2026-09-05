---
name: commit-push-pr
description: 'Use when asked to commit, push a feature branch, and open or update a pull request with gh in one pass. Not for a push with no PR: use commit-push. Not for a PR body alone: use create-pull-request.'
---

# Commit, push, and open a pull request

Commit the working tree, push the feature branch to `origin`, and open or update the pull request with `gh`. Commit authoring belongs to `commit`. Title and body authoring belongs to `create-pull-request`. This skill adds branch placement, the PR target resolution, the push, and the `gh` call.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to ship, commit and open a PR, or push and open a pull request for the current work. |
| Authority | Human-gated: the write set is local commits, at most one local feature branch, one push to `origin/<branch>`, and one pull request created or edited through `gh`. The skill states the mutation set (push target, commit list, PR target, title, and body summary) before the push and before the `gh` call. Rollback is `git reset --hard <prior-HEAD>` for new commits, `git branch -D <branch>` for a branch this skill created, and `gh pr close` or `gh pr edit` restoring the prior body for the PR. No remote mutation without the gate. |
| Side effect | Local commits, at most one local feature branch, one `git push` to `origin`, and one PR created or edited on GitHub. No force push. |
| Done | The branch is pushed and the PR exists with the previewed title and body: `git status --porcelain` is empty, `git rev-list --left-right --count origin/<branch>...HEAD` prints `0 0`, and `gh pr view --json url,title,state` returns the PR as `OPEN`. |

## Inputs

- Working-tree state (`git status`, `git diff HEAD`): required, gathered by the skill.
- Current branch and recent history (`git branch --show-current`, `git log --oneline -10`): required, gathered by the skill.
- Remote default branch (`git rev-parse --abbrev-ref origin/HEAD`, then `git ls-remote --symref origin HEAD`, then `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'` verified against `git ls-remote --heads origin <default>`): required. When every resolver fails, the skill stops; a default branch is never guessed.
- Existing PR for the branch (`gh pr view --json url,title,state`): required, gathered by the skill. `NO_OPEN_PR` when none exists.
- Remotes (`git remote -v`) and fork relationship (`gh repo view <origin-slug> --json nameWithOwner,parent,defaultBranchRef`): required for the PR target.
- `gh` installed and authenticated (`gh auth status`): required.
- Evidence supplied by the user (URL, image embed, artifact path): optional, placed in the PR body as given.
- User decisions: detached HEAD, unpushed local default-branch commits, an ambiguous PR target, and whether to rewrite an existing PR's description.

## Procedure

1. Gather context: run `git status`, `git diff HEAD`, `git branch --show-current`, `git log --oneline -10`, `git remote`, `git rev-parse --abbrev-ref origin/HEAD 2>/dev/null || echo DEFAULT_BRANCH_UNRESOLVED`, and `gh pr view --json url,title,state 2>/dev/null || echo NO_OPEN_PR`. When `git remote` lists no `origin`, skip the resolution and steps 2 through 4: nothing will be pushed and no PR can be filed from this clone. If HEAD is detached, still run the step 3 detached-HEAD decision; then commit at step 5 and end at the step 6 local-only report. Do not classify against a default. Otherwise, strip the `origin/` prefix from the default branch; treat `DEFAULT_BRANCH_UNRESOLVED` or bare `HEAD` as unresolved. When unresolved, run `git ls-remote --symref origin HEAD` and take the branch named by the first `ref: refs/heads/<name>` line. When that fails too, run `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'` and accept its name only when `git ls-remote --heads origin <name>` lists it. When every resolver fails, report `DEFAULT_BRANCH_UNRESOLVED` and stop; never guess `main` or any other default. Note the existing PR URL when `state` is `OPEN`. Done when: tree state, branch, history, default branch, and PR state are known, or the skill has stopped.
2. Resolve the PR target. The branch always pushes to `origin`. This step decides only where the PR is filed. Read `git remote -v`. With an `upstream` remote, the PR target is `upstream`. Otherwise run `gh repo view <origin-slug> --json nameWithOwner,parent,defaultBranchRef`. A non-null `parent` makes `parent.nameWithOwner` the target candidate. Ask the user, with the platform blocking question tool (`AskUserQuestion` in Claude Code, `request_user_input` in Codex, `ask_question` in Antigravity, `ask_user` in Pi), only when no single target is clear: no `upstream` remote and two or more non-origin candidates, `gh`'s `parent` disagrees with the `upstream` remote, or `origin` shares no merge-base with the target. A fork that is only behind its parent is not ambiguous. When `upstream` is the target, read the fork owner with `gh repo view <origin-slug> --json owner --jq .owner.login`. The head is `<fork-owner>:<branch>` and the base is the target's default branch. `gh pr create --head <owner>:<branch>` supports user-owned forks only. For an organization-owned `origin`, report that `gh` cannot file the PR and stop after the push. With no `upstream` and no parent, `origin` is both the push target and the PR target. Done when: the PR target repository, base, and head are named.
3. Classify the branch state. Done when: HEAD is on the branch that will be pushed, or the skill has stopped.
   - Detached HEAD (empty branch name): ask whether to create a feature branch. On no, stop. On yes, derive the typed branch name per `commit` and run `git checkout -b <branch>`.
   - Default branch, no work (clean tree, nothing unpushed): report nothing to do and stop.
   - Default branch with work: create a feature branch by step 4. Do not ask. A PR from the default branch is not supported here.
   - Feature branch: continue at step 5.
4. Create the feature branch from a fresh default tip. Run `git fetch --no-tags origin refs/heads/<default>:refs/remotes/origin/<default>` (the explicit refspec materializes the tracking ref even on a single-branch clone), then `git log origin/<default>..HEAD --oneline`. Empty output: the base is `origin/<default>`. Non-empty output: show the list and ask whether to carry those commits onto the new branch (base `HEAD`) or leave them on the local default (base `origin/<default>`). Never pick silently, because foreign commits in a PR cost more than a question. Derive the typed branch name per `commit` and run `git checkout -b <branch> <base>`. If checkout refuses because uncommitted changes would be overwritten, run `git stash push -u -m "commit-push-pr: pre-branch <branch>"`, repeat the checkout, then `git stash pop`. If the fetch fails, report and stop; do not branch from HEAD or from an unverified base. Done when: `git branch --show-current` prints the new branch and the working tree carries the work.
5. Author the commits with `commit`. Its message conventions, atomicity rules, and staging discipline apply. Do not restate them here. Its default-branch auto-branching is already satisfied by step 4. Done when: `commit` reports the working tree committed, or reports nothing to commit.
6. State the push set before the push. Detect a branch new to `origin` by observing the remote: `git ls-remote --heads origin <branch>`. Non-empty output means the branch exists; empty output means it is new; a failed call means the remote cannot be observed, so report and stop without pushing. Existing branch: refresh the tracking tip with `git fetch --no-tags origin refs/heads/<branch>:refs/remotes/origin/<branch>`; when the fetch fails, report and stop without pushing. List `git log --oneline origin/<branch>..HEAD`. New branch: say so, then list the full commit range `git log --oneline origin/<default>..HEAD`; `origin/<default>` comes from the step 4 fetch when this skill created the branch, otherwise materialize it first with `git fetch --no-tags origin refs/heads/<default>:refs/remotes/origin/<default>`. When no fetched base exists (that fetch failed and `origin/<default>` is absent), report and stop without pushing; never fall back to an unanchored or truncated listing. Then push with `git push -u origin HEAD`. Never force-push. If no `origin` remote exists, report local-only and stop. Done when: the push is accepted, or the rejection or the local-only result is reported.
7. Compose the title and body with `create-pull-request`. Its title rule, sizing table, body order, and diff-does-not-show principle apply. Do not restate them here. Give it the base remote from step 2 so the diff is taken against the right base. Decide evidence before composing: user-supplied evidence goes into the body as `## Demo`, `## Screenshots`, or `## Evidence` by artifact type. When the user asks for evidence but supplied none, ask for the URL, embed, or path. When the change has no observable behavior (internal plumbing, type-only, docs, CI, tests), skip evidence without asking. When the diff changes observable behavior, add a short validation note stating what was exercised and how it behaved, or state plainly why no run was possible. Never label test output as `Demo` or `Screenshots`. Do not block the PR on a missing visual artifact. Done when: the title and body are drafted.
8. Preview and apply. Show the PR target, base, head, title, and the first two sentences of the body, then wait for confirmation. Write the body to a temp file and pass it with `--body-file`, never as an inline `--body` or through stdin, because wrappers can hand `gh` an empty body while it still exits 0 and prints a URL:

   ```bash
   # mktemp keeps the body out of shell expansion; the quoted sentinel protects $VAR, backticks, and any literal EOF inside it
   WORK_DIR=$(mktemp -d "${TMPDIR:-/tmp}/odin-pr.XXXXXX")
   BODY_FILE="$WORK_DIR/odin-pr-body.md"
   cat > "$BODY_FILE" <<'__ODIN_PR_BODY_END__'
   <the composed body, verbatim>
   __ODIN_PR_BODY_END__
   ```

   New PR, same repository: `gh pr create --title "<TITLE>" --body-file "$BODY_FILE"`. New PR, `upstream` target: add `--repo <upstream-slug> --base <default> --head <fork-owner>:<branch>`. Existing PR: the pushed commits are already on it. Report the URL and ask whether to rewrite the description. On yes, `gh pr edit --title "<TITLE>" --body-file "$BODY_FILE"`, with `--repo <upstream-slug>` when `upstream` is the target, because a fork PR is not guaranteed to resolve from the branch alone. Escape `"`, backticks, `$`, and `\` in the title. Delete `$WORK_DIR` on every path. Done when: the PR is created or edited, or the user declined the edit.
9. Verify: `git status --porcelain` is empty, `git rev-list --left-right --count origin/<branch>...HEAD` prints `0 0`, and `gh pr view --json url,title,state` (with `--repo <upstream-slug>` when `upstream` is the target) returns `OPEN` with the previewed title. Done when: all three read clean, or the residue is reported.

## Failure and recovery

- `gh` missing or not authenticated: stop before any push. Instruct the user to install `gh` or run `gh auth login`.
- Clean tree with nothing to push and no open PR: report nothing to do. No mutation occurs.
- Detached HEAD and the user declines a branch: stop. No commit is created.
- Stash pop conflicts after branch creation: report the conflict output and the stash ref. Do not resolve them without the user.
- Fetch failure before branching: report and stop. No branch is created, and there is no fallback to HEAD.
- Default branch unresolved after `origin/HEAD`, `git ls-remote --symref origin HEAD`, and verified `gh`: report and stop. Never guess a default branch.
- No fetched base for a new-branch preview (fetch of `<default>` failed and `origin/<default>` is absent): report and stop before the push. The commit set is never previewed from HEAD alone or truncated.
- Tracking-tip refresh fails before an existing-branch preview: report and stop without pushing.
- Ambiguous PR target and no user answer: stop after the push. The branch stays on `origin` for retry.
- Organization-owned fork as `origin` with an `upstream` target: push, then report that `gh --head` supports user-owned forks only and give the compare URL for manual creation.
- No `origin` remote: report local-only with the commit list. Never add, invent, or guess a remote.
- Push rejected on a diverged remote branch: report the rejection and the counts from `git rev-list --left-right --count origin/<branch>...HEAD`. Never force-push.
- PR creation fails after the push: report the exact `gh` error. The remote branch stays for retry. Never leave a half-created PR unreported.
- Preview declined: do not create or edit the PR. The user may pass focus text for a regenerate.
- Empty PR body after creation: re-read `gh pr view --json body`. If empty, run `gh pr edit --body-file "$BODY_FILE"` and confirm with a fresh read.
- Verification residue (uncommitted files, counts other than `0 0`, or a PR state other than `OPEN`): report it. Do not claim done.

## Output

The committed working tree on the pushed feature branch, one `origin` push, one pull request created or updated on the resolved target, and a report naming the branch, the pushed commit hashes and subjects, the PR URL, whether the PR was created or updated, and the verification result. When no `origin` remote exists, a local-only report naming the commits left unpushed.
