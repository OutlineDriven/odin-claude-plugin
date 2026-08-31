---
name: ci-fix
description: 'Use when a CI run is red and the user asks for a fix. Diagnoses the failure from gh logs, lands the smallest deterministic fix, and pushes the ci-fix/<original-branch> branch. Don''t use for failures needing widened scope, broader workflow permissions, or a rerun in place of a code fix.'
disable-model-invocation: true
---

# CI fix

## Contract

| Field | Bound contract |
|---|---|
| Trigger | CI is failing, a run is red, broken, or needs diagnosis. |
| Authority | Human invocation only. The remote push of the fix branch is the mutation; preview the target branch and the exact change set before it. No other remote mutation and no PR creation. |
| Side effect | Creates or updates only `ci-fix/<original-branch>` and pushes it to the same remote. |
| Done | A new CI run on the fix branch passes and the user has a summary of the failing run, root cause, fix, and verification link. |

## Inputs

- A repository with the failing CI run; the working tree may already carry the in-progress fix.
- One of: PR number, original branch name, or run ID identifying the failing run. If none is supplied, locate it from the current branch with `gh`.
- An authenticated GitHub CLI (`gh`); an unauthenticated CLI stops the skill before any change.
- Optional: a specific job ID for full-log inspection, or an artifact download when logs alone do not identify the cause.

## Procedure

1. Run `gh auth status`. If unauthenticated, stop: instruct the user to run `gh auth login` and make no change.
2. Locate the failing run. On a PR branch: `gh pr view --json statusCheckRollup --jq '.statusCheckRollup[] | select(.conclusion == "FAILURE")'`. Otherwise: `gh run list --branch <branch> --status failure --limit 5`, then `gh run view <run-id> --verbose`.
3. Extract evidence: `gh run view <run-id> --log-failed`; for one failing job `gh run view <run-id> --log --job <job-id>`; when logs are insufficient `gh run download <run-id> -D .artifacts/<run-id>`.
4. Identify the root cause from the logs: build/compilation errors, test failures (including flaky), lint/format violations, or environment issues (missing secrets, permissions, resource limits).
5. Choose the smallest fix that resolves that cause. Prefer a deterministic code change over a workflow plumbing change; for a flaky test, fix the nondeterminism instead of rerunning.
6. Preview before mutating: name the failing job, the files to change, and the target branch `ci-fix/<original-branch>`. Make only that change: nothing unrelated, kept inside the failing job/step where possible.
7. If workflow files must change: keep existing `permissions:` minimal, never broaden token access, and do not add or use `pull_request_target` unless the user explicitly requested it.
8. Create or update the fix branch. New: `git checkout -b ci-fix/<original-branch>`. Existing: show its current commits to the user, confirm reuse, `git checkout ci-fix/<original-branch>`, then `git pull origin <original-branch>`. Stage the previewed change set with `git add -A`, commit with a `fix: resolve CI failure in <job-name>` message, then `git push -u origin ci-fix/<original-branch>` (plain `git push` once upstream is set).
9. Verify: `gh run list --branch ci-fix/<original-branch> --limit 1` to get the new run ID, then `gh run watch <new-run-id> --exit-status`. Re-trigger only the failed jobs of that run with `gh run rerun <new-run-id> --failed` when the failure evidence is infrastructure or a confirmed flake and the user approves the rerun; never substitute a rerun for a deterministic fix.

## Failure and recovery
- Unauthenticated `gh`, or no failing run found for the supplied branch or run ID: stop and report; nothing is committed or pushed.
- Logs do not identify a root cause (insufficient logs, unreproducible secret or environment failure): report the evidence found, push nothing, and do not guess a fix.
- The smallest fix requires widening scope beyond the failing job/step or broadening workflow permissions: stop and report why; never expand permissions or add `pull_request_target` to make tests pass.
- The pushed run still fails: diagnose the new failure from its logs and apply one further in-scope fix. If it still fails with no new actionable cause, report blocked with the failing-run link, the analysis so far, and the exact failing job; the done predicate does not hold. Leave the branch and its runs in place as evidence: do not delete or force-push to hide the failure unless the user asks.
- Push or watch interrupted: the remote branch state is authoritative; re-run `gh run list --branch ci-fix/<original-branch> --limit 1` and resume watching. Never re-push blindly.

## Output
- On success: branch `ci-fix/<original-branch>` on the remote, a passing CI run, and a summary with four fields: failing run (link or ID), root cause, fix (what changed), verification (new run link showing green).
- Terminal classifications: `done` (run green and summary delivered), `blocked` (unauthenticated, no run found, no identifiable cause, or out-of-scope fix required, with the exact reason), or `non-passing` (run still red, with link and analysis). `done` is claimed only when the run is green.

## Provenance

- Origin: https://github.com/warpdotdev/oz-skills, `.agents/skills/ci-fix/SKILL.md`, pinned revision `6c08c49fc6c51b8f768bf8c53c041bc06a160765`.
- License: MIT, repository root `LICENSE` (Copyright 2026 Warp). Attribution to Warp is preserved; this adapted skill remains under MIT.
- Adaptation: rewritten as a self-contained ODIN odin-code skill. Preserved mechanisms: `gh` log triage, preference for the smallest deterministic fix over speculative or workflow-plumbing changes, failed-jobs-only reruns, and the dedicated `ci-fix/<original-branch>` push target.
