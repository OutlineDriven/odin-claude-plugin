---
name: get-pr-comments
description: 'Use when asked to summarize feedback on the active PR. Returns severity-grouped feedback and an action list. Not for finding PRs to review — use gh-review-requests. Not for resolving feedback — use resolve-pr-feedback. Read-only.'
---

# Get PR comments

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Summarize feedback on the active PR. |
| Authority | Read-only GitHub access; no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only; reads GitHub through an authenticated read-only API. |
| Done | Severity-grouped feedback and action list returned. |

## Not for

- Finding PRs to review — use gh-review-requests.
- Resolving review feedback — use resolve-pr-feedback.
- Source or remote mutation — this skill is read-only.

## Inputs

- PR number or URL (optional; defaults to the PR open for the current branch).
- Repository owner/repo (optional; defaults to the current git remote).

## Procedure

1. Resolve the target PR: if a number or URL is supplied, use it; otherwise run `gh pr view --json number,url,headRefName` and use the PR for the current branch. Done when: the target PR is resolved.
2. Fetch review feedback: run `gh pr view <number> --json reviews,comments` to collect review decisions and general comments. Resolve `<owner>` and `<repo>`, then run `gh api graphql --raw-field owner='<owner>' --raw-field name='<repo>' -F number=<number> -f query='query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewThreads(first:100){nodes{isResolved comments(first:100){nodes{body author{login} path line}}}}}}}'` to collect inline comments and thread-resolution state. Done when: review decisions, general comments, and inline threads are fetched.
3. Classify every comment into a severity tier using the PR-level review decisions from step 2: blocking (the review decision is `CHANGES_REQUESTED`), suggestion (the review decision is `COMMENT` and the comment is not a question), nit (the review decision is `APPROVE` but the comment notes a minor issue), or question (the comment text ends with `?` or asks for clarification). Use the review `state` field from `gh pr view --json reviews`, not thread-level states. Done when: every comment is classified into a tier.
4. Group feedback by severity tier; within each tier list the author, file, line, and comment text. Mark resolved threads distinctly from open ones. Done when: feedback is grouped by tier with resolved threads marked.
5. Build an action list ordered blocking first, then suggestion, nit, question; each entry names the comment it derives from. Done when: the action list is built with entries traceable to source comments.

## Failure and recovery

- **No open PR on the current branch and no PR supplied**: report blocked; do not mutate anything.
- `gh` not authenticated or no GitHub remote: report blocked; do not attempt login or credential creation.
- API rate limit or network error: report blocked with the error; do not emit a partial report that omits unseen comments.
- Thread limit reached (100 inline threads or 100 comments per thread): the GraphQL query caps at 100 threads and 100 comments per thread. If the PR has more, label the report `truncated: more than 100 threads or comments exist — not all feedback is shown`. Return the partial report with the truncation label; this satisfies the done predicate.
- Empty comment set: return an empty report stating no feedback was found; this satisfies the done predicate.

## Output

A chat report with feedback grouped by severity tier (blocking, suggestion, nit, question) and an ordered action list — each action traceable to its source comment.
