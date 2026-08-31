---
name: gh-review-requests
description: 'Use when the user asks to find PRs to review, show review requests, or check the team review queue, fetch unread GitHub review-request notifications and return a table of open PRs needing review with URLs and reasons, or a no-results report. Don''t use for tasks that require source or remote-system changes.'
---

# Gh review requests

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to find PRs to review, show review requests, or check the team review queue. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Fetches unread GitHub review-request notifications and filters by team; emits chat output only. |
| Done | A table of open PRs needing review with URLs and reasons, or a no-results report, is returned. |

## Inputs

- GitHub authentication via the authenticated `gh` CLI (verified with `gh auth status`) or a `GITHUB_TOKEN` available to `gh`. Required.
- Optional team filter: a team slug or name. When supplied, keep only review requests targeting that team or its members.
- Optional repository scope: one or more `owner/repo` strings. When supplied, restrict results to those repositories.

## Procedure

1. Verify `gh` is authenticated by running `gh auth status`. If it is not, stop and report the auth failure class; do not attempt to write credentials.
2. Fetch unread notifications with reason `review_requested`: run `gh api --paginate /notifications` and keep entries where `reason == "review_requested"` and `unread == true`.
3. For each retained notification, resolve the subject URL into the PR record with `gh pr view <number> --repo <owner/repo> --json number,title,author,url,requestedReviewers,reviewRequests` to obtain title, author, URL, and the requested reviewers or teams.
4. If a team filter is supplied, keep only PRs whose `reviewRequests` or `requestedReviewers` include that team slug or one of its members; resolve members with `gh api /orgs/<org>/teams/<slug>/members` when the filter is a team slug.
5. If a repository scope is supplied, drop any PR whose repository is not in the supplied set.
6. Build a table with columns: Repository, PR (title and number), Author, URL, Reason (e.g., "review requested", "team: <slug>").
7. If the table is empty, return a no-results report stating that no unread review requests matched the filters.

## Failure and recovery
- Auth failure: `gh auth status` reports no authenticated account. Stop; report the failure and that no notifications were fetched. Do not write or modify credentials.
- API rate limit: `gh api` returns a rate-limit error. Stop; report the limit and the partial result already collected, if any. Do not retry past the documented reset.
- Partial results: if pagination is interrupted, return the rows collected so far labeled as partial, and report the interruption. Do not silently drop the partial set.
- Non-mutation: no step writes files, commits, comments, updates notifications, or changes repository state. Recovery is re-running the skill; there is nothing to roll back.

## Output
A chat-output table of open PRs needing review, one row per PR, with Repository, PR, Author, URL, and Reason columns; or a no-results report when no unread review requests match the filters. Partial results are labeled as such.

## Provenance

Origin: getsentry/skills. Pinned revision: c2f99a5b04b4cd992ec3022d7c2c3e23e938d241. License: Apache-2.0. Adapted clean-room from `skills/gh-review-requests/SKILL.md`: remapped from odin-orchestration to odin-run and restated as a read-only, model+human procedure that fetches unread GitHub review-request notifications and filters by team.
