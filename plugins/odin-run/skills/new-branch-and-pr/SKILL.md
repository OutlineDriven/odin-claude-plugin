---
name: new-branch-and-pr
description: 'Use when a human explicitly asks to ship work through a clean branch and pull request. Don''t use for force-pushing, reusing conflicting branches, or widening the change scope.'
disable-model-invocation: true
---

# New branch and PR

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human explicitly asks to ship work through a clean branch and pull request. |
| Authority | Create a local branch and commit only for this request; before pushing or opening the pull request, preview the remote, base, head branch, included changes, and publishing consequence. |
| Side effect | Creates one focused branch, commits its intended changes, pushes that branch, and opens one pull request without mutating unrelated work or other remote branches. |
| Done | The intended changes are committed on the focused branch and the remote operation is confirmed by a pull-request URL. |

## Inputs

Required: the repository containing the work, the intended changes to publish, and the pull-request base branch. The target remote must be supplied or unambiguously established by repository configuration. A branch name, commit message, pull-request title, and pull-request body are optional; when omitted, derive them only from the inspected change and repository state. Publishing credentials must already be available in the execution environment; never request, print, copy, or persist credential values.

## Procedure

1. Inspect the repository status, current branch, configured remotes, intended base, and diff. Stop if the repository, base, target remote, or intended change set is missing or ambiguous. Done when: the repository root, current branch, remote list, base branch, and diff are all read and recorded, or a missing or ambiguous input is named and the stop is reported.
2. Bound the publication to the intended changes. Exclude unrelated tracked, staged, and untracked work; stop if separating it would overwrite or discard any work. Done when: the bounded change set contains only the intended changes, and no unrelated tracked, staged, or untracked work is included, or an unsafe separation is named and the stop is reported.
3. Choose the supplied branch name or derive a concise name from the bounded change. Confirm that creating and publishing it will not overwrite an existing local or remote branch; stop on a conflicting branch rather than force-update it. Done when: a branch name is chosen that does not match any existing local or remote branch, or a conflict is named and the stop is reported.
4. Create the new branch from the intended base while preserving the bounded changes. Stage only those changes, review the staged diff, and stop if it contains secrets, generated debris, unrelated files, or changes outside the bounded scope. Done when: the new branch is created from the intended base, the staged diff contains exactly the bounded changes, and no secrets, debris, or out-of-scope files are present, or a contamination finding is named and the stop is reported.
5. Inspect the repository manifest and continuous-integration configuration for commands that directly exercise the included files. Run the narrowest deterministic command that covers the bounded change from the repository root. Record the exact command, exit result, and relevant output; if no covering command exists or the required runtime is unavailable, record that fact and do not claim the check ran. Done when: the exact check command and its exit result are recorded, or the absence of a covering command or runtime is recorded as a fact rather than assumed.
6. Commit the staged change with the supplied message or one derived from the reviewed diff. Confirm the commit contains exactly the bounded files and no unrelated changes. Done when: the commit is created and `git show --stat <commit>` lists exactly the bounded files and no others.
7. Before any remote mutation, present a preview naming the remote, base branch, new head branch, commit, included files, pull-request title, and the consequences that the branch will be pushed and a pull request will be created. Proceed only because this skill was explicitly invoked by a human; if the requested target differs from the validated preview, stop and report the mismatch. Done when: the preview is presented to the user and the user confirms it matches their intent, or a mismatch between the requested target and the preview is named and the stop is reported.
8. Push only the new branch without force, then open one pull request from that branch to the validated base. Use supplied pull-request text or derive factual text from the commit and checks actually observed; never invent test results, issue links, reviewers, or deployment claims. Done when: the branch is pushed to the remote and one pull request is opened returning a URL, or the push or PR creation failed and the error is recorded.
9. Read the created pull request's remote response and confirm its base, head, and URL. Return the branch, commit, push result, pull-request URL, and check evidence. Done when: the remote PR response confirms the base branch, head branch, and URL match what was pushed, and all five values are returned, or a mismatch is named and the stop is reported.

## Failure and recovery

- Invalid or ambiguous repository state: make no branch, commit, or remote mutation; return `blocked` with the unresolved repository, base, remote, or scope fact.
- Unsafe scope or branch conflict: do not discard work, stage unrelated files, reuse a conflicting remote branch, force-push, or widen scope; return `blocked` with the conflicting files or branch.
- Check or commit failure: do not push or open a pull request. Preserve the local branch and working state for inspection, and return `blocked` with the failing command and observed error.
- Push failure: do not open a pull request or rewrite remote history. Preserve the local branch and commit, and return `partial` with the commit identifier and push error so the same push can be retried after the cause is fixed.
- Pull-request creation or confirmation failure after a successful push: do not create another branch or duplicate commits. Return `partial` with the pushed remote branch and observed error; retry creation against that branch only after resolving the cause.
- Incorrect remote result: do not report success. Return `blocked` with the observed base, head, or URL mismatch and leave remote correction to an explicitly authorized operation.

## Output

On success, return `complete` with the local and remote branch name, base branch, commit identifier, included files, checks actually run and their results, and the confirmed pull-request URL. On failure, return the exact `blocked` or `partial` result defined above, including completed mutations and the recovery point; never claim the done predicate without a confirmed URL.
