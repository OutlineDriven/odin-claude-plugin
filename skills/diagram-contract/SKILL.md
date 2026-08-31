---
name: diagram-contract
description: 'Use when the user runs /diagram-contract to render a mermaid diagram offline and embed the SVG or PNG into a target document. Not for code-derived diagrams — use diagramming-code. No remote, credential, publish, deploy, or irreversible changes.'
---

# Diagram contract

## Contract

| Field | Bound contract |
|---|---|
| Trigger | the user runs /diagram-contract |
| Authority | reversible local writes: create or overwrite mermaid source, SVG, PNG, and excalidraw files in the output directory and edit the target document to embed the render; no remote, credential, VCS, or published mutation |
| Side effect | local SVG or PNG diagram renders written to the output directory and embedded into the target document |
| Done | a rendered diagram is embedded in the target document |

## Inputs

- A required diagram request: an English description of the structure to diagram, or mermaid source.
- A required target document path. The document must exist and be writable.
- Output directory: optional. Default `./diagrams/` when the cwd is a git repo, else `/tmp/gstack-diagrams/`.
- Output slug: optional. Derived kebab-case from the diagram subject, ≤40 chars.

## Procedure

1. Bound scope. Confirm the target document path exists and is writable. Decide the output directory and slug. Do not write outside the output directory or the target document. **Done when:** the target document is confirmed writable and the output directory and slug are decided.

2. Author mermaid from the request. Prefer `graph LR` for pipelines and flows, and `graph TD` for hierarchies. Keep node labels short and put detail in edge labels. The readable range is 5-15 nodes. If the request needs more, split it into multiple diagrams and explain why. Flowcharts convert to a fully editable excalidraw scene. Sequence, state, gantt, and other mermaid types render to SVG/PNG, but skip the excalidraw artifact. **Done when:** mermaid source is authored within the readable node range, or split into multiple diagrams with a reason.

3. Write the mermaid source to `<outdir>/<slug>.mmd` first. The source is the single source of truth. **Done when:** the `.mmd` file is written.

4. Render offline. Load a local mermaid renderer page in a headless browser and poll until it reports ready. The renderer bundles mermaid and the excalidraw converter locally; no CDN and no network. Do not improvise a CDN fallback. Offline is the contract. **Done when:** the local renderer reports ready.

5. Ship the mermaid source into the renderer via base64. Never splice file contents into a JS template literal: backticks, `${`, and backslashes in the source would be interpreted and corrupt it. For non-ASCII labels, recover UTF-8 exactly with `decodeURIComponent(escape(atob('…')))`. **Done when:** the source is delivered to the renderer via base64 without template-literal splicing.

6. Render SVG. Call the renderer's mermaid render function with a unique id and the base64-decoded source; write the returned SVG string to `<outdir>/<slug>.svg`. **Done when:** the `.svg` file is written.

7. Rasterize PNG. Call the renderer's rasterize function with the SVG and a target width in pixels computed as placed width in inches × 300; write the PNG to `<outdir>/<slug>.png`. **Done when:** the `.png` file is written.

8. For flowcharts only, call the renderer's mermaid-to-excalidraw converter with the base64-decoded source and write the scene JSON to `<outdir>/<slug>.excalidraw`. For other mermaid types, skip the excalidraw artifact and tell the user: sequence and other non-flowchart diagrams render but are not excalidraw-editable yet (upstream converter limitation; flowcharts are). **Done when:** the `.excalidraw` file is written for flowcharts, or the limitation is stated for other types.

9. Embed the rendered SVG (preferred for documents) or PNG into the target document at the requested location. **Done when:** the render is embedded in the target document.

10. Show the PNG to the user, list the artifact paths, and note that the `.excalidraw` file opens at excalidraw.com for editing. **Done when:** the PNG is shown and artifact paths are listed.

11. For changes, edit the `.mmd` source and re-run rendering from step 4. To re-render an edited `.excalidraw` scene from a user round-trip, load the scene file and export to SVG and PNG without touching the mermaid, using base64 transport again because scene JSON is full of quotes and backslashes. **Done when:** the change cycle is documented for both mermaid and excalidraw round-trips.

## Failure and recovery
- Renderer unavailable: stop and surface the build or setup command. Do not improvise a CDN fallback. Offline is the contract.
- Mermaid parse error: show the parse error to the user, fix the mermaid, and retry. Do not deliver a broken source file.
- Excalidraw conversion fails on a non-flowchart type: skip the `.excalidraw` artifact, deliver the SVG and PNG, and state the limitation.
- Rasterize throws on a tainted canvas: fall back to mounting the SVG in the page and taking a screenshot.
- Target document missing or unwritable: stop and state the path. Do not create or embed elsewhere.
- Partial-result rule: never ship the artifacts without rendering them. A `.mmd` file alone is not a diagram.
- Rollback: rendering writes only to the output directory and the target document. A failed render leaves the target document unchanged until the embed step succeeds.
- Blocked result: state the blocker, what was tried, and the exact build or setup command needed.

## Output
A rendered diagram (SVG and PNG) embedded in the target document, plus the mermaid source (`.mmd`) and, for flowcharts, an editable excalidraw scene (`.excalidraw`) in the output directory, ordered bound → author → write-mmd → render-offline → transport → svg → png → excalidraw → embed → show → changes, with terminal status DONE when the embed is confirmed or BLOCKED when the renderer or target document is unavailable.

## Provenance

Origin: github.com/garrytan/gstack, `diagram/SKILL.md` and `lib/diagram-render`, revision `07b59e396c6be5a86619a43151cb9ed62a15ae69`. License MIT, Copyright (c) 2026 Garry Tan. Clean-room adaptation: re-derived the rendering procedure (offline bundled renderer, base64 source transport, flowchart-to-excalidraw conversion with non-flowchart limitation, 300dpi rasterization, embed into a target document) without copying gstack's preamble, telemetry, browse-daemon plumbing, or expressive prose.
