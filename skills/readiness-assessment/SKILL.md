---
name: readiness-assessment
description: 'Use when a user asks whether enough is known to proceed, or before planning or execution needs a gut-check. Produces a prose-only assessment with concrete knowns, unknowns, and one verdict: Proceed, Proceed with caveat, or Pause. Not for numeric confidence scoring.'
---

# Knowledge confidence

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks whether enough is known to proceed, or the model offers a gut-check before planning or execution. |
| Authority | Read-only; no file, VCS, credential, paid, published, deployed, or remote mutation. May write a local assessment file if the user explicitly requests it. |
| Side effect | Normally none. If the user explicitly requests an output file, write only a named local artifact; otherwise produce no persistent state. |
| Done | A prose-only, never-numeric three-part check names concrete knowns and unknowns and recommends Proceed, Proceed with caveat, or Pause for a specific gap; gap actions are executable; interrupted work resumes exactly where it stopped. |

## Refusals

- **Numeric confidence scores**: rejected. The assessment is prose-only, never numeric.
- **Fabricated confidence**: rejected. Do not call a gap "likely" or "probably resolvable" to avoid a Pause recommendation. If confidence is insufficient, say Pause.
- **Scope widening**: rejected. Do not assess dimensions outside the user's stated question.

## Inputs

- **User question or statement**: Required. The natural-language question or observation that frames the decision, plan, or action to assess. Supplied directly by the user.
- **Workspace context**: Read by the model to identify concrete knowns. No credential, remote, or deployed resource access.
- **Output destination**: Optional. If the user requests a written assessment, name the target file before writing; otherwise produce no file.

## Procedure

1. Identify the specific decision, plan, or action framed by the user's question or statement. **Done when**: the decision or action is named.
2. Identify concrete facts available in the current session: confirmed source evidence, direct tool outputs, and explicit user assertions. Do not infer facts or assume what is unstated. **Done when**: each fact is listed with its evidence source.
3. Identify concrete gaps: missing credentials, absent files, unverified assumptions, required human input, or blocked tool access that the user has not supplied. **Done when**: each gap is named specifically.
4. Classify each gap as **Executable** (resolvable by a concrete next step the user can perform immediately) or **Blocked** (requires external dependency or capability not currently available). **Done when**: every gap has a classification.
5. Produce a three-part prose assessment with no numeric score: **Known** (name each concrete fact that bears on the decision), **Unknown** (name each gap specifically, do not generalize or hedge), **Recommended** (state exactly one of Proceed, Proceed with caveat (name the caveat as a fact), or Pause (name the executable gap and its resolution)). **Done when**: all three parts are written with no numeric score.
6. If the user has explicitly requested a written assessment, write only the three-part assessment to the named file. Do not append, log, or persist anything beyond what was requested. **Done when**: the file is written or no file was requested.

## Failure and recovery

- **No actionable question**: state what is needed to frame a specific decision or action and stop without producing an assessment.
- **Inaccessible workspace**: name exactly what is missing and stop; do not simulate presence of the data.

## Output

A three-part prose assessment with Known, Unknown, and Recommended (Proceed, Proceed with caveat, or Pause), ordered as listed, written to a file only if the user explicitly requested one.
