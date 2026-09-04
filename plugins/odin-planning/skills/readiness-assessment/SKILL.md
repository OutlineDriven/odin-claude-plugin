---
name: readiness-assessment
description: 'Use when a user asks for a gut-check on a decision or action, or asks whether enough is known to proceed. Not for numeric confidence scoring.'
---

# Readiness assessment

Assess whether enough is known to proceed on a decision or action.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks for a gut-check on a decision or action, or asks whether enough is known to proceed. |
| Authority | Reversible local on explicit request; otherwise read-only. A named local file is written only if the user explicitly requests one and the path does not already exist; an existing path is refused, not overwritten, and the user is asked for a different path. Rollback is deleting that file. No VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Normally none. If the user explicitly requests an output file, write only a named local artifact; otherwise produce no persistent state. |
| Done | A prose-only assessment names concrete knowns and unknowns, classifies each gap as Executable or Blocked, and returns one terminal recommendation: Proceed, Proceed with caveat, Pause, or Blocked. |

## Refusals

- Numeric confidence scores: rejected. The assessment is prose-only, never numeric.
- Fabricated confidence: rejected. Do not call a gap "likely" or "probably resolvable" to avoid a Pause or Blocked recommendation. If confidence is insufficient, say so.
- Scope widening: rejected. Do not assess dimensions outside the user's stated question.

## Inputs

- **User question or statement** (required): the natural-language question or observation that frames the decision, plan, or action to assess.
- Workspace context: read by the model to identify concrete knowns and unknowns. No credential, remote, or deployed resource access.

## Procedure

1. **Identify the decision/action, confirmed facts, and missing concrete dependencies.** Name the specific decision, plan, or action framed by the user's question. List concrete facts available in the current session: confirmed source evidence, direct tool outputs, and explicit user assertions. Do not infer facts or assume what is unstated. Name concrete gaps: missing credentials, absent files, unverified assumptions, required human input, or blocked tool access. Done when: the decision is named, each fact is listed with its evidence source, and each gap is named specifically.
2. **Classify each gap as Executable or Blocked.** Executable: resolvable by a concrete next step the user can perform immediately. Blocked: requires external dependency or capability not currently available. Done when: every gap has a classification.
3. **Emit prose evaluation of Knowns and Unknowns.** Produce a two-part prose assessment with no numeric score: Known (name each concrete fact that bears on the decision) and Unknown (name each gap specifically, do not generalize or hedge). Done when: both parts are written with no numeric score.
4. **Return terminal recommendation based on gaps.** State exactly one of:
   - Proceed: no gaps or only trivial gaps.
   - Proceed with caveat: gaps are Executable and the caveat is named as a fact.
   - Pause: at least one Executable gap is decisive and its resolution is named.
   - Blocked: at least one decisive gap is Blocked (missing capability or external dependency). Name the blocked dependency.
   Done when: one terminal recommendation is stated with its justification.

## Failure and recovery

- Missing actionable question: state what is needed to frame a specific decision or action and stop without producing an assessment.
- Inaccessible workspace: name exactly what is missing and stop; do not simulate presence of the data.
- Blocked gap: when the decisive unknown is a Blocked gap, return the Blocked recommendation naming the missing capability or external dependency. Do not downgrade to Pause.

## Output

A prose-only assessment with Known, Unknown, and Recommendation (Proceed, Proceed with caveat, Pause, or Blocked), ordered as listed. Written to a file only if the user explicitly requested one.
