---
name: technical-writing
description: 'Use when asked to write or review technical prose. Produce unambiguous task-fit prose using real symbols and controlled-English structure. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Technical writing

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Write or review technical prose. |
| Authority | Reversible-local: edit named prose files; rollback via version control. |
| Side effect | Edits prose. |
| Done | Unambiguous task-fit prose using real symbols. |

## Inputs

- **Draft or existing document** (required): the prose to write or review.
- **Task context** (required): what the prose must accomplish, its audience, and its document type.
- **Style guide or audience definition** (optional): project-specific conventions, terminology, or tone constraints.

## Procedure

1. **Classify.** Identify the document type per Diataxis: explanation (conceptual understanding), how-to (goal-oriented task), reference (information lookup), or tutorial (learning-oriented). Name the target audience and their prior knowledge.
2. **Validate inputs.** Confirm the draft or source material is accessible. If no draft exists, scaffold from the document type: numbered steps for procedures, tables for references, definitions-first for explanations.
3. **Edit for controlled English.** Apply each of the following, stopping when no further improvement changes meaning:
   - Replace vague nouns with concrete names (real files, commands, APIs, paths).
   - Replace weak verbs with precise actions ("configure" not "set up", "verify" not "check").
   - Eliminate passive voice unless the agent performing the action is genuinely unknown.
   - Replace all placeholders, examples-as-templates, and invented symbols with real values from the task context.
   - Ensure every sentence carries information a prior sentence does not already establish.
4. **Enforce single-purpose sections.** Each section serves exactly one Diataxis type. If a section mixes explanation and procedure, split it. If a reference section contains narrative, extract the narrative.
5. **Validate structure.** Confirm: headings are parallel in form, lists are consistently punctuated, tables have no empty cells that should hold data, and code blocks specify a language.
6. **Stop.** The prose is unambiguous and task-fit. Do not polish beyond clarity.

## Failure and recovery
- **Missing draft**: request the source document or explicit scaffold instructions; do not invent content.
- **Unclear task scope**: ask for clarification on audience, document type, or success criteria; do not guess.
- **Placeholder or invented symbol detected**: replace with the real value from context; if no real value exists, flag the gap explicitly rather than leaving the placeholder.
- **License boundary**: refuse to copy third-party expression; produce clean-room adaptation only.
- **Partial result**: if the edit pass completes but ambiguity remains in sections where the task context is insufficient, report the partial result with the specific gaps named. Never mark done when prose contains unresolved placeholders or ambiguous references.
- **Rollback**: revert the edited file to its prior version via version control. No partial rollback: either the full edit stands or the full prior version is restored.

## Output
- Edited prose artifact written to the target file.
- Change summary: what was modified and which controlled-English rule applied.
- Rollback note: the version-control command to restore the prior state.

## Provenance

- Origin: cursor/plugins, path pstack/skills/technical-writing/SKILL.md.
- Pinned revision: 68836ddaf5697224520f1847d90cdb90ca8babaa.
- License: MIT (pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25; authored by Lauren Tan (poteto)).
- Adaptation: clean-room rewrite of Diataxis-style controlled-English prose editing workflow. No third-party expression copied; procedure re-derived from the source mechanism description.
