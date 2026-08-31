---
name: fix-ci
description: 'Use when a PR or branch has failing CI checks. Not for GitHub PR-specific CI repair with remote push — use gh-fix-ci; not for local test failures without CI or feature implementation.'
disable-model-invocation: true
---

# Fix CI

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A PR or branch has failing CI checks. |
| Authority | Human-only. Pushes fixes to the remote PR or branch, which is an irreversible external mutation; every push requires human approval. |
| Side effect | Pushes minimal fixes to the PR or branch remote. Scope is limited to changes that resolve a failing check's root cause. |
| Done | Every CI check in the target set is green and an ordered root-cause record exists for each root cause addressed. |

## Inputs

- The target PR number or branch name with failing CI. Required.
- The failing check names and their logs. Required; pull them from the PR check status if not supplied.
- Repository access sufficient to read source, run the local equivalent of each CI check, commit, and push. Required.

## Procedure

1. Identify the target PR or branch. Pull the current check status and the full list of failing checks with their logs. Done when: every failing check is named with its log.
2. Triage every failing check: classify each as a root cause or a downstream symptom of another failure. A single root cause may surface as several failing checks. Order the work so root causes are fixed before the symptoms they produce. Done when: every failing check is classified as root cause or symptom, and the work is ordered.
3. For each root-cause failure, read the failure log and the relevant source to determine the minimal change that resolves the cause. Do not widen scope beyond that cause. Done when: the minimal fix for each root cause is determined from the log and source.
4. Apply the minimal fix. Run the local equivalent of the failing CI check to confirm the fix before any push. Done when: the local check passes for the fix.
5. Commit the fix with a message naming the root cause and the check it repairs. Done when: the fix is committed with a root-cause-naming message.
6. Push the fix to the PR or branch remote. This is an irreversible remote mutation; push only after the local check passes and only for a change tied to a failing check. Done when: the fix is pushed to the remote.
7. Observe the re-run CI checks. If new failures appear, repeat from step 2 treating the new failures as the current set. Stop only when every check in the set is green. Done when: every check in the target set is green, or new failures restart the loop from step 2.
8. Produce the ordered root-cause record: for each root cause, the check name, the root cause, the minimal fix applied, and the commit SHA. Done when: the root-cause record is produced with all four fields per root cause.

## Failure and recovery
- Local check does not reproduce the CI failure: do not push. Report the reproduction gap and attach the CI log as the blocked state.
- A fix resolves one check but breaks another: if not yet pushed, amend or discard the fix; if pushed, revert it. Re-triage treating the new break as a root cause.
- Push rejected (protected branch, conflict, permission): do not force-push. Report the rejection reason as the blocked state.
- Non-convergent: after repeated fix cycles, new failures keep appearing in the fix's own code. Stop. Report the non-convergent state with the failure chain; do not claim green or that the done predicate holds.

## Output
- Green CI on the target PR or branch.
- An ordered root-cause record: per root cause, the check name, the root cause, the minimal fix, and the commit SHA.

## Provenance

- Origin: cursor/plugins, file cursor-team-kit/skills/fix-ci/SKILL.md.
- Pinned revision: 68836ddaf5697224520f1847d90cdb90ca8babaa.
- License: MIT, declared by the cursor/plugins root README and the candidate plugin manifest per the pinned source audit.
- Adaptation: clean-room adaptation to the ODIN 2.0 contract format. The source mechanism is preserved — CI repair driven by PR checks with remote pushes under human-only authority — without copying third-party expression.
