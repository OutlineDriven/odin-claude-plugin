---
name: reproduce-and-fix-issues
description: 'Reproduce a trusted bug, fix it, open a draft PR'
disable-model-invocation: true
---

# Reproduce and fix issues

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Reproduce and fix a trusted Benny bug or performance report. |
| Authority | Human-only for external or irreversible actions. Preview the target and consequence before credentials, data-at-rest changes, paid actions, publishing, deployment, remote bulk mutation, or irreversible deletion. |
| Side effect | Drives the application under test, captures reproduction evidence, and may open one draft PR. No other remote operations. |
| Done | Verified operational-thread outcome with cleanup. |

## Inputs

- **Required**: a trusted bug or performance report describing the symptom or regression. The report must name the affected feature, the environment or context, and the expected versus actual behavior.
- **Optional**: reproduction steps, a stack trace, a performance profile, or any supplemental diagnostic from the report.

## Procedure

1. Accept the trusted report. Confirm the affected feature, environment, and symptom are identifiable. Stop if the report does not name a feature or an observable failure mode.
2. Drive the application in the environment described by the report. Reproduce the exact symptom before proceeding.
3. Capture reproduction evidence: console output, error messages, stack traces, timing data, or screenshots that record the failure. Fail the reproduction step if the symptom cannot be reproduced; do not assume a race condition without at least two independent reproduction attempts.
4. Identify the root cause within the affected feature's code. Trace the failure to the first invariant violation or unexpected state. Do not widen scope beyond the named feature.
5. Implement the minimal fix that resolves the root cause. Validate that the fix does not introduce a new failure in the surrounding behavior.
6. Verify the fix resolves the reproduction case: repeat the reproduction steps and confirm the symptom no longer occurs.
7. Clean up any temporary artifacts created during reproduction or diagnosis. If the fix is verified and human approval is given, open one draft PR against the relevant branch. If approval is withheld, retain the verified fix locally and stop without publishing.

## Failure and recovery
- **no-repro**: The symptom cannot be reproduced after at least two attempts. Stop. Return the evidence of the reproduction attempts and a blocked result.
- **non-converged**: The fix is implemented but the symptom persists after verification. Do not widen scope. Return the non-converged result with the last verified state.
- **scope-widening-blocked**: A root cause lies outside the named feature. Stop. Do not extend the fix to adjacent features or infrastructure without an explicit new report.
- **rollback**: If the fix introduces a regression, revert to the last known-good state using version control. Do not commit the regression.
- **Partial-result rule**: If any step stops for a named failure class, return the result at that step with the evidence collected so far. Do not fabricate or assume subsequent steps succeeded.

## Output
A verified fix with captured evidence and cleanup, or a blocked/non-converged result with the evidence gathered at the stopping step. If a draft PR is opened, the output includes the PR URL and a summary of the change.

## Provenance

Origin: pstack/automations/benny/skills/reproduce-and-fix-issues (MIT, Lauren Tan / poteto).
Pinned revision: 68836ddaf5697224520f1847d90cdb90ca8babaa.
License: MIT.
Adaptation: Clean-room reimplementation of the Benny reproduce-and-fix workflow adapted for ODIN 2.0 authority model. MIT license evidence: pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25 (1067 bytes).
