---
name: publish-pr
description: 'Use when the user explicitly asks to open, update, or refresh a draft PR or write a PR description. Don''t use for merging PRs, changing a ready (non-draft) PR, or branch and commit management.'
disable-model-invocation: true
---

# PR writer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user explicitly asks to open, update, or refresh a PR, or write a PR description. |
| Authority | Act only on explicit human invocation. Before using credentials or publishing, preview the repository, head and base branches, whether the operation creates or updates a draft PR, and the proposed title and body. |
| Side effect | Create one draft PR or update one identified draft PR through `gh`; do not mutate branches, commits, issues, releases, or any other PR. |
| Done | The remote draft PR is confirmed to have a conventional title and a concise reviewer-facing body with the applicable optional aids. |

## Inputs

Required: the repository and head branch, supplied by the user or resolved from the current checkout; the base branch, supplied by the user or resolved from the repository's remote default; and enough change context from the branch diff and commits to describe the work without inference beyond available evidence. For an update, the target draft PR must be uniquely identified by number, URL, or the current head branch. Optional inputs are a requested title, issue references, test results, screenshots, rollout notes, and reviewer guidance; include them only when supplied or verified.

## Procedure

1. Resolve the repository, head branch, base branch, and operation type. Use read-only `git` and `gh` queries to inspect the branch diff, commits, remote default branch, and existing PRs. If the repository, branches, or update target remain ambiguous, stop without publishing.
2. For creation, verify that no open PR already represents the same head branch. For update, verify that exactly one target exists and is a draft; do not create a duplicate, convert a ready PR to draft, or select a PR by guesswork.
3. Derive a conventional title in the form `<type>(<scope>): <summary>`, omitting the scope when none is evidenced. Keep the summary specific to the actual change.
4. Draft a concise body with `## Summary` and `## Testing`. State what changed and why for reviewers. Record only observed test results; when no test result is available, say `Not run` and give no invented reason. Add issue links, screenshots, rollout notes, or reviewer guidance only when applicable and verified.
5. Preview the exact repository, head and base branches, create-or-update consequence, title, and body before any authenticated publishing command. The user's explicit invocation authorizes only this previewed operation.
6. Publish with `gh pr create --draft` for a new PR or `gh pr edit` for the identified draft PR, passing the previewed title and body without interpolation through an unsafe shell string.
7. Query the remote PR after publication and confirm its URL, draft state, head and base branches, title, and body. Success requires all values to match the preview.

## Failure and recovery
- **Invalid or ambiguous target:** stop before mutation and report the unresolved repository, branch, duplicate, or PR identity.
- **Unsupported target state:** if an update resolves to a non-draft or closed PR, stop without changing it and report that state.
- **Authentication, authorization, network, or API failure:** report the command's failure and do not retry against another repository, branch, or PR.
- **Partial remote result:** query the target once to determine its actual state. If creation succeeded but confirmation or a later update failed, report the PR URL and the exact mismatches; do not claim completion or delete the PR. If no PR can be identified, report that the remote result is unknown.
- **Verification mismatch:** report the observed title, body, draft state, head, and base values that differ from the preview. Do not broaden the operation or claim the done predicate holds.

A blocked result names the failure class, target, observed remote state when available, and the exact action not completed.

## Output
On success, return the draft PR URL and number, whether it was created or updated, its repository, head and base branches, conventional title, and the confirmed body sections and optional aids. On failure, return the blocked result defined above.

## Provenance

Adapted from `getsentry/skills`, path `skills/pr-writer/SKILL.md`, pinned at revision `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241` under Apache-2.0. This version preserves the `gh`-based remote PR creation and update mechanism, draft publication boundary, conventional title, concise reviewer-facing body, and optional review aids while restating the procedure for this contract.
