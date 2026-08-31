---
name: create-pull-request
description: 'Use when the user asks to create a PR, open or update a draft PR, write or refresh a PR description, or summarize changes for review. Runs the full template-gated flow by default; a quick mode opens a lightweight PR when the user asks for speed. Not for multi-PR stacks or release publishing.'
disable-model-invocation: true
---

# Create pull request

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to create a PR, open or update a draft PR, write or refresh a PR description, or summarize changes for review. |
| Authority | Human-only. Preview the PR target (base branch, commits, title, and body) and the remote consequence before creating or updating the PR on GitHub. |
| Side effect | Creates or updates a GitHub PR with a descriptive title, commit title, and body; optionally as a draft. Remote mutation on GitHub, bounded to one PR for the current branch. |
| Done | PR exists with a proper title, linked issue if any, and body following the project template (full mode) or an accurate title and body (quick mode); all commits are pushed; presubmit status is reported; in full mode the PR is open in the browser. For an update, the remote PR's title, body, draft state, head, and base match the preview. |

## Inputs

Required:
- A current git branch that is not `main`/`master`, with commits ahead of the base branch.
- `gh` CLI installed and authenticated (`gh --version`, `gh auth status`).
- The base branch, confirmed against the repository default (quick mode rechecks this and rebases when the branch is stale).

Optional:
- A related issue number, inferred from commit messages or branch name (`#123`, `fixes #123`, `closes #123`).
- A PR template at `.github/pull_request_template.md` (full mode only).
- Draft intent from the user.
- For an update: the target draft PR identified by number, URL, or the current head branch. The target must be a draft; do not convert a ready PR to draft.

## Modes

Two modes share one human-gated remote mutation. Pick the mode from the user's ask, not by guessing.

- **Full mode (default).** Fires when the user asks to create a PR, write a PR description, summarize changes for review, or open a pull request with the project's review/CI/testing rigor. Fills the project template, gates on review/CI/testing prerequisites, checks for an existing PR, and verifies in the browser. Use this unless the user explicitly asks for a fast, lightweight open.
- **Quick mode.** Fires when the user asks to just open or update a PR, get a PR up fast, or skip the template ritual. Confirms a non-stale base, drafts a title and body from the branch commits for explicit approval, creates or updates the PR, and reports presubmit status. Skips the template, the review/CI/testing prerequisite gate, the existing-PR search, and the browser verification.

## Full procedure

1. Verify prerequisites: `gh` is installed and authenticated, and the working directory is clean (`git status`). If uncommitted changes exist, ask the user whether to commit, stash, or discard them before proceeding. Done when: `gh` is authenticated and the working directory is clean or uncommitted changes are surfaced for user decision.
2. Before creating a PR, ensure related review, CI, and testing workflows have been satisfied. Do not proceed with PR creation until those prerequisites are met. Done when: review, CI, and testing prerequisites are confirmed satisfied.
3. Check for an existing PR on the current branch: `gh pr list --head $(git branch --show-current) --json number,title,url`. If a PR already exists, show it and ask whether to view, update, or close-and-recreate; only create a new PR if none exists. For an update, verify the target is a draft; do not convert a ready PR to draft or select a PR by guesswork. Done when: existing PR status is confirmed and the action (create, view, update, or close-and-recreate) is determined.
4. Identify the current branch and the base branch (`git remote show origin | grep "HEAD branch"`). Refuse if on `main`/`master`; ask the user to switch to a feature branch. Done when: the current branch is not `main`/`master` and the base branch is identified.
5. Analyze the commits and diff for this PR: `git log origin/<base>..HEAD --oneline --no-decorate` and `git diff origin/<base>..HEAD --stat`. Extract the related issue number, change description, type of change, and test procedure from commit messages, branch name, and changed files. Done when: issue number, change description, type, and test procedure are extracted from commits and diff.
6. Generate a conventional title in the form `<type>(<scope>): <summary>` when the project uses conventional commits (detected from `feat:`/`fix:`/etc. commit prefixes or `feat/`/`fix:` branch prefixes); omit the scope when none is evidenced. Otherwise generate a descriptive, non-generic title. Append the issue number if found (`feat: ... (#123)` or `... (fixes #456)`). Done when: a descriptive, non-generic PR title is generated with a conventional-commits prefix and issue number when applicable.
7. Build the PR body from the project template at `.github/pull_request_template.md` if it exists; fill every applicable section with the gathered context (summary, related issue, testing, breaking changes, type-of-change checkboxes, checklist items). If no template exists, write a body with `## Summary` and `## Testing` sections: state what changed and why for reviewers, and record only observed test results (say `Not run` when no test result is available; give no invented reason). Add issue links, screenshots, rollout notes, or reviewer guidance only when supplied or verified. Done when: the PR body is built from the template or a clear description, with every applicable section filled.
8. Decide draft vs. regular: use `--draft` when changes are incomplete, tests are failing, or early feedback is wanted; use a regular PR when changes are complete and ready for review. Done when: draft or regular status is decided based on change completeness.
9. Push all commits: `git push origin HEAD` (use `--force-with-lease` only after a rebase the user authorized). Done when: all commits are pushed to the remote.
10. Preview the title, base, draft status, and body to the user. Create or update the PR only after the user confirms: `gh pr create --title "PR_TITLE" --body "PR_BODY" --base <base>` for a new PR, or `gh pr edit <PR_NUMBER> --title "PR_TITLE" --body "PR_BODY"` for an update (append `--draft` when applicable). Pass the previewed title and body without interpolation through an unsafe shell string. Done when: the user confirms the preview and the PR is created or updated.
11. Query the remote PR after publication and confirm its URL, draft state, head and base branches, title, and body. For an update, success requires all values to match the preview. Open the PR in the browser to verify: `gh pr view --web`. Done when: the PR is open in the browser and all remote values match the preview.

