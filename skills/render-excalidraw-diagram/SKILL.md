---
name: render-excalidraw-diagram
description: 'Use when a user supplies an existing .excalidraw file and asks for PNG rendering. Validates the JSON, renders via headless Chromium, and writes a PNG beside the source or to a specified output path. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Render Excalidraw diagram

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User supplies an existing .excalidraw file and asks for PNG rendering, preview, verification, or export. |
| Authority | Reversible-local: writes only the requested PNG file; never edits the source .excalidraw JSON. First run may bootstrap pinned rendering dependencies (Playwright, Chromium). Rollback is deleting the PNG. |
| Side effect | Writes one PNG to the local filesystem. Source JSON is read-only. |
| Done | The rendering script exits zero, the PNG file exists on disk, and validation plus in-browser render signals all passed. |

## Inputs

- **Required:** Path to an existing `.excalidraw` file containing valid JSON with `type: "excalidraw"` and a non-empty `elements` array.
- **Optional:** Output PNG path (defaults to input stem with `.png` extension), device scale factor (defaults to 2), maximum viewport width in pixels (defaults to 1920).

## Procedure

1. **Validate input existence.** Confirm the `.excalidraw` file exists at the supplied path. If missing, report the path and exit 1.
2. **Parse and validate JSON.** Read the file as UTF-8 and parse as JSON. If parsing fails, report the parse error and exit 1. Check that `type` equals `"excalidraw"`, that `elements` is present and is a non-empty array. If any check fails, report each violation and exit 1.
3. **Compute viewport dimensions.** Iterate non-deleted elements to find the bounding box (min x, min y, max x, max y). For arrow and line elements, expand bounds using each point in the `points` array relative to the element origin. For all other elements, use x, y, width, and height. If no elements survive the deleted filter, fall back to 800x600. Add 80 px padding on each side. Cap width at the max viewport width parameter; set height to at least 600 px.
4. **Locate rendering dependencies.** Confirm the HTML template file exists in the same directory as the rendering script. Confirm Playwright and its Chromium browser are installed. If Playwright is missing, report the install command and exit 1. If Chromium is missing, report `playwright install chromium` and exit 1.
5. **Launch headless browser.** Open Chromium in headless mode via Playwright. Create a page with the computed viewport size and the requested device scale factor. If the browser fails to launch, report the error and exit 1.
6. **Load the rendering template.** Navigate the page to the HTML template file URI. The template loads the Excalidraw library from esm.sh as an ES module. Wait for the module-ready signal (`window.__moduleReady === true`) with a 30-second timeout. If the timeout fires, report the dependency load failure and exit 1.
7. **Inject diagram data and render.** Serialize the parsed JSON and call `window.renderDiagram(data)` on the page. If the call returns null or `{ success: false }`, report the error message from the result and exit 1.
8. **Wait for render completion.** Wait for `window.__renderComplete === true` with a 15-second timeout. If the timeout fires, report the render stall and exit 1.
9. **Capture screenshot.** Query the page for `#root svg`. If no SVG element is found, report the missing SVG and exit 1. Take a screenshot of the SVG element and write it to the output PNG path.
10. **Verify output.** Confirm the PNG file exists on disk. Print the output path to stdout.

## Failure and recovery
| Failure class | Detection | Recovery |
|---|---|---|
| Missing input file | Path check in step 1 | Report path; exit 1; no file written |
| Invalid JSON | Parse error in step 2 | Report parse error; exit 1; no file written |
| Invalid Excalidraw structure | Validation checks in step 2 | Report each violation; exit 1; no file written |
| Missing Playwright | Import check in step 4 | Report install command; exit 1; no file written |
| Missing Chromium | Launch check in step 5 | Report `playwright install chromium`; exit 1; no file written |
| Browser launch failure | Exception in step 5 | Report error; exit 1; no file written |
| Module load timeout | Timeout in step 6 | Report dependency load failure; exit 1; no file written |
| Render failure | Error result in step 7 | Report error message; exit 1; no file written |
| Render timeout | Timeout in step 8 | Report stall; exit 1; no file written |
| Missing SVG | Selector check in step 9 | Report missing SVG; exit 1; no file written |

No partial PNG is ever written. The source `.excalidraw` file is never modified. On any failure the script exits 1 with an actionable error message.

## Output
A PNG file at the specified output path or at `<input-stem>.png` beside the source file. The file contains the rendered Excalidraw diagram at the requested scale factor.

## Provenance

Clean-room mechanism rewrite of the render-verify pipeline from coleam00/excalidraw-diagram-skill at revision 8646fcc9f74f38539c6cdb4c969723336a96ddcd. Upstream license is NOASSERTION (no LICENSE file exists; default all-rights-reserved). No upstream prose, palette bytes, template markup, or script code is retained. Runtime dependencies (Playwright, Chromium) are MIT/Apache-2.0; pin their versions in the project manifest.
