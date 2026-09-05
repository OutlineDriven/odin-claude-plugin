---
name: visual-argument-diagram
description: 'Use when a user wants a conceptual, workflow, or architecture diagram, a layout repair, or a PNG render of an existing .excalidraw file. Not for HTML or chat visuals: use visual-diagram or show-me.'
---

# Visual argument diagram

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to create a conceptual, workflow, architecture, or protocol diagram, repair an existing diagram's visual layout, or render an existing `.excalidraw` file to PNG without editing it (render-only mode). |
| Authority | Reversible local: writes only named artifacts; rollback is deleting those files on failure or quality non-convergence. In render-only mode the source `.excalidraw` file is read-only and no partial PNG is ever written. No remote mutation. |
| Side effect | Writes one `.excalidraw.json` file and one `.png` render (create or repair), or one `.png` only (render-only). First run may bootstrap pinned Playwright/Chromium. |
| Done | Create or repair: JSON and PNG exist; rendered vision and defect checks pass for conceptual structure, evidence, eye flow, dominance, clipping, overlap, arrow routing, spacing, balance, and export readability; fewer than 30% of text elements are container-bound. Render-only: the PNG exists on disk and represents the source diagram at the requested scale; the source file is unmodified. |

## Inputs

| Input | Required? | Description |
|---|---|---|
| Topic / existing file path | Required | Natural-language description of the diagram to create, a path to an existing `.excalidraw.json` to repair, or a path to an existing `.excalidraw` file to render. |
| Mode | Derived | `create` for a natural-language brief, `repair` for an existing file plus a layout-fix request, `render-only` for an existing file plus a render, preview, verification, or export request. |
| Output directory | Optional | Destination for JSON and PNG. Defaults to the working directory. |
| Output PNG path | Optional (render-only) | Defaults to the input stem with `.png` extension beside the source file. |
| Device scale factor | Optional (render-only) | Defaults to 2. |
| Max viewport width | Optional (render-only) | Pixels; defaults to 1920. |

## Procedure

1. **Parse the request.** Classify the mode: a path ending in `.excalidraw` or `.excalidraw.json` with a repair or layout request is `repair`; a path to an existing `.excalidraw` file with a render, preview, verification, or export request is `render-only`; otherwise `create`. Mode `render-only`: confirm the file exists at the supplied path (if missing, report the path and stop), read it as UTF-8 and parse as JSON (on failure report the parse error and stop), and check that `type` equals `"excalidraw"` and `elements` is a non-empty array (report each violation and stop). The source file is never modified in this mode. Done when: the mode is classified and, for render-only, the source JSON is validated.

2. **Bootstrap Playwright (first run only).** Run `pnpm dlx playwright install chromium --with-deps`. If this fails, stop and report the bootstrap failure: the render step cannot proceed without Chromium. Done when: Chromium is available or the failure is reported.

3. **Generate or edit the Excalidraw JSON.** Skipped in render-only mode.
   - When repairing, load the existing JSON, identify the defect classes (clipping, overlap, arrow routing, spacing, balance), and apply targeted layout corrections.
   - When creating, emit a new `.excalidraw.json` conforming to the Excalidraw element schema (`type`, `x`, `y`, `width`, `height`, `angle`, `strokeColor`, `backgroundColor`, `fillStyle`, `strokeWidth`, `roughness`, `groupIds`, `frameId`, `roundness`, `boundElements`, `link`, `locked` for each element; `type`, `id`, `name`, `text`, `fontSize`, `fontFamily`, `textAlign`, `verticalAlign`, `baseline`, `groupIds`, `frameId`, `roundness`, `boundElements`, `link`, `locked` for each `TextElement`).
   - Use rectangular boxes with rounded corners for nodes, straight or elbow arrows with arrowheads for connections, and `frameId` or `groupIds` for visual clusters.
   - Use ≤ 5 distinct stroke/fill pairs, consistently across element types.
   Done when: the JSON conforms to the schema and layout rules, or the mode is render-only and this step is skipped.

4. **Render the JSON to PNG.** Run Playwright headlessly, open the Excalidraw library (`https://linkpic.pages.dev` or equivalent working CDN-hosted Excalidraw renderer), serialize the JSON into the page, trigger export to PNG, capture the screenshot at 2x pixel ratio. Save to `<output_dir>/<basename>.png`. If Playwright reports no target or navigation timeout after 30 s, stop and report the render failure. Mode `render-only`: compute the viewport from the diagram bounding box first. Iterate over non-deleted elements: for arrow and line elements expand the bounds using every point in the `points` array relative to the element origin; for all other elements use x, y, width, height; if no elements survive the deleted filter fall back to 800x600. Add 80 px of padding on each side, cap the width at the max viewport width parameter, and set the height to at least 600 px. Then render at the requested device scale factor and save to the output PNG path. Done when: the PNG is saved to the output path.

5. **Validate the render.** Create and repair modes: inspect the PNG programmatically (pixel region sampling or OCR-free geometry inference) or via a visual-language model call. Check: conceptual structure (all expected nodes and edges appear), evidence (every labeled element has legible text; no clipped labels), eye flow (primary reading direction unbroken), dominance (top-level focal element is largest or highest-contrast), clipping (no element cut off at canvas boundary), overlap (no two opaque elements share pixels), arrow routing (no arrow crosses a node body without a termination point), spacing (minimum inter-element gap ≥ 8 px at 1x scale), balance (bounding box center within 20% of canvas center), export readability (PNG ≥ 720 px on longest axis), text-to-container ratio (count text elements whose bounding box is identical to a parent container box; if ≥ 30%, fail with the defect count). Mode `render-only`: confirm the PNG file exists on disk at the output path and report the path. Done when: every check passes, a failing check is identified, or the render-only PNG is confirmed on disk.

6. **Quality gate.** Create and repair modes: if any check fails, roll back the written files (delete the JSON and PNG), stop, and report the specific failing checks. Do not accept a render that fails the quality checks. Mode `render-only`: on any failure no file is written and the source stays untouched. Done when: all checks pass or the rollback is complete with failing checks reported.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| `missing-input` | `Topic` is absent or empty | Stop; report missing required input. |
| `missing-input-file` | Render-only input path does not exist | Report the path; no file written. |
| `bootstrap-failure` | `pnpm dlx playwright install chromium` exits non-zero | Stop; report Playwright bootstrap failure. Render step is blocked. |
| `malformed-json` | Excalidraw JSON fails schema validation, `type` is not `"excalidraw"`, or `elements` is empty | Stop; delete partial JSON if any; report each violation. |
| `render-failure` | Playwright navigation or screenshot times out, or the render call returns an error | Roll back written files; stop; report render failure. |
| `quality-failure` | Any validation check fails | Roll back written files; stop; report each failing check by name and measured value. |

Rollback rule: after any failure, delete every file written during this invocation before reporting. Never leave partial artifacts on disk. In render-only mode no partial PNG is ever written and the source `.excalidraw` file is never modified.

## Output
On success: `{ json_path, png_path, quality_report: { passed: true, checks: { ... } } }`; on failure: `{ status: "failed", failure_class, detail }`. Render-only mode returns the PNG path (the specified output path or `<input-stem>.png` beside the source) at the requested scale factor, with the source file unmodified.
