---
name: reproduce-bug-report
description: 'Use when a bug report or UI-visible defect exists. Spawns repro agents to reproduce it locally and writes an artifact directory containing a structured summary with status, steps, environment, evidence, and next step. Not for fixing the bug — use reproduce-and-fix-issues.'
---

# Reproduce bug report

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A UI-visible bug is worth reproducing (a bug report or observed defect exists). |
| Authority | Write only to a named local artifact directory. Roll back any state change that persists after the directory is closed. Do not mutate VCS-tracked files, remote resources, credentials, or data at rest. |
| Side effect | Spawns computer-use repro agents and writes an artifact directory under the named local directory. |
| Done | Structured summary returned with status, steps, environment, evidence, and next step. |

## Refusals

- Fixing the bug: use `reproduce-and-fix-issues`. This skill reproduces and captures evidence only.
- Inferring or hallucinating a bug: rejected. If the report cannot be parsed, return `blocked: no valid bug description`.
- **Mutating VCS-tracked files, remote resources, credentials, or data at rest**: rejected.

## Inputs

Required:
- Bug report text, error message, observed defect description, or pointer to the issue providing this information.

Optional:
- Environment context (OS, version, terminal, config): supply if available; omit if unknown.
- Reproduction constraints (time budget, retry limit, artifact directory path): use sensible defaults if not supplied.

## Procedure

1. Parse the bug report: extract the defect description, error message, UI symptoms, and any environment context. **Done when**: the defect description, symptoms, and environment context are extracted or `blocked: no valid bug description` is returned.
2. Determine the reproduction target: a local environment matching the reported conditions, or a best-effort approximation. **Done when**: the reproduction target is determined.
3. Plan a minimal reproduction: one concrete action sequence that triggers the reported symptom. If no single trigger exists, plan the shortest failing sequence. **Done when**: a minimal reproduction plan is written.
4. Open or confirm an artifact directory for this reproduction session. Name it to identify the bug and the session (e.g., `repro/<issue-id>/<timestamp>`). **Done when**: the artifact directory is opened.
5. Execute the minimal reproduction using a computer-use repro agent. Log every action taken and every observable result. **Done when**: the reproduction is executed with full logging.
6. Capture evidence: terminal output, screenshots, logs, error traces, or any artifact produced by the repro attempt. **Done when**: evidence is captured.
7. Compare the observed result against the expected result stated in the bug report. **Done when**: the comparison is made.
8. Record the outcome: reproduced (exact match), partially reproduced (symptom class matches), or not reproduced (no matching symptom). **Done when**: the outcome is classified.
9. Write the structured summary artifact into the artifact directory with Status, Steps, Environment, Evidence, and Next step. **Done when**: the structured summary is written.
10. Close the artifact directory. Roll back any state that persists beyond the directory (e.g., temp files, environment mutations). **Done when**: the directory is closed and non-directory state is rolled back.

## Failure and recovery

- Cannot parse the bug report: return `blocked: no valid bug description`. Do not infer or hallucinate a bug.
- Reproduction environment unavailable: return `blocked: environment unavailable` with the specific constraint that failed.
- Reproduction times out: return `blocked: repro timed out` with the last logged state and partial evidence if any exists.
- Partial-result rule: if evidence was captured before failure, write it to the artifact directory and return it with the blocked status rather than discarding it.
- Non-converged: if the repro produces conflicting evidence and cannot reach a verdict, return `non-converged` with the conflicting evidence listed.

No rollback is needed if the only write is the artifact directory itself.

## Output

An artifact directory containing a structured report (`repro-summary.md` or `repro-summary.json`) with fields status, steps, environment, evidence, next_step, plus any evidence files captured during the repro run, with the directory path returned to the caller.