## Quick procedure

1. Confirm the local branch is current and pushed to the remote. Done when: the local branch is current and pushed.
2. Resolve and confirm the base branch against the repository default; rebase or merge the base so the branch is not stale. Done when: the base branch is confirmed and the branch is not stale against it.
3. Draft the PR title and body from the branch commits; present them to the user for explicit approval before any remote action. Done when: the title and body are drafted and presented for user approval.
4. Create the PR with the approved title, body, and confirmed base, or update the existing PR's title, body, and base if one is already open. Done when: the PR is created or updated with the approved title, body, and confirmed base.
5. Wait for presubmit checks to run and report their status. Done when: presubmit checks have run and their status is reported, with green presubmit confirmed or failing checks identified.

## Failure and recovery

- `gh` not installed or not authenticated: stop and instruct the user to install `gh` or run `gh auth login`; do not create the PR.
- No commits ahead of base: stop and ask whether the user meant a different branch; no PR is created.
- Branch not pushed: push with `git push -u origin HEAD` before creating; if push fails, report the error and stop.
- PR already exists for the branch (full mode): do not create a duplicate; show the existing PR and ask whether to view, update, or close-and-recreate.
- Update target is not a draft or is closed: stop without changing it and report that state.
- Stale base (quick mode): rebase onto the confirmed base and re-push; do not open or update the PR until the base is merged.
- Title or body rejected (quick mode): revise per user feedback and re-present; do not create or update until approved.
- Merge conflicts with base: guide the user through resolving conflicts or rebasing; do not create the PR until the branch is conflict-free.
- Presubmit red (quick mode): report the failing checks and stop; do not claim done. Fix only with explicit user direction.
- Push rejected by branch protection: stop and report; do not force-push without explicit user approval.
- Verification mismatch: report the observed title, body, draft state, head, and base values that differ from the preview. Do not broaden the operation or claim the done predicate holds.
- Partial result rule: if PR creation fails after push, the branch is pushed but no PR exists; report the exact `gh` error and leave the remote branch in place for retry. If creation succeeded but confirmation failed, report the PR URL and the exact mismatches; do not delete the PR. Never leave a half-created or half-updated PR.
- Non-convergence: if prerequisites (review/CI/testing) are not satisfied or the user does not confirm the preview, stop and report the blocked state; never create the PR unconfirmed.

## Output

A GitHub pull request, open in the browser in full mode, with a descriptive title, a body following the project template (full mode) or an accurate title and body (quick mode), a linked issue if one was found, all commits pushed, the chosen draft/regular status, and a reported presubmit status. The terminal report states the PR number and URL, whether it was created or updated, and the confirmed title and body sections.
