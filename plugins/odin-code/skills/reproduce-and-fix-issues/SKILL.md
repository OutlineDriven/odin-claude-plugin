---
name: reproduce-and-fix-issues
description: 'Use when a trusted bug or performance report needs reproduction and fix. Not for untrusted reports or scope beyond the named feature.'
disable-model-invocation: true
---

# Reproduce and fix issues

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Reproduce and fix a trusted bug or performance report. |
| Authority | Human-gated: asks before credentials, data-at-rest changes, paid actions, publishing, deployment, remote bulk mutation, or irreversible deletion (preview target and consequence); otherwise reversible local: writes only the fix and reproduction evidence; rollback is version control. No remote mutation except the human-approved draft PR. |
| Side effect | Drives the application under test, captures reproduction evidence, and may open one draft PR. No other remote operations. |
| Done | Verified operational-thread outcome with cleanup. |

## Refusals

- Untrusted reports: rejected. The report must name the affected feature, the environment, and the expected versus actual behavior.
- Scope beyond the named feature: rejected. Do not extend the fix to adjacent features or infrastructure without an explicit new report.
- **Assuming a race condition without at least two independent reproduction attempts**: rejected. Fail the reproduction step instead.

## Inputs

- Required: a trusted bug or performance report describing the symptom or regression. The report must name the affected feature, the environment or context, and the expected versus actual behavior.
- Optional: reproduction steps, a stack trace, a performance profile, or any supplemental diagnostic from the report.

## Procedure

1. Accept the trusted report. Confirm the affected feature, environment, and symptom are identifiable. Stop if the report does not name a feature or an observable failure mode. **Done when**: the feature, environment, and symptom are confirmed identifiable.
2. Drive the application in the environment described by the report. Reproduce the exact symptom before proceeding. **Done when**: the symptom is reproduced.
3. Capture reproduction evidence: console output, error messages, stack traces, timing data, or screenshots that record the failure. Fail the reproduction step if the symptom cannot be reproduced after at least two independent attempts; do not assume a race condition. **Done when**: evidence is captured or `no-repro` is returned.
4. Identify the root cause within the affected feature's code. Trace the failure to the first invariant violation or unexpected state. Do not widen scope beyond the named feature. **Done when**: the root cause is identified.
5. Implement the minimal fix that resolves the root cause. Validate that the fix does not introduce a new failure in the surrounding behavior. **Done when**: the fix is implemented and surrounding behavior is validated.
6. Verify the fix resolves the reproduction case: repeat the reproduction steps and confirm the symptom no longer occurs. **Done when**: the symptom no longer occurs on repetition.
7. Clean up any temporary artifacts created during reproduction or diagnosis. If the fix is verified and human approval is given, open one draft PR against the relevant branch. If approval is withheld, retain the verified fix locally and stop without publishing. **Done when**: cleanup is done and the PR is opened or the fix is retained locally.

## Failure and recovery

- **`no-repro`**: the symptom cannot be reproduced after at least two attempts. Stop. Return the evidence of the reproduction attempts and a blocked result.
- **`non-converged`**: the fix is implemented but the symptom persists after verification. Do not widen scope. Return the non-converged result with the last verified state.
- **`scope-widening-blocked`**: a root cause lies outside the named feature. Stop. Do not extend the fix without an explicit new report.
- Rollback: if the fix introduces a regression, revert to the last known-good state using version control. Do not commit the regression.
- Partial-result rule: if any step stops for a named failure class, return the result at that step with the evidence collected so far. Do not fabricate or assume subsequent steps succeeded.

## Output

A verified fix with captured evidence and cleanup, or a blocked/non-converged result with evidence at the stopping step, and if a draft PR is opened the PR URL and change summary.
