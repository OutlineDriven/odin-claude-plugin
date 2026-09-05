---
name: gh-review-requests
description: 'Use when the user asks to find PRs to review or check the team review queue. Not for summarizing PR feedback: use resolve-pr-feedback. Read-only.'
---

# Gh review requests

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to find PRs to review, show review requests, or check the team review queue. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Fetches unread GitHub review-request notifications and filters by team; emits chat output only. |
| Done | A table of open PRs needing review with URLs and reasons, or a no-results report, is returned. |

## Not for

- Summarizing feedback on a specific PR: use resolve-pr-feedback.
- Resolving review feedback, use resolve-pr-feedback.
- Source or remote mutation: this skill is read-only.

## Inputs

- GitHub authentication via the authenticated `gh` CLI (verified with `gh auth status`) or a `GITHUB_TOKEN` available to `gh`. Required.
- Optional team filter: a team slug or name. When supplied, keep only review requests targeting that team or its members.
- Optional repository scope: one or more `owner/repo` strings. When supplied, restrict results to those repositories.

## Procedure

1. Verify `gh` is authenticated by running `gh auth status`. If it is not, stop and report the auth failure class; do not attempt to write credentials. Done when: `gh` is authenticated or the auth failure is reported.
2. Fetch unread notifications with reason `review_requested`: run `gh api --paginate /notifications` and keep entries where `reason == "review_requested"` and `unread == true`. Done when: unread review-requested notifications are fetched.
3. For each retained notification, resolve the subject URL into the PR record with `gh pr view <number> --repo <owner/repo> --json number,title,author,url,reviewRequests` to obtain title, author, URL, and the review request teams. Done when: every retained notification is resolved into a PR record.
4. If a team filter is supplied, keep only PRs whose `reviewRequests` include that team slug or one of its members; resolve members with `gh api /orgs/<org>/teams/<slug>/members` when the filter is a team slug. Done when: the team filter is applied or confirmed absent.
5. If a repository scope is supplied, drop any PR whose repository is not in the supplied set. Done when: the repository filter is applied or confirmed absent.
6. Build a table with columns: Repository, PR (title and number), Author, URL, Reason (e.g., "review requested", "team: <slug>"). Done when: the table is built with all five columns.
7. If the table is empty, return a no-results report stating that no unread review requests matched the filters. Done when: the table or no-results report is returned.

## Failure and recovery

- Auth failure: `gh auth status` reports no authenticated account. Stop; report the failure and that no notifications were fetched. Do not write or modify credentials.
- API rate limit: `gh api` returns a rate-limit error. Stop; report the limit and the partial result already collected, if any. Do not retry past the documented reset.
- Partial results: if pagination is interrupted, return the rows collected so far labeled as partial, and report the interruption. Do not silently drop the partial set.
- Non-mutation: no step writes files, commits, comments, updates notifications, or changes repository state. Recovery is re-running the skill; there is nothing to roll back.

## Output

A chat-output table of open PRs needing review, one row per PR, with Repository, PR, Author, URL, and Reason columns; or a no-results report when no unread review requests match the filters, partial results labeled as such.
