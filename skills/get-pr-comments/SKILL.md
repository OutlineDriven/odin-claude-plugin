---
name: get-pr-comments
description: 'Use when asked to summarize feedback on the active PR. Return severity-grouped feedback and an action list. Don''t use for tasks that require source or remote-system changes.'
---

# Get PR comments

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Summarize feedback on the active PR. |
| Authority | Read-only GitHub access; no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only; reads GitHub through an authenticated read-only API. |
| Done | Severity-grouped feedback and action list returned. |

## Inputs

- PR number or URL (optional; defaults to the PR open for the current branch).
- Repository owner/repo (optional; defaults to the current git remote).

## Procedure

1. Resolve the target PR: if a number or URL is supplied, use it; otherwise run `gh pr view --json number,url,headRefName` and use the PR for the current branch.
2. Fetch review feedback: run `gh pr view <number> --json reviews,comments` to collect review decisions and general comments. Resolve `<owner>` and `<repo>`, then run `gh api graphql --raw-field owner='<owner>' --raw-field name='<repo>' -F number=<number> -f query='query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewThreads(first:100){nodes{isResolved comments(first:100){nodes{body author{login} path line}}}}}}}'` to collect inline comments and thread-resolution state.
3. Classify every comment into a severity tier: blocking (change requested or unresolved thread marked blocking), suggestion, nit, or question.
4. Group feedback by severity tier; within each tier list the author, file, line, and comment text. Mark resolved threads distinctly from open ones.
5. Build an action list ordered blocking first, then suggestion, nit, question; each entry names the comment it derives from.

## Failure and recovery
- No open PR on the current branch and no PR supplied: report blocked; do not mutate anything.
- `gh` not authenticated or no GitHub remote: report blocked; do not attempt login or credential creation.
- API rate limit or network error: report blocked with the error; do not emit a partial report that omits unseen comments.
- Empty comment set: return an empty report stating no feedback was found; this satisfies the done predicate.

## Output
A chat report with feedback grouped by severity tier (blocking, suggestion, nit, question) and an ordered action list, each action traceable to its source comment.

## Provenance

Origin: cursor/plugins. Pinned revision: 68836ddaf5697224520f1847d90cdb90ca8babaa. License: MIT (declared by the cursor/plugins root README and the candidate plugin manifest, per the pinned source audit). Adaptation: clean-room rewrite preserving the read-only PR-feedback-research mechanism; no third-party expression copied.
