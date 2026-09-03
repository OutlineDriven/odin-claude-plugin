---
name: classify-ci-failure
description: 'Use when a CI check is failed, absent, pending too long, unstable, or reported unexpectedly. Classify it into a deterministic failure class with the next owner, then emit a reviewable fix plan, without patching. Not for sweeping and patching — use ci-sweeper.'
---

# Classify CI failure

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A CI check is failed, absent, pending too long, unstable, or reported unexpectedly. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. No patching during classification. |
| Side effect | Chat output: one deterministic failure class, the next owner, and a reviewable fix plan. |
| Done | The class is supported by observed evidence, nothing was mutated, the next action is explicit, no-CI and blocked states are surfaced rather than skipped, and the fix plan is emitted when a PR and logs are available. |

## Inputs

Required: the CI check name, its status (failed, absent, pending, unstable, or unexpected), and the run identifier or URL that produced the report.

Optional: the failing job log, the changed files or commit range under test, any prior classification of the same check, the current git branch with an open PR, and an authenticated GitHub CLI (`gh`) for log extraction. The fix plan is produced when a PR and `gh` are available; without them, classification stands alone.

## Procedure

1. Record the check name, status, and run identifier before reading anything else. If the status is absent or the check never ran, treat that as a distinct input, not a missing one. **Done when:** the check name, status, and run identifier are recorded.
2. Read the failing job log and any error, exit code, or annotation the run produced. Preserve the exact failure line, signal, or message. **Done when:** the failure signal is read and preserved exactly.
3. Compare the failure against the commit range and changed files under test. Determine whether the failing code path was touched by the change or predates it. **Done when:** the failing path is determined as in-diff or pre-existing.
4. Classify the failure into exactly one class:
   - regression: the change introduced or exposed the failure; the failing path is in the diff.
   - flake/watch: the failure is timing-, order-, or environment-dependent; it passes on retry or across runs without a code change.
   - infrastructure: the failure is caused by the runner, network, quota, service outage, or resource exhaustion, not by the code under test.
   - configuration: the failure stems from build, config, dependency, or environment setup, not from product logic.
   - policy/absent-CI: the check is absent, skipped, not configured, or blocked by a branch-protection or policy rule.
   - human escalation: the evidence is insufficient, contradictory, or outside the five classes above; a human must decide.
   **Done when:** the failure is classified into exactly one class.
5. Assign the next owner from the class: regression and configuration go to the change author; flake/watch goes to the test or platform owner; infrastructure goes to the platform or runner owner; policy/absent-CI goes to the repository or CI-config owner; human escalation goes to a human reviewer. **Done when:** the next owner is assigned from the class.
6. State the next action the owner must take, concretely and in one sentence. **Done when:** the next action is stated in one sentence.
7. If the same check was classified before and the new evidence matches the prior class, note the repeat; if it contradicts, re-classify from the new evidence. **Done when:** the repeat or contradiction is noted, or no prior classification exists.
8. Emit a reviewable fix plan as the post-classification artifact. When a PR and an authenticated `gh` are available, gather the evidence first: set `GH_PAGER=cat` on every `gh` invocation (the GitHub CLI has no global `--no-pager` option and blocks on a pager in non-interactive contexts without it); view the PR with `GH_PAGER=cat gh pr view <branch> --json number,title,url,state`; fetch the check rollup with `GH_PAGER=cat gh pr view <branch> --json statusCheckRollup`; and extract each failed check's logs with `GH_PAGER=cat gh run view <run-id> --log-failed`, collecting error messages with file paths and line numbers, compilation errors, lint names, test failure messages and stack traces, and build root causes. If any check is still in progress, report the partial state and stop; do not diagnose incomplete checks. Before flagging a test failure as a regression, check whether the same test previously passed in CI and note environment-specific or flaky cases rather than treating them as CI regressions. Then write the fix plan with: a problem statement summarizing the failing checks, current state listing each error and its location, proposed changes grouped by error category (formatting, linting, compilation, test failures, platform-specific), and validation steps (fmt, lint, tests, presubmit). Fix one category at a time. Apply no code change. **Done when:** the fix plan carries the problem statement, current state, per-category proposed changes, and validation steps, with no code change applied, or the plan is skipped because no PR or `gh` is available.

## Failure and recovery
- Insufficient evidence: the log, status, or run identifier is missing or unreadable. Do not guess a class. Return `human escalation` with the missing evidence named.
- Contradictory evidence: two signals imply different classes. Return `human escalation` with both signals stated; do not average or pick arbitrarily.
- No-CI state: the check is absent or never ran. Classify as `policy/absent-CI`; do not skip it or treat it as passing.
- Blocked state: the check is pending past the expected window or blocked by policy. Surface the blocked state and the next owner; do not mark it done.
- Non-mutation rule: classification mutates nothing. If any step would require a write, stop and return `human escalation`.
- Partial result: if only some checks in a run are inspectable, classify each inspectable one and explicitly mark the rest as unevaluated.
- No PR for the current branch: classification stands alone; skip the fix plan and report that no PR exists. Do not create a PR.
- GitHub CLI not authenticated or unavailable: classification stands alone; skip the fix plan and report the missing prerequisite. Do not attempt credential setup.
- `gh run view --log-failed` returns empty or errors: report which run could not be read, continue triaging the remaining failed checks, and mark the unread run as untriaged in the plan.
- CI still running: report the partial state and stop. Do not diagnose incomplete checks.

## Output
One chat record containing the check name, the run identifier, the observed failure signal, the single deterministic class, the next owner, and the one-sentence next action; no-CI and blocked states are included as their own classes, not omitted. When a PR and `gh` are available, a reviewable fix plan follows: the failing checks, categorized errors with locations, proposed fixes per category, and validation steps, with untriaged checks explicitly marked and no code changes applied.
