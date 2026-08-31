---
name: create-pr
description: 'Use when the user mentions opening a PR. Not for full PR creation with template/CI gates — use create-pull-request. Not for multi-PR stacks or full release flows.'
disable-model-invocation: true
---

# Create PR

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User mentions opening a PR. |
| Authority | Human-only. Creating or updating a GitHub pull request mutates remote state. A human approves the title, body, base, and each remote action before it runs. |
| Side effect | Opens or updates a PR on GitHub. Remote target: the GitHub pull request (create or update). |
| Done | PR exists with accurate title/body, merged base, and green presubmit. |

## Inputs

- Local branch with commits to ship (required).
- Base branch (required; confirm against the repository default branch).
- PR title and body (required; supplied by the user or drafted for explicit user approval before any remote action).
- GitHub remote and repository (required; resolved from the local git remote).
- Presubmit check set (required; the repository CI gates to verify before claiming done).

## Procedure

1. Confirm the local branch is current and pushed to the remote. Done when: the local branch is current and pushed.
2. Resolve and confirm the base branch against the repository default; rebase or merge the base so the branch is not stale. Done when: the base branch is confirmed and the branch is not stale against it.
3. Draft the PR title and body from the branch commits; present them to the user for explicit approval before any remote action. Done when: the title and body are drafted and presented for user approval.
4. Create the PR with the approved title, body, and confirmed base, or update the existing PR's title, body, and base if one is already open. Done when: the PR is created or updated with the approved title, body, and confirmed base.
5. Wait for presubmit checks to run and report their status. Done when: presubmit checks have run and their status is reported, with green presubmit confirmed or failing checks identified.

## Failure and recovery
- Stale base: rebase onto the confirmed base and re-push; do not open or update the PR until the base is merged.
- Title or body rejected: revise per user feedback and re-present; do not create or update until approved.
- Presubmit red: report the failing checks and stop; do not claim done. Fix only with explicit user direction.
- Push rejected by branch protection: stop and report; do not force-push without explicit user approval.
- Partial result: never leave a half-created or half-updated PR. If creation or update fails mid-way, report the exact PR state and the remaining steps.

## Output
A GitHub pull request that exists with an accurate title and body, a merged (non-stale) base, and green presubmit checks, plus a report of the PR URL, base branch, and check status.

## Provenance

Origin: https://github.com/warpdotdev/common-skills, path .agents/skills/create-pr/SKILL.md. Revision f589e224907eda566c13755529f59db563090d14. License MIT (Copyright (c) 2026 Denver Technologies, Inc.). Clean-room adaptation: the title/body/base/presubmit gate mechanism is rewritten in ODIN style; no third-party expression is copied.
