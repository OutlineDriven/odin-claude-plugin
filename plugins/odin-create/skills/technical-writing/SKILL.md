---
name: technical-writing
description: 'Use when technical prose needs writing or reviewing with real symbols and controlled English, including draft editing when generation is unnecessary. Also handles draft editing when generation is unnecessary. Not for general prose deliverables — use writer; not for remote or irreversible changes.'
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

- Draft or existing document (required): the prose to write or review.
- Task context (required): what the prose must accomplish, its audience, and its document type.
- Style guide or audience definition (optional): project-specific conventions, terminology, or tone constraints.

## Refusals

- Will not invent content when no draft or source material exists — request the source.
- Will not copy third-party expression — clean-room adaptation only.
- Will not mark done when prose contains unresolved placeholders or ambiguous references.

## Procedure

1. **Classify.** Identify the document type per Diataxis: explanation (conceptual understanding), how-to (goal-oriented task), reference (information lookup), or tutorial (learning-oriented). Name the target audience and their prior knowledge. **Done when:** the document type and audience are named.
2. **Validate inputs.** Confirm the draft or source material is accessible. If no draft exists, scaffold from the document type: numbered steps for procedures, tables for references, definitions-first for explanations. **Done when:** the source material is accessible or a scaffold plan is chosen.
3. **Edit for controlled English.** Apply these rules until no further change would improve clarity without changing meaning: replace vague nouns with concrete names (real files, commands, APIs, paths); replace weak verbs with precise actions ("configure" not "set up", "verify" not "check"); eliminate passive voice unless the actor is genuinely unknown; replace placeholders, examples-as-templates, and invented symbols with real values from the task context; ensure every sentence carries information a prior sentence does not. **Done when:** no vague noun, weak verb, passive construction, placeholder, or redundant sentence remains.
4. **Enforce single-purpose sections.** Each section serves exactly one Diataxis type. Split sections that mix explanation and procedure; extract narrative from reference sections. **Done when:** every section maps to exactly one Diataxis type.
5. **Validate structure.** Confirm headings are parallel in form, lists are consistently punctuated, tables have no empty cells that should hold data, and code blocks specify a language. **Done when:** all four structural checks pass.
6. **Stop.** The prose is unambiguous and task-fit. Do not polish beyond clarity. **Done when:** the edited prose is written to the target file.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Missing draft | Request the source document or scaffold instructions; do not invent content. |
| Unclear task scope | Ask for clarification on audience, document type, or success criteria; do not guess. |
| Placeholder or invented symbol | Replace with the real value from context; if none exists, flag the gap explicitly. |
| License boundary | Refuse to copy third-party expression; produce clean-room adaptation only. |
| Partial result | If ambiguity remains where task context is insufficient, report the partial result with specific gaps named. Never mark done with unresolved placeholders. |
| Rollback | Revert the edited file to its prior version via version control. Full revert or full edit stands — no partial rollback. |

## Output

Edited prose artifact written to the target file, plus a change summary naming each controlled-English rule applied and the version-control command to restore the prior state.
