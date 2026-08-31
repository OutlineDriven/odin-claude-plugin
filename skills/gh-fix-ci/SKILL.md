---
name: gh-fix-ci
description: 'Use when the user asks to debug or fix failing CI on a GitHub PR: diagnose, approved plan, fix, recheck. Also handles an explicitly asked push of a ci-fix/<branch> fix and red non-PR runs. Not for deploys, credentials, permission-widening, or rerun-as-fix; non-CI bugs use fix.'
---

# GH fix CI

Not for deploys, publishing, or credential handling; never widens workflow permissions or adds `pull_request_target`; never offers a rerun in place of a code fix. Non-CI bugs belong to `fix`; merge conflicts to `resolve-merge-conflicts`. Two modes: **interactive** (default, reversible local) and **autonomous** (remote push, entered only on explicit user ask).

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Interactive: user asks to debug or fix failing CI on a GitHub PR. Autonomous: user explicitly asks for the fix to be pushed. |
| Authority | Interactive: reversible local — write only named source files after plan approval; no remote mutation. Autonomous: the only remote mutation is creating or updating `ci-fix/<original-branch>` on the same remote; never opens a PR. |
| Rollback | Interactive: VCS restore (`git checkout`/`git restore`) of the changed paths. Autonomous: persistent failure leaves the branch and its runs in place as evidence. |
| Done | Interactive: failing checks identified with log snippets, a fix plan approved and implemented, `gh pr checks` rechecked. Autonomous: a new run on `ci-fix/<original-branch>` is green and the four-field summary delivered. `done` is claimed only on green. |

## Inputs

- `repo`: path inside the repo (default `.`). Must be a Git repository.
- Target: PR number or URL, original branch name, or run ID; defaults to the current branch's PR. A working tree already carrying the in-progress fix is fine.
- `gh` authenticated for the repo host with workflow/repo scopes; an unauthenticated CLI stops the skill before any change.
- Optional: a specific job ID for full-log inspection, or an artifact download when logs alone do not identify the cause.

## Procedure — interactive (spine)

1. Verify gh authentication: `gh auth status`. If unauthenticated, stop and ask the user to run `gh auth login`; no mutation before this. Done when: an authenticated identity is confirmed or the handoff is asked.
2. Resolve the failing run. PR: `gh pr view --json number,url`. Non-PR branch or supplied run ID: `gh run list --branch <branch> --status failure --limit 5`, then `gh run view <run-id>`. Done when: one failing run is identified by id and branch.
3. Inspect failing checks (GitHub Actions only). Prefer the bundled script, which handles gh field drift, run-id/job-id extraction, failure-snippet extraction, and exits non-zero while failures remain:
   - `python "<path-to-skill>/scripts/inspect_pr_checks.py" --repo "." --pr "<number-or-url>"` (`--json` for machine output).
   - Manual fallback: `gh pr checks <pr> --json name,state,bucket,link,startedAt,completedAt,workflow`; rerun with the fields `gh` accepts if one is rejected. Extract the run id from `detailsUrl`, then `gh run view <run_id> --json name,workflowName,conclusion,status,url,event,headBranch,headSha` and `gh run view <run_id> --log`; for one failing job use `gh run view <run-id> --log --job <job-id>`; for evidence logs cannot supply, `gh run download <run-id> -D .artifacts/<run-id>`. If a run log is still in progress, fetch job logs via `gh api "/repos/<owner>/<repo>/actions/jobs/<job_id>/logs"`.
   - A check whose `detailsUrl` is not a GitHub Actions run is external: report the URL only; do not attempt Buildkite or other providers.
   Done when: every failing check has a name, URL, and a log snippet — or an explicit `log_pending`/`log_unavailable` marker; never a fabricated snippet.
