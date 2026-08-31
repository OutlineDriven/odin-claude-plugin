---
name: diagnose-ci-failures
description: 'Triage PR CI failures via the GitHub CLI and produce a reviewable fix plan. Use when the user asks to check CI status or triage test failures. Not for applying CI fixes — use gh-fix-ci. No source or remote-system changes.'
---

# Diagnose CI failures

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to check CI status or triage test failures. |
| Authority | Read-only. No file, VCS, credential, or remote mutation. No fixes applied. |
| Side effect | Produces a fix-plan document in chat output only. |
| Done | Reviewable plan with failing checks, categories, and proposed fixes. |

## Inputs

- Current git branch with an open PR. Required; the workflow stops if no PR exists.
- GitHub CLI (`gh`) authenticated against the repository. Required.
- Optional: a specific run ID or check name to narrow triage scope.

## Procedure

1. Get the current branch with `git branch --show-current`, then view the PR with `GH_PAGER=cat gh pr view <branch> --json number,title,url,state`. Set `GH_PAGER=cat` on every `gh` invocation; the GitHub CLI has no global `--no-pager` option and `GH_PAGER` is its documented paging control, so without it `gh` blocks on a pager in non-interactive contexts. If no PR exists, inform the user and stop. **Done when:** the PR is identified or the skill stops because no PR exists.

2. Fetch CI check status with `GH_PAGER=cat gh pr view <branch> --json statusCheckRollup`. Parse the rollup to separate completed, successful, in-progress, and failed checks, recording each failed check's name and details URL. **Done when:** checks are partitioned into completed, successful, in-progress, and failed with failed-check names and URLs recorded.

3. If any check is still in progress, report which checks already failed or passed, highlight the in-progress checks, and suggest waiting for completion before diagnosing. Stop. **Done when:** in-progress checks are reported and the skill stops, or no check is in progress.

4. For each failed check, extract failure logs by run ID with `GH_PAGER=cat gh run view <run-id> --log-failed`. Collect error messages with file paths and line numbers, compilation errors, lint names, test failure messages and stack traces, and build root causes. **Done when:** every failed check's logs are collected with errors, paths, and line numbers, or the run is marked untriaged.

5. Categorize errors by type: formatting, linting, compilation, test failures, and platform-specific. **Done when:** every error is assigned a category.

6. Before flagging a test failure, check whether the same test previously passed in CI. A test that passes in CI but fails locally may be environment-specific or flaky; note it as such rather than treating it as a CI regression. **Done when:** each test failure is checked against prior CI history and flagged flaky or regressive.

7. Generate a fix-plan document with: a problem statement summarizing the failing checks, current state listing each error and its location, proposed changes per error category, and validation steps (fmt, clippy, tests, presubmit). Fix one category at a time. Do not apply any code change. **Done when:** the fix-plan document carries problem statement, current state, per-category proposed changes, and validation steps, with no code change applied.

## Failure and recovery
- No PR for the current branch: inform the user and stop. Do not create a PR.
- GitHub CLI not authenticated or unavailable: report the missing prerequisite and stop. Do not attempt credential setup.
- `gh run view --log-failed` returns empty or errors for a run: report which run could not be read, continue triaging the remaining failed checks, and mark the unread run as untriaged in the plan.
- CI still running: report the partial state and stop. Do not diagnose incomplete checks.
- Non-mutation rule: no file, branch, PR, or remote state is modified at any step. A partial result is a plan covering the triaged checks with untriaged checks explicitly marked.

## Output
A fix-plan document in chat: the failing checks, categorized errors with locations, proposed fixes per category, and validation steps, with untriaged checks explicitly marked and no code changes applied, ordered view-pr → fetch-checks → wait-if-running → extract-logs → categorize → check-flaky → generate-plan.

## Provenance

- Origin: github.com/warpdotdev/common-skills, path `.agents/skills/diagnose-ci-failures/SKILL.md`.
- Revision: f589e224907eda566c13755529f59db563090d14.
- License: MIT, Copyright (c) 2026 Denver Technologies, Inc.
- Adaptation: Rewritten in ODIN style. The triage-to-plan separation is preserved; cross-skill pointers to `create-pr` and `fix-errors` are removed so the procedure is self-contained. No third-party vendored assets are carried over.
