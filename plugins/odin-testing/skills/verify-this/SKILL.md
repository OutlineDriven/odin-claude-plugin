---
name: verify-this
description: 'Use when a measurable claim needs before/after proof. Runs controlled baseline and treatment probes, then returns VERIFIED, NOT VERIFIED, or INCONCLUSIVE with deltas. Not for fact-checking or done-claim gating — use verify-both-ways or verification-before-completion.'
---

# Verify this

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to test a measurable claim with before/after proof. |
| Authority | Write only named local evidence artifacts; state the rollback path before writing. No VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Runs probes and saves temporary evidence files locally. |
| Done | VERIFIED, NOT VERIFIED, or INCONCLUSIVE classification with measured deltas between baseline and treatment. |

## Inputs

- Claim (required): A specific, measurable assertion to test. Must be restatable as a falsifiable hypothesis with a pass/fail threshold.
- Target (required): The file, command, function, URL, or system under test.
- Baseline definition (optional): What constitutes the control state. If omitted, derive from the claim's negation or the current default state.
- Evidence directory (optional): Where to save probe artifacts. Defaults to a temporary directory.

## Procedure

1. **Restate the claim.** Convert the user's assertion into a falsifiable hypothesis: "When X is applied, Y metric changes by Z threshold compared to baseline." If the claim cannot be restated as measurable, stop and report the ambiguity. **Done when:** the claim is restated as a falsifiable hypothesis with a pass/fail threshold.
2. **Define baseline.** Establish the control state: the system without the claimed change. Record the baseline measurement or state. **Done when:** the baseline state is recorded.
3. **Define treatment.** Establish the test state: the system with the claimed change applied. If applying the change requires mutation beyond the declared authority, stop and report the boundary. **Done when:** the treatment state is defined and within authority.
4. **Run baseline probe.** Execute the measurement against the control state. Capture the raw result as a named evidence artifact. **Done when:** the baseline probe result is captured.
5. **Run treatment probe.** Execute the same measurement against the test state. Capture the raw result as a named evidence artifact. **Done when:** the treatment probe result is captured.
6. **Compute delta.** Calculate the difference between baseline and treatment. Compare against the threshold from step 1. **Done when:** the delta is computed and compared to the threshold.
7. **Classify.** Apply the decision rule: VERIFIED if the delta meets or exceeds the threshold in the expected direction; NOT VERIFIED if the delta is absent, below threshold, or opposite; INCONCLUSIVE if the measurement was blocked, indeterminate, or confounded. **Done when:** one classification is assigned.
8. **Report.** Return the classification, the measured deltas, the evidence file paths, and the rollback path for any local artifacts written. **Done when:** the report contains classification, deltas, evidence paths, and rollback path.

## Failure and recovery
- Unmeasurable claim: Stop at step 1. Return the restated claim and explain what measurement is missing. Do not proceed to probes.
- Probe failure: If a baseline or treatment probe errors, classify as INCONCLUSIVE. Report the error output. Do not widen scope or invent alternative evidence.
- Authority boundary: If the treatment requires mutation beyond local writes, stop. Report what mutation is needed and why it exceeds the declared authority.
- Confounding factors: If the probe environment is contaminated or the baseline cannot be isolated, classify as INCONCLUSIVE. Report the confound.
- Partial results: If baseline succeeds but treatment fails, report the baseline measurement and classify as INCONCLUSIVE. Do not discard the baseline evidence.
- Rollback: All written evidence artifacts are temporary. State their paths so the caller can delete them. No VCS, credential, published, deployed, or remote state is touched.

## Output
A terminal classification (VERIFIED, NOT VERIFIED, or INCONCLUSIVE) with the hypothesis, baseline and treatment measurements, computed delta, evidence paths, and rollback path.
