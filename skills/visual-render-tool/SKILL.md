---
name: visual-render-tool
description: 'Use when a model-invoked tool renders visual explanations of plans, architectures, diffs, or implementations into self-contained HTML files under the output jail; opens the browser or Glimpse viewer on demand. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Visual render tool

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Model-invoked tool call after a plan, architecture, diff, or implementation would benefit from visual explanation; ask first unless the user requested visual output |
| Authority | Reversible local: write only named local HTML artifacts; delete the file to roll back |
| Side effect | Writes rendered HTML into the output jail; optionally opens browser or Glimpse viewer |
| Done | File written under the jail and open status reported; complete-document assertion and normalization applied |

## Inputs

- **Source content** (required): the plan, architecture, diff, or implementation text to visualize.
- **Output filename** (optional): filename under the jail. Defaults to `render-<timestamp>.html`.
- **Visual format** (optional): `diagram`, `flowchart`, `tree`, `timeline`, `grid`, or `table`. Inferred from source structure if omitted.

## Procedure

1. Validate that source content is non-empty. Done when: source content is confirmed present, or the step has stopped with `truncated-input`.
2. Determine the visual format from the format hint or structural signals: list/bullet structure → diagram; sequential steps → flowchart; nested hierarchy → tree; dated or ordered events → timeline; two-axis data → grid; pairwise items → table. Done when: format is one of {diagram, flowchart, tree, timeline, grid, table}, or the step has stopped with `unsupported-format`.
3. Render the source content into a self-contained HTML document using only inline CSS and inline SVG. No external CDN, no external fonts, no external scripts, no `<script>` tags, no `eval`, no `data:` URLs, no `<object>`, no `<embed>`, no `<iframe>`. All styles live in a `<style>` block inside `<head>`. All markup is static. Done when: HTML document contains only inline assets.
4. Apply complete-document normalization: verify the HTML parses as a complete document with `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`, every tag closes, charset `utf-8`, whitespace normalized. Done when: normalization passes, or the step has stopped with `malformed-output` after discarding the partial file.
5. Write the normalized HTML to the output jail under the chosen filename. Done when: file exists under the jail, or the step has stopped with `write-failure`.
6. Optionally open the file in the browser or Glimpse viewer. Done when: open status is determined (opened or skipped).
7. Report the file path and open status to the user. Done when: path and open status are in the response.

## Failure and recovery
- `truncated-input`: source content empty or unreadable → stop, return error.
- `unsupported-format`: inferred format not in {diagram, flowchart, tree, timeline, grid, table} → stop, return error.
- `write-failure`: file write returns non-zero or throws → stop, do not report success.
- `malformed-output`: normalization fails → discard partial file, stop.

Partial-result rule: if the complete file is not written and normalized, discard all partial output. Rollback: delete the written file; the tool does not delete pre-existing files.

## Output
A complete HTML artifact saved under the output jail with the file path and open status reported.

## Provenance

Adapted from `nicobailon/visual-explainer` (MIT) at `7163c3e10660912e0b89e1af465db9f387282b88`. Source files: `plugins/visual-explainer/extension.ts`, `plugins/visual-explainer/mcp/server.mjs`, `plugins/visual-explainer/mcp/README.md`. MIT notice retained. Clean-room rederivation of the rendering procedure; HTML generation rewritten from scratch.
