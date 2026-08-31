---
name: readiness-assessment
description: 'Use when a user asks whether enough is known to proceed, or the model offers a gut-check before planning or execution. Produces a prose-only three-part assessment naming concrete knowns and unknowns with a recommendation to Proceed, Proceed with caveat, or Pause for a specific executable gap. Don''t use for tasks that require source or remote-system changes.'
---

# Knowledge confidence

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks whether enough is known to proceed, or the model offers a gut-check before planning or execution. |
| Authority | Read-only; no file, VCS, credential, paid, published, deployed, or remote mutation. May write a local assessment file if the user explicitly requests it. |
| Side effect | Normally none. If the user explicitly requests an output file, write only a named local artifact; otherwise produce no persistent state. |
| Done | A prose-only, never-numeric three-part check names concrete knowns and unknowns and recommends Proceed, Proceed with caveat, or Pause for a specific gap; gap actions are executable; interrupted work resumes exactly where it stopped. |

## Inputs

- **User question or statement**: Required. The natural-language question or observation that frames what needs to be assessed. Supplied by the user directly.
- **Workspace context**: Read by the model to identify concrete knowns. No credential, remote, or deployed resource access.
- **Output destination**: Optional. If the user requests a written assessment, name the target file before writing; otherwise produce no file.

## Procedure

1. Receive and parse the user's question or statement. Identify the specific decision, plan, or action under consideration.
2. Identify concrete facts available in the current session: confirmed source evidence, direct tool outputs, explicit user assertions. Do not infer from context or assume what is unstated.
3. Identify concrete gaps: missing credentials, absent files, unverified assumptions, required human input, or blocked tool access that the user has not supplied.
4. Classify each gap as:
   - **Executable**: the gap can be resolved by a concrete next step the user can perform immediately (e.g., provide a file, grant a permission, answer a question).
   - **Blocked**: resolving the gap requires external dependency or capability not currently available.
5. Produce a three-part prose assessment with no numeric score:
   - **Known**: name each concrete fact that directly bears on the decision.
   - **Unknown**: name each gap specifically; do not generalize or hedge.
   - **Recommended**: state exactly one of Proceed, Proceed with caveat (name the caveat), or Pause (name the executable gap and its resolution).
6. If the user has explicitly requested a written assessment, write only the three-part assessment to the named file. Do not append, log, or persist anything beyond what was requested.

## Failure and recovery
- **No actionable question**: If the user's statement does not frame a specific decision or action, state what is needed to frame one and stop without producing an assessment.
- **Inaccessible workspace**: If required context cannot be read due to permission or absence, name exactly what is missing and stop; do not simulate presence of the data.
- **No fabricated confidence**: Do not describe a gap as "likely" or "probably resolvable" to avoid a Pause recommendation. If confidence is insufficient, say Pause.
- **No scope widening**: Do not assess dimensions outside the user's stated question. Stop before adding unrelated observations.

## Output
A three-part prose assessment delivered in the current session:
- **Known**: bullet or sentence list of concrete facts currently in evidence.
- **Unknown**: bullet or sentence list of specific gaps named precisely.
- **Recommended**: exactly one of:
  - **Proceed** — all required information is in evidence.
  - **Proceed with caveat** — followed by the specific caveat; the caveat must be named as a fact, not a speculation.
  - **Pause** — followed by the specific executable gap and the concrete action that would resolve it.

If the user requested a file, write only the assessment text to the named path. Otherwise, output only the prose assessment.

## Provenance

**Origin**: compound-knowledge-plugin by EveryInc.
**Source**: `plugins/compound-knowledge/skills/kw-confidence/SKILL.md`, revision `766942e9eaee5204adbfe180f1d0651ffecf2575`.
**License**: MIT — Copyright (c) 2026 Every, Inc. Adaptation permitted per root provenance ledger mechanism rewrite record.
**Adaptation**: Epistemic gut-check mechanism preserved. Authority scoped to read-only with explicit user-requested file write only. Module set to odin-research. Trigger and three-part assessment structure retained; no inference, scope-widening, or numeric scoring added.
