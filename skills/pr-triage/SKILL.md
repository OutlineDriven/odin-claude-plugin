---
name: pr-triage
description: 'Use when a human invokes grouped PR and issue triage with per-item approved actions. Not for force pushes or applying actions without explicit user approval per item.'
disable-model-invocation: true
---

# Triage PRs

## Contract

| Field | Bound contract |
|---|---|
| Trigger | /pr-triage [optional repo owner/name or GitHub PRs URL] |
| Authority | Human-only; requires explicit invocation. Preview target and consequence before any credential use, data-at-rest change, paid action, publishing, deployment, remote bulk mutation, or irreversible deletion. |
| Side effect | Reads PRs and issues via GitHub API; applies labels, posts comments, and merges only after explicit user approval per item. No force pushes. |
| Done | The grouped triage report is presented and every user-approved label, comment, merge, and cleanup is applied. |

## Inputs

- **Repo context** (optional): owner/name string or full GitHub PRs URL. If omitted, infer from the current working directory git remote.
- **GitHub CLI**: `gh` must be authenticated and able to read/write the target repository.

## Procedure

1. Resolve the target repository from the supplied argument or the current directory remote. If resolution fails, stop and report the failure. Done when: the target repository is resolved.
2. Fetch all open pull requests: `gh pr list --repo <owner/repo> --state open --json number,title,author,labels,createdAt,headRefName,baseRefName,isDraft,url --limit 200`. Done when: open PRs are fetched.
3. Fetch all open issues: `gh issue list --repo <owner/repo> --state open --json number,title,author,labels,createdAt,url --limit 200`. Done when: open issues are fetched.
4. Classify each PR and issue into groups: **Ready to merge** (all checks passing, no unresolved review threads, base is default branch), **Needs review** (no approvals or unresolved threads), **Draft**, **Stale** (no activity in 14 days), **Bug** (labeled `bug` or bug keywords in title), **Feature request** (labeled `enhancement` or `feature`), or **Other**. Done when: every PR and issue is classified into a group.
5. Present the grouped report to the user: one section per group, each listing number, title, author, age, and URL. Done when: the grouped report is presented.
6. For each group, propose actions: Ready to merge → offer merge (squash); Needs review → offer to request reviewers or post a status comment; Stale → offer to post a staleness comment or close; Bug → offer to label and prioritize; Feature request → offer to label. Done when: proposed actions are prepared per group.
7. Wait for the user to approve, modify, or reject each proposed action. Execute only approved actions. Done when: the user has approved, modified, or rejected each proposed action.
8. For each approved merge: `gh pr merge <number> --repo <owner/repo> --squash --delete-branch`. Done when: every approved merge is executed.
9. For each approved label: `gh issue edit <number> --repo <owner/repo> --add-label <label>` or the PR equivalent. Done when: every approved label is applied.
10. For each approved comment: `gh issue comment <number> --repo <owner/repo> --body <text>` or the PR equivalent. Done when: every approved comment is posted.
11. After all approved actions are applied, present a summary of actions taken and any items that remain pending. Done when: the summary is presented with applied and pending items.

## Failure and recovery
- **Authentication failure**: `gh` is not authenticated or lacks permission on the target repo. Report the error and stop. No mutation attempted.
- **Repo resolution failure**: Cannot determine owner/repo from argument or remote. Report the error and stop.
- **API rate limit**: GitHub API returns 403 or secondary rate limit. Report the limit state, stop, and advise the user to retry after the reset window.
- **Merge conflict**: `gh pr merge` fails due to conflicts. Report the specific PR and conflict state. Do not force-push or rebase. Leave the PR open.
- **Partial completion**: If some approved actions succeed and others fail, report per-item status. Do not roll back successful actions. Do not retry failed actions without user instruction.
- **Non-converged**: If the triage report cannot be produced (empty repo, all items already triaged, or API returns no data), report the terminal state and stop.

## Output
A grouped triage report with per-item proposed actions, followed by a post-execution summary listing every applied action and every item that remains pending or failed.

## Provenance

Origin: EveryInc/compound-engineering-plugin, file `.claude/commands/triage-prs.md`, revision `a1f601f17137f648be439965f8fdd9123303de5d`. License: MIT (Copyright (c) 2025 Every). Mechanisms extracted and rewritten in ODIN style; not copied verbatim. Attribution preserved in the root provenance ledger per MIT notice-retention obligation.
