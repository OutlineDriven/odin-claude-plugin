---
name: visual-argument-diagram
description: 'Use when a user wants to create a conceptual, workflow, architecture, or protocol diagram, or repair an existing diagram''s visual layout. Produces a .excalidraw.json and rendered PNG passing quality checks. Not for HTML diagrams or chat visuals — use visual-diagram or show-me.'
---

# Visual argument diagram

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to create a conceptual, workflow, architecture, or protocol diagram, or repair an existing diagram's visual layout. |
| Authority | Reversible local: writes only named artifacts; rolls back on failure or quality non-convergence. |
| Side effect | Writes one `.excalidraw.json` file and one `.png` render to the project directory. First run may bootstrap pinned Playwright/Chromium. |
| Done | JSON and PNG exist; rendered vision and defect checks pass for conceptual structure, evidence, eye flow, dominance, clipping, overlap, arrow routing, spacing, balance, and export readability; fewer than 30% of text elements are container-bound. |

## Inputs

| Input | Required? | Description |
|---|---|---|
| Topic / existing file path | Required | Natural-language description of the diagram to create, or a path to an existing `.excalidraw.json` to repair. |
| Output directory | Optional | Destination for JSON and PNG. Defaults to the working directory. |

## Procedure

1. **Parse the request.** If `Topic` is a path ending in `.excalidraw.json`, load it as the base diagram to repair. Otherwise treat it as a natural-language diagram brief. **Done when:** the request is classified as create or repair.
2. **Bootstrap Playwright (first run only).** Run `pnpm dlx playwright install chromium --with-deps`. If this fails, stop and report the bootstrap failure: the render step cannot proceed without Chromium. **Done when:** Chromium is available or the failure is reported.
3. **Generate or edit the Excalidraw JSON.**
   - When repairing, load the existing JSON, identify the defect classes (clipping, overlap, arrow routing, spacing, balance), and apply targeted layout corrections.
   - When creating, emit a new `.excalidraw.json` conforming to the Excalidraw element schema (`type`, `x`, `y`, `width`, `height`, `angle`, `strokeColor`, `backgroundColor`, `fillStyle`, `strokeWidth`, `roughness`, `groupIds`, `frameId`, `roundness`, `boundElements`, `link`, `locked` for each element; `type`, `id`, `name`, `text`, `fontSize`, `fontFamily`, `textAlign`, `verticalAlign`, `baseline`, `groupIds`, `frameId`, `roundness`, `boundElements`, `link`, `locked` for each `TextElement`).
   - Use rectangular boxes with rounded corners for nodes, straight or elbow arrows with arrowheads for connections, and `frameId` or `groupIds` for visual clusters.
   - Use ≤ 5 distinct stroke/fill pairs, consistently across element types.
   **Done when:** the JSON conforms to the schema and layout rules.
4. **Render the JSON to PNG.** Run Playwright headlessly, open the Excalidraw library (`https://linkpic.pages.dev` or equivalent working CDN-hosted Excalidraw renderer), serialize the JSON into the page, trigger export to PNG, capture the screenshot at 2× pixel ratio. Save to `<output_dir>/<basename>.png`. If Playwright reports no target or navigation timeout after 30 s, stop and report the render failure. **Done when:** the PNG is saved to the output directory.
5. **Validate the render.** Inspect the PNG programmatically (pixel region sampling or OCR-free geometry inference) or via a visual-language model call. Check: conceptual structure (all expected nodes and edges appear), evidence (every labeled element has legible text; no clipped labels), eye flow (primary reading direction unbroken), dominance (top-level focal element is largest or highest-contrast), clipping (no element cut off at canvas boundary), overlap (no two opaque elements share pixels), arrow routing (no arrow crosses a node body without a termination point), spacing (minimum inter-element gap ≥ 8 px at 1× scale), balance (bounding box center within 20% of canvas center), export readability (PNG ≥ 720 px on longest axis), text-to-container ratio (count text elements whose bounding box is identical to a parent container box; if ≥ 30%, fail with the defect count). **Done when:** every check passes or a failing check is identified.
6. **Quality gate.** If any check fails, roll back the written files (delete the JSON and PNG), stop, and report the specific failing checks. Do not accept a render that fails the quality checks. **Done when:** all checks pass or the rollback is complete with failing checks reported.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| `missing-input` | `Topic` is absent or empty | Stop; report missing required input. |
| `bootstrap-failure` | `pnpm dlx playwright install chromium` exits non-zero | Stop; report Playwright bootstrap failure. Render step is blocked. |
| `malformed-json` | Excalidraw JSON fails schema validation | Stop; delete partial JSON; report schema violations. |
| `render-failure` | Playwright navigation or screenshot times out | Roll back written files; stop; report render failure. |
| `quality-failure` | Any validation check fails | Roll back written files; stop; report each failing check by name and measured value. |

Rollback rule: after any failure, delete every file written during this invocation before reporting. Never leave partial artifacts on disk.

## Output
On success: `{ json_path, png_path, quality_report: { passed: true, checks: { ... } } }`; on failure: `{ status: "failed", failure_class, detail }`.
