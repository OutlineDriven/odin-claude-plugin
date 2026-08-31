---
name: render-excalidraw-diagram
description: 'Use when a user supplies an existing .excalidraw file and asks for PNG rendering. Validates the JSON, renders via headless Chromium using the Excalidraw library fetched from esm.sh, and writes a PNG beside the source or to a specified output path. Not for creating or editing Excalidraw diagrams.'
---

# Render Excalidraw diagram

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User supplies an existing .excalidraw file and asks for PNG rendering, preview, verification, or export. |
| Authority | Reversible local write of a single PNG. Network access to fetch the Excalidraw rendering library from esm.sh. Source JSON remains read-only. Rollback is deleting the PNG. |
| Side effect | Writes one PNG to the local filesystem. Source JSON is never modified. |
| Done | The PNG file exists on disk and represents the source diagram at the requested scale. |

## Refusals

- Editing the source .excalidraw JSON: rejected. The source file is read-only.
- Partial PNG surviving on disk after any failure: rejected. On any failure no file is written.
- Creating or editing Excalidraw diagrams: rejected. This skill renders existing files only.

## Inputs

- Required: path to an existing `.excalidraw` file containing valid JSON with `type: "excalidraw"` and a non-empty `elements` array.
- Optional: output PNG path (defaults to input stem with `.png` extension), device scale factor (defaults to 2), maximum viewport width in pixels (defaults to 1920).

## Procedure

1. Validate the .excalidraw JSON structure and compute the bounding box. Confirm the file exists at the supplied path; if missing, report the path and stop. Read the file as UTF-8 and parse as JSON; if parsing fails, report the parse error and stop. Check that `type` equals `"excalidraw"` and that `elements` is a non-empty array; if any check fails, report each violation and stop. Iterate over non-deleted elements to find the bounding box (min x, min y, max x, max y). For arrow and line elements, expand the bounds using every point in the `points` array relative to the element origin. For all other elements, use x, y, width, and height. If no elements survive the deleted filter, fall back to 800x600. Add 80 px of padding on each side. Cap the width at the max viewport width parameter; set the height to at least 600 px. Done when: the JSON is validated and viewport dimensions are computed.

2. Launch headless browser and fetch rendering dependencies. Open Chromium in headless mode via Playwright. If Playwright or its Chromium browser is missing, report the install command (`npm install playwright && npx playwright install chromium`) and stop. Create a page with the computed viewport size and the requested device scale factor. Done when: the browser is launched with the correct viewport, or the missing-dependency error is reported.

3. Inject parsed diagram data into the rendering template. Build an inline HTML document that loads the Excalidraw library from `https://esm.sh/@excalidraw/excalidraw` as an ES module, exposes a `window.renderDiagram(data)` function that initializes Excalidraw with the parsed JSON, and signals `window.__renderComplete` when rendering finishes. Set the page content to this inline document. Serialize the parsed JSON and call `window.renderDiagram(data)` on the page. If the call returns an error, report it and stop. Done when: the diagram data is injected and the render call returns without error.

4. Wait for render completion signal. Wait for `window.__renderComplete === true` with a 15-second timeout. If the timeout fires, report the render stall and stop. Done when: the render-complete signal is received.

5. Capture SVG screenshot and write PNG to disk. Query the page for the Excalidraw SVG element. If no SVG is found, report the missing SVG and stop. Take a screenshot of the SVG element and write it to the output PNG path. Confirm the PNG file exists on disk and print the output path to stdout. Done when: the PNG is written and confirmed on disk.

## Failure and recovery

- Missing input file: report path; no file written.
- Invalid JSON: report parse error; no file written.
- Invalid Excalidraw structure: report each violation; no file written.
- Missing Playwright or Chromium: report install command; no file written.
- Browser launch failure: report error; no file written.
- Render failure: report error message; no file written.
- Render timeout: report stall; no file written.
- Missing SVG: report missing SVG; no file written.

No partial PNG is ever written. The source `.excalidraw` file is never modified. The network dependency on esm.sh is required; if the fetch fails, report the dependency load failure and stop.

## Output

A PNG file at the specified output path or at `<input-stem>.png` beside the source file, containing the rendered Excalidraw diagram at the requested scale factor.
