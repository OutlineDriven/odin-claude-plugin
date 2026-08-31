---
name: classify-ci-failure
description: 'Use when a CI check is failed, absent, pending too long, unstable, or reported unexpectedly. Classify it into a deterministic failure class with the next owner, without patching during classification. Don''t use for tasks that require source or remote-system changes.'
---

# Classify CI failure

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A CI check is failed, absent, pending too long, unstable, or reported unexpectedly. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. No patching during classification. |
| Side effect | Chat output: one deterministic failure class and the next owner. |
| Done | The class is supported by observed evidence, nothing was mutated, the next action is explicit, and no-CI and blocked states are surfaced rather than skipped. |

## Inputs

Required: the CI check name, its status (failed, absent, pending, unstable, or unexpected), and the run identifier or URL that produced the report.

Optional: the failing job log, the changed files or commit range under test, and any prior classification of the same check.

## Procedure

1. Record the check name, status, and run identifier before reading anything else. If the status is absent or the check never ran, treat that as a distinct input, not a missing one.
2. Read the failing job log and any error, exit code, or annotation the run produced. Capture the exact failure line, signal, or message; do not paraphrase it away.
3. Compare the failure against the commit range and changed files under test. Determine whether the failing code path was touched by the change or predates it.
4. Classify the failure into exactly one class:
   - **regression**: the change introduced or exposed the failure; the failing path is in the diff.
   - **flake/watch**: the failure is timing-, order-, or environment-dependent; it passes on retry or across runs without a code change.
   - **infrastructure**: the failure is caused by the runner, network, quota, service outage, or resource exhaustion, not by the code under test.
   - **configuration**: the failure stems from build, config, dependency, or environment setup, not from product logic.
   - **policy/absent-CI**: the check is absent, skipped, not configured, or blocked by a branch-protection or policy rule.
   - **human escalation**: the evidence is insufficient, contradictory, or outside the five classes above; a human must decide.
5. Assign the next owner from the class: regression and configuration go to the change author; flake/watch goes to the test or platform owner; infrastructure goes to the platform or runner owner; policy/absent-CI goes to the repository or CI-config owner; human escalation goes to a human reviewer.
6. State the next action the owner must take, concretely and in one sentence.
7. If the same check was classified before and the new evidence matches the prior class, note the repeat; if it contradicts, re-classify from the new evidence.

## Failure and recovery
- **Insufficient evidence**: the log, status, or run identifier is missing or unreadable. Do not guess a class. Return `human escalation` with the missing evidence named.
- **Contradictory evidence**: two signals imply different classes. Return `human escalation` with both signals stated; do not average or pick arbitrarily.
- **No-CI state**: the check is absent or never ran. Classify as `policy/absent-CI`; do not skip it or treat it as passing.
- **Blocked state**: the check is pending past the expected window or blocked by policy. Surface the blocked state and the next owner; do not mark it done.
- **Non-mutation rule**: classification mutates nothing. If any step would require a write, stop and return `human escalation`.
- **Partial result**: if only some checks in a run are inspectable, classify each inspectable one and explicitly mark the rest as unevaluated.

## Output
One chat record containing: the check name, the run identifier, the observed failure signal, the single deterministic class, the next owner, and the one-sentence next action. No-CI and blocked states are included as their own classes, not omitted.

## Provenance

Origin: cobusgreyling/loop-engineering (patterns/ci-sweeper.md, scripts/github-triage.mjs, docs/failure-modes.md, stories/ci-sweeper-infinite-flaky-test.md). Revision d03dcb92cc1e0efb59789a2557131c6ad5897ccc. License MIT. Clean-room adaptation: the deterministic-class taxonomy and read-only no-patch-during-classification contract are adapted from the source; no source expression is copied.
