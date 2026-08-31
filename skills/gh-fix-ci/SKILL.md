---
name: gh-fix-ci
description: 'Use when the user asks to debug or fix failing CI checks on a GitHub pull request; failing checks are identified with log snippets, a fix plan approved and implemented, and status rechecked. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# gh fix CI

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to debug or fix failing CI checks on a GitHub pull request |
| Authority | Reversible local: write only named source files after plan approval; run read-only gh searches and log fetches; may suggest re-running checks. Roll back edited files via VCS (`git checkout`/`git restore` of the changed paths) |
| Side effect | Source files to fix failing CI checks (after plan approval); runs gh searches and log fetches; may suggest re-running checks |
| Done | Failing checks identified with log snippets, a fix plan approved and implemented, status rechecked |

## Inputs

- `repo`: path inside the repo (default `.`). Must be a Git repository.
- `pr`: PR number or URL (optional; defaults to the current branch PR).
- `gh` authenticated for the repo host with workflow/repo scopes.

## Procedure

1. Verify gh authentication. Run `gh auth status` in the repo. If unauthenticated, ask the user to run `gh auth login` before proceeding.
2. Resolve the PR. Prefer the current branch PR via `gh pr view --json number,url`. If the user supplies a PR number or URL, use it directly.
3. Inspect failing checks (GitHub Actions only). Prefer the bundled script, which handles gh field drift, run-id/job-id extraction, failure-snippet extraction, and exits non-zero while failures remain:
   - `python "<path-to-skill>/scripts/inspect_pr_checks.py" --repo "." --pr "<number-or-url>"`
   - Add `--json` for machine-friendly output.
   - Manual fallback: `gh pr checks <pr> --json name,state,bucket,link,startedAt,completedAt,workflow`; if a field is rejected, rerun with the available fields `gh` reports. For each failing check, extract the run id from `detailsUrl`, then `gh run view <run_id> --json name,workflowName,conclusion,status,url,event,headBranch,headSha` and `gh run view <run_id> --log`. If the run log is still in progress, fetch job logs via `gh api "/repos/<owner>/<repo>/actions/jobs/<job_id>/logs"`.
4. Scope non-GitHub Actions checks. If `detailsUrl` is not a GitHub Actions run, label the check external and report only the URL. Do not attempt Buildkite or other providers.
5. Summarize failures for the user: failing check name, run URL (if any), and a concise log snippet. Call out missing logs explicitly.
6. Create a fix plan and request approval before editing any file.
7. Implement after approval: apply the approved plan, summarize diffs and tests.
8. Recheck status: suggest re-running the relevant tests and `gh pr checks` to confirm.

## Failure and recovery
- gh unauthenticated: stop and ask the user to authenticate; no mutation performed.
- No PR resolvable: stop and report; no mutation performed.
- No failing checks: report success; no mutation performed.
- Log fetch pending or unavailable: report the check as `log_pending` or `log_unavailable` with the URL; do not fabricate a snippet.
- Plan not approved: do not edit files; report the proposed plan and wait.
- Partial fix: a fix that does not make the failing checks pass leaves the done predicate unmet; report the remaining failures and the diff applied so far. Roll back edited files via VCS when the user requests it.
- Blocked/non-converged result: failing checks remain after implementation and recheck, or a required input cannot be supplied.

## Output
A failing-check report (check name, run URL, log snippet, missing-log notes), an approved fix plan, the applied diff, and a rechecked `gh pr checks` status. Terminal classification: checks-pass or non-converged.

## Provenance

Origin: odin-1.x current skill `skills/gh-fix-ci/SKILL.md`. Revision: unpinned. License: project-owned. Adaptation: clean-room rewrite to the ODIN 2.0 contract; the bundled `inspect_pr_checks.py` is retained byte-for-byte as project-owned support.
