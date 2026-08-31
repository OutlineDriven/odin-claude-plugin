---
name: write-pr-description
description: 'Use when drafting or revising a PR description that gives reviewers context the diff cannot. Don''t use for writing commit messages, issue bodies, or release notes.'
disable-model-invocation: true
---

# Write PR description

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Drafting or revising a PR description. |
| Authority | Human-only. Preview the description and get explicit approval before writing to the remote PR. No autonomous writes. |
| Side effect | Writes or rewrites the PR body only. Remote target: the GitHub PR body. |
| Done | Description gives reviewer what the diff cannot, with no inflated claims. |

## Inputs

1. **PR number or URL** (required) — identifies the target PR.
2. **Diff context** (required) — the PR diff and changed-file list. Supplied by the caller or retrieved via `gh pr diff` and `gh pr view --json files`.
3. **Existing PR body** (optional) — current description, retrieved via `gh pr view --json body` when revising.

## Procedure

1. Validate the PR exists. Run `gh pr view <number> --json number,title,state`. If the command fails or returns no result, stop and report "PR not found."
2. Retrieve the diff scope. Run `gh pr diff <number>` and `gh pr view <number> --json files`. Record the changed files and diff summary.
3. If the diff is empty, stop and report "Empty diff — nothing to describe."
4. Read the changed files to understand intent. Identify the problem being solved, the approach taken, and any risks or tradeoffs.
5. If revising, read the existing PR body via `gh pr view <number> --json body`. Note what to preserve, replace, or remove.
6. Draft the description following these principles:
   - **Plain language**: use short sentences. Prefer concrete nouns and active verbs. Avoid jargon unless the audience requires it. State what changed and why, not how the code works internally.
   - **Review guide**: structure the description so a reviewer knows where to look first. Call out breaking changes, migration steps, and risk areas explicitly. Note testing performed. Do not restate what the diff already shows line-by-line.
   - **No inflated claims**: do not claim performance improvements, security fixes, or behavior changes the diff does not evidence. If uncertain, say so.
   - Use markdown headings or bullet points when the PR touches multiple concerns. Keep the total length proportional to the change size.
7. Present the draft description to the user. Show the full text. Wait for explicit approval, revision requests, or rejection.
8. On approval, write the description to the remote PR. Run `gh pr edit <number> --body "<approved description>"`. Confirm the write succeeded.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| PR not found | Stop. Report the error. No write attempted. |
| Empty diff | Stop. Report "Empty diff." No write attempted. |
| GitHub API failure | Stop. Report the API error. The PR body remains unchanged. |
| User rejects draft | Stop. No write attempted. The PR body remains unchanged. |

Partial-result rule: the description is written in full or not at all. No partial writes.
Non-mutation rule: on any failure, the PR body at the remote is unchanged from its state before the skill ran.
Blocked result: the skill reports the specific failure class and the PR body is not modified.

## Output
The approved PR description written to the GitHub PR body. On success, the PR body reflects the drafted and approved text. The user receives confirmation that the write succeeded.

## Provenance

- Origin: adapted from warpdotdev/common-skills `.agents/skills/write-pr-description/` (SKILL.md, references/plain-language.md, references/review-guide.md).
- Pinned revision: f589e224907eda566c13755529f59db563090d14.
- License: MIT — Copyright (c) 2026 Denver Technologies, Inc. Permissive: adaptation and redistribution permitted provided the copyright notice and permission notice are retained.
- Adaptation: clean-room rewrite in ODIN style. Plain-language and review-guide reference content inlined into the Procedure section. No third-party expression copied verbatim. The vendored pierre-diffs.js bundle is not carried over.
