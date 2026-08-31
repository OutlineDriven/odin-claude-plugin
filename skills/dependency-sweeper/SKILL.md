---
name: dependency-sweeper
description: 'Use when dependencies need cadence-driven or vulnerability-triggered audit and updates. Classifies each update on a risk ladder, verifies it, or defers it with a reason. Not for tiered batch upgrades — use deps-upgrade; not for PR queue triage — use github-backlog-triage.'
---

# Dependency sweeper

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Dependencies must be audited and updated on a cadence or in response to a vulnerability report |
| Authority | Reversible-local: write only the manifest, lockfile, and sweep report in the working tree; recover via version control |
| Side effect | Proposes or applies bounded dependency updates with tests on a declared patch-to-major risk ladder under the change gate; no major bump without explicit approval |
| Done | Each update is classified on the risk ladder and verified, or deferred with a recorded reason |

## Inputs

The inputs are the project dependency manifest and lockfile in the working tree. Both must be VCS-tracked. A vulnerability report or advisory feed naming affected dependencies and a cadence schedule are optional. A major bump requires explicit human approval supplied at runtime.

## Procedure

1. Identify the trigger: a scheduled cadence tick or a vulnerability report naming one or more dependencies. Done when: the trigger and named dependencies are recorded.
2. Confirm the manifest and lockfile exist and are VCS-tracked; stop if not, so every change is recoverable. Done when: both files are confirmed recoverable or the run stops.
3. Enumerate the dependency set from the manifest and lockfile. Done when: the complete dependency set is recorded.
4. For each dependency, query available versions and any advisories, then classify the update on the risk ladder: patch, minor, or major. Done when: every candidate has a version, advisory state, and risk class.
5. Apply patch and minor updates as bounded changes to the manifest and lockfile and run the project test suite to verify each. Done when: each applied patch or minor update passes the project tests.
6. For any major update, stop and request explicit human approval before applying; do not apply an unapproved major. Done when: the major is approved and applied or deferred unmodified.
7. Record each update's classification, verification result, or deferral reason in the sweep report. Done when: every update has one disposition.
8. If a check fails, revert the offending update via version control and record the failure. Done when: the failed update is reverted and its failure recorded.

## Failure and recovery
- Check failure after an update: revert that update via version control, mark it failed, and continue with the remaining updates.
- Major bump without explicit approval: do not apply; defer it with a recorded reason.
- Unavailable checks (test suite cannot run): defer every unverified update as non-converged with a recorded reason; do not claim the done predicate holds.
- Partial result: applied and verified updates stand; failed and deferred updates are recorded. Never swallow an error or pretend verification succeeded.

## Output
A dependency sweep report listing each dependency, its risk-ladder classification, applied-or-deferred status, verification result, and deferral reason. The working tree contains only verified updates; deferred majors are not applied.
