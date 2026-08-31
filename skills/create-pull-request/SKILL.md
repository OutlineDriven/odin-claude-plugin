---
name: create-pull-request
description: 'Use when the user asks to create a PR, summarize changes for review, or open a pull request. Don''t use for multi-PR stacks or release publishing.'
disable-model-invocation: true
---

# Create pull request

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to create a PR, summarize changes for review, or open a pull request |
| Authority | Human-only. Requires explicit human invocation. Preview the PR target (base branch, commits, title, and body) and the remote consequence before creating the PR on GitHub. |
| Side effect | Creates a GitHub PR with a descriptive title, commit title, and body; optionally as a draft. Remote mutation on GitHub, bounded to one PR for the current branch. |
| Done | PR exists with a proper title, linked issue if any, and body following the project template; all commits pushed; and is open in the browser |

## Inputs

Required:
- A current git branch that is not `main`/`master`, with commits ahead of the base branch.
- `gh` CLI installed and authenticated (`gh --version`, `gh auth status`).

Optional:
- A related issue number, inferred from commit messages or branch name (`#123`, `fixes #123`, `closes #123`).
- A PR template at `.github/pull_request_template.md`.
- Draft intent from the user.

## Procedure

1. Verify prerequisites: `gh` is installed and authenticated, and the working directory is clean (`git status`). If uncommitted changes exist, ask the user whether to commit, stash, or discard them before proceeding.
2. Before creating a PR, ensure related review, CI, and testing workflows have been satisfied. Do not proceed with PR creation until those prerequisites are met.
3. Check for an existing PR on the current branch: `gh pr list --head $(git branch --show-current) --json number,title,url`. If a PR already exists, show it and ask whether to view, update, or close-and-recreate; only create a new PR if none exists.
4. Identify the current branch and the base branch (`git remote show origin | grep "HEAD branch"`). Refuse if on `main`/`master`; ask the user to switch to a feature branch.
5. Analyze the commits and diff for this PR: `git log origin/<base>..HEAD --oneline --no-decorate` and `git diff origin/<base>..HEAD --stat`. Extract the related issue number, change description, type of change, and test procedure from commit messages, branch name, and changed files.
6. Generate a descriptive PR title. Avoid generic titles ("fix", "update", "initial commit"). If the project uses conventional commits (detected from `feat:`/`fix:`/etc. commit prefixes or `feat/`/`fix/` branch prefixes), use the matching prefix. Append the issue number if found (`feat: ... (#123)` or `... (fixes #456)`).
7. Build the PR body from the project template at `.github/pull_request_template.md` if it exists; fill every applicable section with the gathered context (summary, related issue, testing, breaking changes, type-of-change checkboxes, checklist items). If no template exists, write a clear description with summary, related issue, testing performed, and notable impacts.
8. Decide draft vs. regular: use `--draft` when changes are incomplete, tests are failing, or early feedback is wanted; use a regular PR when changes are complete and ready for review.
9. Push all commits: `git push origin HEAD` (use `--force-with-lease` only after a rebase the user authorized).
10. Preview the title, base, draft status, and body to the user. Create the PR only after the user confirms: `gh pr create --title "PR_TITLE" --body "PR_BODY" --base <base>` (append `--draft` when applicable).
11. Open the PR in the browser to verify: `gh pr view --web`.

## Failure and recovery
- `gh` not installed or not authenticated: stop and instruct the user to install `gh` or run `gh auth login`; do not create the PR.
- No commits ahead of base: stop and ask whether the user meant a different branch; no PR is created.
- Branch not pushed: push with `git push -u origin HEAD` before creating; if push fails, report the error and stop.
- PR already exists for the branch: do not create a duplicate; show the existing PR and ask whether to view, update, or close-and-recreate.
- Merge conflicts with base: guide the user through resolving conflicts or rebasing; do not create the PR until the branch is conflict-free.
- Partial result rule: if PR creation fails after push, the branch is pushed but no PR exists; report the exact `gh` error and leave the remote branch in place for retry.
- Non-convergence: if prerequisites (review/CI/testing) are not satisfied or the user does not confirm the preview, stop and report the blocked state; never create the PR unconfirmed.

## Output
A GitHub pull request, open in the browser, with a descriptive title, a body following the project template, a linked issue if one was found, all commits pushed, and the chosen draft/regular status. The terminal report states the PR number and URL.

## Provenance

Origin: https://github.com/warpdotdev/oz-skills, revision 6c08c49fc6c51b8f768bf8c53c041bc06a160765, file `.agents/skills/create-pull-request/SKILL.md`, MIT license (Copyright 2026 Warp). Clean-room adaptation: the commit-to-PR transformation mechanism (title and body derived from local git context and the project template, gated on review/CI/testing workflows, created and verified with `gh`) is preserved; expression rewritten.