4. Diagnose the root cause: build/compilation error, test failure (including flaky), lint/format violation, or environment issue (missing secrets, permissions, resource limits). Done when: one cause is named with log evidence.
5. Plan the smallest deterministic fix for that cause; prefer a code change over workflow plumbing; for a flaky test, fix the nondeterminism instead of rerunning. Request approval before editing any file. Done when: the plan is approved, or refused — then report the plan and wait.
6. Implement the approved plan and summarize diffs and tests. Done when: the working tree carries only the previewed change set, kept inside the failing job/step where possible.
7. Recheck: suggest rerunning the relevant tests and `gh pr checks`. Done when: status is reported as checks-pass or non-converged.

## Autonomous mode (explicit user ask only)

Gate: enter only when the user asks for the fix to be pushed (for example "push the fix" or "land it on a fix branch"); never self-initiated. Before any mutation, preview the failing job, the exact change set, and the target branch `ci-fix/<original-branch>` — the plan approval from spine step 5 doubles as the push approval once the preview is acknowledged.

1. Run spine steps 1–5 (auth, locate, evidence, cause, plan). Done when: plan approved with the push preview acknowledged.
2. If workflow files must change: keep existing `permissions:` minimal, never broaden token access, no `pull_request_target` unless the user explicitly requested it. Done when: the diff touches no permission key not previewed.
3. Create or update the branch. New: `git checkout -b ci-fix/<original-branch>`. Existing: show its current commits, confirm reuse with the user, `git checkout ci-fix/<original-branch>`, then `git pull origin <original-branch>`. Done when: the branch is checked out and carries only the previewed change.
4. Stage (`git add -A`), commit `fix: resolve CI failure in <job-name>`, push `git push -u origin ci-fix/<original-branch>` (plain `git push` once upstream is set). Done when: the remote branch exists at the pushed SHA.
5. Watch: `gh run list --branch ci-fix/<original-branch> --limit 1` for the new run id, then `gh run watch <new-run-id> --exit-status`. Re-trigger only failed jobs with `gh run rerun <new-run-id> --failed` when the evidence is infrastructure or a confirmed flake and the user approves; a rerun never substitutes for a deterministic fix. Done when: the run is green, or the failure classification below applies.

## Failure and recovery

- gh unauthenticated, or no failing run found for the supplied PR/branch/run ID: stop and report; nothing committed or pushed.
- Logs do not identify a root cause (insufficient logs, unreproducible secret or environment failure): report the evidence found; no guessed fix; in autonomous mode push nothing.
- The smallest fix requires widening scope beyond the failing job/step or broadening workflow permissions: stop and report why; never expand permissions to make tests pass.
- Interactive non-convergence: report remaining failures and the diff applied; roll back edited files via VCS when the user requests it.
- Autonomous run still red: diagnose the new failure and apply one further in-scope fix; still failing with no new actionable cause → blocked, with the failing-run link, analysis so far, and the exact failing job. Leave the branch and runs in place; never delete or force-push to hide a failure unless the user asks.
- Push or watch interrupted: the remote branch state is authoritative — re-run `gh run list --branch ci-fix/<original-branch> --limit 1` and resume watching; never re-push blindly.

## Output

Interactive: failing-check report (check name, run URL, log snippet, missing-log notes), then approved plan, then applied diff, then rechecked `gh pr checks` status; terminal `checks-pass` or `non-converged`. Autonomous: summary in fixed order — failing run (link or ID), root cause, fix (what changed), verification (new run link showing green); terminal `done`, `blocked` (exact reason), or `non-passing` (link and analysis).

## Provenance

Origin: odin-1.x current skill `skills/gh-fix-ci/SKILL.md`. Revision: unpinned. License: project-owned. Adaptation: clean-room rewrite to the ODIN 2.0 contract; the bundled `inspect_pr_checks.py` is retained byte-for-byte as project-owned support. Absorbed `skills/ci-fix` (M7): origin https://github.com/warpdotdev/oz-skills, `.agents/skills/ci-fix/SKILL.md`, pinned revision `6c08c49fc6c51b8f768bf8c53c041bc06a160765`, MIT per repository root `LICENSE` (Copyright 2026 Warp) — attribution preserved; its log-triage, smallest-deterministic-fix, failed-jobs-only-rerun, and `ci-fix/<original-branch>` push mechanisms are retained in the autonomous mode above.
