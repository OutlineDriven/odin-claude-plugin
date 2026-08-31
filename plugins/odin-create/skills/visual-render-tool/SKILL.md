---
name: visual-render-tool
description: 'Use when a model-invoked tool renders visual explanations of plans, architectures, diffs, or implementations into self-contained HTML files under the output jail; opens the browser or Glimpse viewer on demand. Also use when --quick is passed on diagram, diff-review, plan-review, or project-recap outcomes to render a validated spec to HTML. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Visual render tool

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Model-invoked tool call after a plan, architecture, diff, or implementation would benefit from visual explanation; ask first unless the user requested visual output. Also triggers on the literal `--quick` flag passed on diagram, diff-review, plan-review, or project-recap outcomes to render a validated spec to HTML. |
| Authority | Reversible local: write only named local HTML artifacts; delete the file to roll back. |
| Side effect | Writes rendered HTML into the output jail; optionally opens browser or Glimpse viewer. |
| Done | File written under the jail and open status reported; complete-document assertion and normalization applied. For quick-spec renders, the validated HTML exists on disk or a loud validation failure is reported. |

## Refusals

- Slides, fact-check, visual plans, PPTX, themes, or updates with the `--quick` flag: this skill does not apply. Stop.
- Partial HTML artifact surviving on disk after any failure: rejected. Any partial output is deleted.

## Inputs

- Source content (required): the plan, architecture, diff, or implementation text to visualize. For quick-spec renders, a structured spec object produced by the upstream outcome.
- Output filename (optional): filename under the jail. Defaults to `render-<timestamp>.html`.
- Visual format (optional): `diagram`, `flowchart`, `tree`, `timeline`, `grid`, or `table`. Inferred from source structure if omitted.
- Schema (required for quick-spec renders only): the JSON Schema that defines valid spec shape. The render rejects any spec that fails schema validation.

## Procedure

1. Determine the render mode. If the invocation carries the literal `--quick` flag, proceed to the quick-spec render path (steps 2a through 5a). Otherwise, proceed to the standard render path (steps 2b through 7b). Done when: the render mode is determined.

### Quick-spec render path

2a. Confirm the outcome type is diagram, diff-review, plan-review, or project-recap. If the outcome is slides, fact-check, visual plans, PPTX, themes, or updates, stop. Done when: the outcome type is one of the four allowed types or the step has stopped.

3a. Validate the spec against the schema. If validation fails, go to step 5a. Done when: the spec passes schema validation or the procedure has branched to step 5a.

4a. Render the validated spec to a single self-contained HTML document with all required styles embedded inline and no external resources. Write the HTML to the output path. Read back the written file and verify it is well-formed HTML. Done when: the file is verified as well-formed HTML.

5a. Loud failure: report the exact validation or render error to the user. Delete any partially written HTML artifact. Fall back to the standard render path (step 2b). Do not patch or retry. Done when: the error is reported, partial output is deleted, and the standard render path is entered.

### Standard render path

2b. Validate that source content is non-empty. Done when: source content is confirmed present, or the step has stopped with `truncated-input`.

3b. Determine the visual format from the format hint or structural signals: list/bullet structure to diagram; sequential steps to flowchart; nested hierarchy to tree; dated or ordered events to timeline; two-axis data to grid; pairwise items to table. Done when: format is one of {diagram, flowchart, tree, timeline, grid, table}, or the step has stopped with `unsupported-format`.

4b. Render the source content into a self-contained HTML document using only inline CSS and inline SVG. No external CDN, no external fonts, no external scripts, no `<script>` tags, no `eval`, no `data:` URLs, no `<object>`, no `<embed>`, no `<iframe>`. All styles live in a `<style>` block inside `<head>`. All markup is static. Done when: HTML document contains only inline assets.

5b. Apply complete-document normalization: verify the HTML parses as a complete document with `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`, every tag closes, charset `utf-8`, whitespace normalized. Done when: normalization passes, or the step has stopped with `malformed-output` after discarding the partial file.

6b. Write the normalized HTML to the output jail under the chosen filename. Done when: file exists under the jail, or the step has stopped with `write-failure`.

7b. Optionally open the file in the browser or Glimpse viewer. Report the file path and open status to the user. Done when: path and open status are in the response.

## Failure and recovery

- `truncated-input`: source content empty or unreadable. Stop, return error.
- `unsupported-format`: inferred format not in {diagram, flowchart, tree, timeline, grid, table}. Stop, return error.
- `write-failure`: file write returns non-zero or throws. Stop, do not report success.
- `malformed-output`: normalization fails. Discard partial file, stop.
- Schema validation failure (quick-spec): report the validation errors verbatim. Delete partial output. Fall back to the standard render path.
- Render error (quick-spec): report the error. Delete partial output. Fall back to the standard render path.
- Missing required spec field (quick-spec): treat as schema validation failure.

Partial-result rule: if the complete file is not written and normalized, discard all partial output. Rollback: delete the written file; the tool does not delete pre-existing files.

## Output

A complete HTML artifact saved under the output jail with the file path and open status reported. For quick-spec renders, a single self-contained HTML file at the specified output path with all styles embedded inline, or on failure no output file and a report naming the failure class and exact error followed by standard render fallback.
