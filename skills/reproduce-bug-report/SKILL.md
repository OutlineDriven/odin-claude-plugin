---
name: reproduce-bug-report
description: 'Use when a bug report or UI-visible defect exists, spawn repro agents to reproduce it locally and write an artifact directory containing a structured summary with status, steps, environment, evidence, and next step. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Reproduce bug report

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A UI-visible bug is worth reproducing (a bug report or observed defect exists). |
| Authority | Write only to a named local artifact directory. Roll back any state change that persists after the directory is closed. Do not mutate VCS-tracked files, remote resources, credentials, or data at rest. |
| Side effect | Spawns computer-use repro agents and writes an artifact directory under the named local directory. |
| Done | Structured summary returned with status, steps, environment, evidence, and next step. |

## Inputs

Required:
- Bug report text, error message, observed defect description, or pointer to the issue providing this information.

Optional:
- Environment context (OS, version, terminal, config): supply if available; omit if unknown.
- Reproduction constraints (time budget, retry limit, artifact directory path): use sensible defaults if not supplied.

## Procedure

1. Parse the bug report: extract the defect description, error message, UI symptoms, and any environment context.
2. Determine the reproduction target: a local environment matching the reported conditions, or a best-effort approximation.
3. Plan a minimal reproduction: one concrete action sequence that triggers the reported symptom. If no single trigger exists, plan the shortest failing sequence.
4. Open or confirm an artifact directory for this reproduction session. Name it to identify the bug and the session (e.g., `repro/<issue-id>/<timestamp>`).
5. Execute the minimal reproduction using a computer-use repro agent. Log every action taken and every observable result.
6. Capture evidence: terminal output, screenshots, logs, error traces, or any artifact produced by the repro attempt.
7. Compare the observed result against the expected result stated in the bug report.
8. Record the outcome: reproduced (exact match), partially reproduced (symptom class matches), or not reproduced (no matching symptom).
9. Write the structured summary artifact into the artifact directory:
   - **Status**: reproduced / partially reproduced / not reproduced.
   - **Steps**: numbered action sequence that triggers the symptom.
   - **Environment**: OS, version, terminal, and config used.
   - **Evidence**: file list or inline content from the repro run.
   - **Next step**: what a fixer agent needs to investigate or what was blocked.
10. Close the artifact directory. Roll back any state that persists beyond the directory (e.g., temp files, environment mutations).

## Failure and recovery
- **Cannot parse the bug report**: return `blocked: no valid bug description`. Do not infer or hallucinate a bug.
- **Reproduction environment unavailable**: return `blocked: environment unavailable` with the specific constraint that failed.
- **Reproduction times out**: return `blocked: repro timed out` with the last logged state and partial evidence if any exists.
- **Partial-result rule**: if evidence was captured before failure, write it to the artifact directory and return it with the blocked status rather than discarding it.
- **Non-converged**: if the repro produces conflicting evidence and cannot reach a verdict, return `non-converged` with the conflicting evidence listed.
- No rollback is needed if the only write is the artifact directory itself.

## Output
An artifact directory containing at minimum:
- A structured report (`repro-summary.md` or `repro-summary.json`) with fields: status, steps, environment, evidence, next_step.
- Any evidence files captured during the repro run.

The caller receives the path to this artifact directory.

## Provenance

Origin: warpdotdev/common-skills (`https://github.com/warpdotdev/common-skills`), revision `f589e224907eda566c13755529f59db563090d14`.
License: MIT — Copyright (c) 2026 Denver Technologies, Inc. Adaptation performed in ODIN style with attribution in the module provenance ledger. No copyleft obligations. The vendored JS bundle (`pierre-diffs.js`) was not carried over.
