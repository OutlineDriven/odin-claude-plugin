---
name: quick-spec-render
description: 'Use when --quick is passed on diagram, diff-review, plan-review, or project-recap outcomes to render a validated spec to HTML. Produces a self-contained artifact or falls back to the full HTML workflow. Not for slides, fact-check, visual plans, PPTX, themes, or updates.'
---

# Quick spec render

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Literal `--quick` flag on the diagram, diff-review, plan-review, or project-recap outcomes only. |
| Authority | Reversible-local: write only the named HTML output artifact; rollback deletes that artifact. |
| Side effect | Writes a single schema-shaped HTML file from the validated spec. |
| Done | Validated render exists on disk, or a loud validation failure followed by mandatory fallback to the full HTML workflow. |

## Refusals

- **Missing --quick flag**: this skill does not apply. Stop.
- **Slides, fact-check, visual plans, PPTX, themes, or updates**: this skill does not apply. Stop.
- **Partial HTML artifact surviving on disk after any failure**: rejected. Any partial output is deleted before fallback.

## Inputs

1. **Spec** (required): a structured spec object produced by the upstream outcome. It must contain the fields the schema requires.
2. **Output path** (required): the target filesystem path for the rendered HTML file.
3. **Schema** (required): the JSON Schema that defines valid spec shape. The render rejects any spec that fails schema validation.

## Procedure

1. Confirm that the invocation carries the literal `--quick` flag. If absent, stop; this skill does not apply. **Done when**: the `--quick` flag is present or the skill has stopped.
2. Confirm that the outcome type is diagram, diff-review, plan-review, or project-recap. If the outcome is slides, fact-check, visual plans, PPTX, themes, or updates, stop. **Done when**: the outcome type is one of the four allowed types or the skill has stopped.
3. Validate the spec against the schema. If validation fails, go to step 7. **Done when**: the spec passes schema validation or the procedure has branched to step 7.
4. Render the validated spec to a single self-contained HTML document with all required styles embedded inline and no external resources. **Done when**: the HTML document is assembled with inline styles.
5. Write the HTML to the output path. **Done when**: the file exists at the output path.
6. Read back the written file and verify it is well-formed HTML. If verification fails, go to step 7. **Done when**: the file is verified as well-formed HTML.
7. Loud failure: report the exact validation or render error to the user. Delete any partially written HTML artifact. Fall back to the full HTML workflow. Do not patch or retry. **Done when**: the error is reported, partial output is deleted, and the full HTML workflow is invoked.

## Failure and recovery

- **Schema validation failure**: report the validation errors verbatim. Delete partial output. Fall back to the full HTML workflow.
- **Render error**: report the error. Delete partial output. Fall back to the full HTML workflow.
- **Missing required spec field**: treat as schema validation failure.
- **Write or read-back failure**: report the I/O error. Delete partial output if it exists. Fall back to the full HTML workflow.

No partial HTML artifact may survive on disk after any failure. Rollback is deletion of the output file; if the output file does not exist, rollback is a no-op.

## Output

A single self-contained HTML file at the specified output path with all styles embedded inline, or on failure no output file and a report naming the failure class and exact error followed by full HTML workflow invocation.

## Provenance

Origin: nicobailon/visual-explainer, revision 7163c3e10660912e0b89e1af465db9f387282b88. License: MIT. Treatment: MIT notice retained; expression reuse or clean-room rederivation permitted. Source mechanisms: flag-gated bounded render path with schema validation, scoped to four outcome types, with mandatory fallback on validation failure.
