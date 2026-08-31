---
name: verify-this
description: 'Use when the user asks to test a measurable claim with before/after proof. Restate the claim as a falsifiable hypothesis, run controlled baseline and treatment probes, and return VERIFIED, NOT VERIFIED, or INCONCLUSIVE with measured deltas. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

- **Claim** (required): A specific, measurable assertion to test. Must be restatable as a falsifiable hypothesis with a pass/fail threshold.
- **Target** (required): The file, command, function, URL, or system under test.
- **Baseline definition** (optional): What constitutes the control state. If omitted, derive from the claim's negation or the current default state.
- **Evidence directory** (optional): Where to save probe artifacts. Defaults to a temporary directory.

## Procedure

1. **Restate the claim.** Convert the user's assertion into a falsifiable hypothesis: "When X is applied, Y metric changes by Z threshold compared to baseline." If the claim cannot be restated as measurable, stop and report the ambiguity.
2. **Define baseline.** Establish the control state: the system without the claimed change. Record the baseline measurement or state.
3. **Define treatment.** Establish the test state: the system with the claimed change applied. If applying the change requires mutation beyond the declared authority, stop and report the boundary.
4. **Run baseline probe.** Execute the measurement against the control state. Capture the raw result as a named evidence artifact.
5. **Run treatment probe.** Execute the same measurement against the test state. Capture the raw result as a named evidence artifact.
6. **Compute delta.** Calculate the difference between baseline and treatment. Compare against the threshold from step 1.
7. **Classify.** Apply the decision rule:
   - **VERIFIED**: The delta meets or exceeds the threshold in the expected direction.
   - **NOT VERIFIED**: The delta is absent, below threshold, or in the opposite direction.
   - **INCONCLUSIVE**: The measurement was blocked, the probe produced indeterminate output, or confounding factors prevent a clean comparison.
8. **Report.** Return the classification, the measured deltas, the evidence file paths, and the rollback path for any local artifacts written.

## Failure and recovery
- **Unmeasurable claim**: Stop at step 1. Return the restated claim and explain what measurement is missing. Do not proceed to probes.
- **Probe failure**: If a baseline or treatment probe errors, classify as INCONCLUSIVE. Report the error output. Do not widen scope or invent alternative evidence.
- **Authority boundary**: If the treatment requires mutation beyond local writes, stop. Report what mutation is needed and why it exceeds the declared authority.
- **Confounding factors**: If the probe environment is contaminated or the baseline cannot be isolated, classify as INCONCLUSIVE. Report the confound.
- **Partial results**: If baseline succeeds but treatment fails, report the baseline measurement and classify as INCONCLUSIVE. Do not discard the baseline evidence.
- **Rollback**: All written evidence artifacts are temporary. State their paths so the caller can delete them. No VCS, credential, published, deployed, or remote state is touched.

## Output
A terminal classification report containing:
1. **Classification**: One of VERIFIED, NOT VERIFIED, INCONCLUSIVE.
2. **Hypothesis**: The falsifiable restatement from step 1.
3. **Baseline measurement**: The raw control-state result.
4. **Treatment measurement**: The raw test-state result.
5. **Delta**: The computed difference and whether it meets the threshold.
6. **Evidence paths**: Filesystem paths to saved probe artifacts.
7. **Rollback path**: How to remove written artifacts.

## Provenance

Adapted from cursor/plugins `cursor-team-kit/skills/verify-this/SKILL.md` at revision `68836ddaf5697224520f1847d90cdb90ca8babaa`. License: MIT, declared by the cursor/plugins root README and the candidate plugin manifest. This is a clean-room adaptation preserving the controlled baseline/treatment verification mechanism. The root `PROVENANCE.md` contains the complete repository and license notices.
