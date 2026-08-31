---
name: quick-spec-render
description: 'Use when asked to render a validated spec to schema-shaped HTML when the --quick flag is passed on diagram, diff-review, plan-review, or project-recap outcomes; produce a self-contained HTML artifact or fail loudly and fall back to the full HTML workflow. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Quick spec render

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Literal `--quick` flag on the diagram, diff-review, plan-review, or project-recap outcomes only; never for slides, fact-check, visual plans, PPTX, themes, or updates |
| Authority | Reversible-local: write only the named HTML output artifact; rollback deletes that artifact |
| Side effect | Writes a single schema-shaped HTML file from the validated spec |
| Done | Validated render exists on disk, or a loud validation failure followed by mandatory fallback to the full HTML workflow |

## Inputs

1. **Spec** (required): a structured spec object produced by the upstream outcome (diagram, diff-review, plan-review, or project-recap). Must contain the fields the schema requires.
2. **Output path** (required): the target filesystem path for the rendered HTML file.
3. **Schema** (required): the JSON Schema that defines valid spec shape. The render must reject any spec that fails schema validation.

## Procedure

1. Confirm the invocation carries the literal `--quick` flag. If absent, stop. This skill does not apply.
2. Confirm the outcome type is one of: diagram, diff-review, plan-review, project-recap. If the outcome is slides, fact-check, visual plans, PPTX, themes, or updates, stop. This skill does not apply.
3. Validate the spec against the schema. If validation fails, go to step 7.
4. Render the validated spec to a single self-contained HTML document. The HTML must embed all required styles inline and reference no external resources.
5. Write the HTML to the output path.
6. Read back the written file and verify it is well-formed HTML. If verification fails, go to step 7. If it passes, the procedure is done.
7. Loud failure: report the exact validation or render error to the user. Delete any partially written HTML artifact. Fall back to the full HTML workflow. Do not attempt to patch or retry the quick render.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Schema validation failure | Report the validation errors verbatim. Delete partial output. Fall back to the full HTML workflow. |
| Render error | Report the error. Delete partial output. Fall back to the full HTML workflow. |
| Missing required spec field | Treat as schema validation failure. |
| Write or read-back failure | Report the I/O error. Delete partial output if it exists. Fall back to the full HTML workflow. |

Partial-result rule: no partial HTML artifact may survive on disk after any failure. Rollback is deletion of the output file. If the output file does not exist, rollback is a no-op.

## Output
A single self-contained HTML file at the specified output path, containing the rendered spec with all styles embedded inline. On failure, no output file exists and the user receives a report naming the failure class and the exact error, followed by invocation of the full HTML workflow.

## Provenance

Origin: nicobailon/visual-explainer, revision 7163c3e10660912e0b89e1af465db9f387282b88. License: MIT. Treatment: MIT notice retained; expression reuse or clean-room rederivation permitted. Source mechanisms: flag-gated bounded render path with schema validation, scoped to four outcome types, with mandatory fallback on validation failure.
