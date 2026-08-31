---
name: visual-argument-diagram
description: 'Use when a user wants to create a conceptual, workflow, architecture, or protocol diagram, or repair an existing diagram''s visual layout. Produces a valid .excalidraw.json file and a rendered PNG whose quality checks pass. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

1. **Parse the request.** If `Topic` is a path ending in `.excalidraw.json`, load it as the base diagram to repair. Otherwise treat it as a natural-language diagram brief.
2. **Bootstrap Playwright (first run only).** Run `pnpm dlx playwright install chromium --with-deps`. If this fails, stop and report the bootstrap failure: the render step cannot proceed without Chromium.
3. **Generate or edit the Excalidraw JSON.**
   - If repairing: load the existing JSON, identify the defect classes (clipping, overlap, arrow routing, spacing, balance), apply targeted layout corrections.
   - If creating: emit a new `.excalidraw.json` conforming to the Excalidraw element schema (`type`, `x`, `y`, `width`, `height`, `angle`, `strokeColor`, `backgroundColor`, `fillStyle`, `strokeWidth`, `roughness`, `groupIds`, `frameId`, `roundness`, `boundElements`, `link`, `locked` for each element; `type`, `id`, `name`, `text`, `fontSize`, `fontFamily`, `textAlign`, `verticalAlign`, `baseline`, `groupIds`, `frameId`, `roundness`, `boundElements`, `link`, `locked` for each `TextElement`).
   - Nodes: rectangular boxes with rounded corners. Connections: straight or elbow arrows with arrowheads. Groups: visual clusters via `frameId` or `groupIds`.
   - Color usage: ≤ 5 distinct stroke/fill pairs; consistent across element types.
4. **Render the JSON to PNG.** Run Playwright headlessly, open the Excalidraw library (`https://linkpic.pages.dev` or equivalent working CDN-hosted Excalidraw renderer), serialize the JSON into the page, trigger export to PNG, capture the screenshot at 2× pixel ratio. Save to `<output_dir>/<basename>.png`. If Playwright reports no target or navigation timeout after 30 s, stop and report the render failure.
5. **Validate the render.** Inspect the PNG programmatically (pixel region sampling or OCR-free geometry inference) or via a visual-language model call. Check:
   - **Conceptual structure**: all expected nodes and edges appear.
   - **Evidence**: every labeled element has legible text; no clipped labels.
   - **Eye flow**: primary reading direction left-to-right or top-down is unbroken.
   - **Dominance**: the top-level focal element is the largest or highest-contrast element.
   - **Clipping**: no element is cut off at the canvas boundary.
   - **Overlap**: no two opaque elements share pixels.
   - **Arrow routing**: no arrow crosses a node body without a termination point.
   - **Spacing**: minimum inter-element gap ≥ 8 px at 1× scale.
   - **Balance**: the diagram's bounding box center is within 20% of the canvas center.
   - **Export readability**: the PNG exports at ≥ 720 px on its longest axis.
   - **Text-to-container ratio**: count text elements whose bounding box is identical to a parent container box; if ≥ 30%, fail with the defect count.
6. **Quality gate.** If any check fails, roll back the written files (delete the JSON and PNG), stop, and report the specific failing checks. Do not silently accept a sub-quality render.

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
On success: `{ json_path: <absolute path>, png_path: <absolute path>, quality_report: { passed: true, checks: { structure: true, evidence: true, eye_flow: true, dominance: true, clipping: false, overlap: false, arrow_routing: true, spacing: true, balance: true, export_readability: true, text_container_ratio: <float> } } }`.

On failure: `{ status: "failed", failure_class: <class>, detail: <string> }`.

## Provenance

Origin: `https://github.com/coleam00/excalidraw-diagram-skill` at `8646fcc9f74f38539c6cdb4c969723336a96ddcd`.
License: NOASSERTION — no LICENSE/LICENSE.md/COPYING file exists; default all-rights-reserved. This skill is a clean-room mechanism rewrite. No upstream prose, palette, template bytes, `render_excalidraw.py`, or `render_template.html` are retained. Upstream runtime dependencies are MIT/Apache-2.0; pin to known-stable revisions before running.
