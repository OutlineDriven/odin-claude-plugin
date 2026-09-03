---
name: embed-diagram
description: 'Use when the user runs /embed-diagram to render a Mermaid diagram offline and embed the SVG or PNG into a target document. Uses a local CLI renderer, not a remote page. Not for code-derived diagrams. No remote, credential, publish, deploy, or irreversible changes.'
---

# Embed diagram

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs `/embed-diagram` or asks to render a Mermaid diagram offline and embed it into a document. |
| Authority | Reversible local writes: create or overwrite Mermaid source, SVG, PNG, and Excalidraw files in the output directory and edit the target document to embed the render. No remote, credential, VCS, or published mutation. |
| Side effect | Local SVG or PNG diagram renders written to the output directory and embedded into the target document. |
| Done | A rendered diagram is embedded in the target document. |

## Inputs

- A diagram request: an English description of the structure to diagram, or Mermaid source. Required.
- A target document path. Required. The document must exist and be writable.
- Output directory. Optional. Default `./diagrams/` when the cwd is a git repo, else `/tmp/gstack-diagrams/`.
- Output slug. Optional. Derived kebab-case from the diagram subject, 40 chars or fewer.

## Procedure

1. Bound scope. Confirm the target document path exists and is writable. Decide the output directory and slug. Do not write outside the output directory or the target document. Done when: the target document is confirmed writable and the output directory and slug are decided.
2. Author Mermaid from the request. Prefer `graph LR` for pipelines and flows, and `graph TD` for hierarchies. Keep node labels short; put detail in edge labels. The readable range is 5 to 15 nodes. If the request needs more, split it into multiple diagrams and explain why. Flowcharts convert to a fully editable Excalidraw scene. Sequence, state, gantt, and other Mermaid types render to SVG and PNG but skip the Excalidraw artifact. Done when: Mermaid source is authored within the readable node range, or split into multiple diagrams with a reason.
3. Write the Mermaid source to `<outdir>/<slug>.mmd`. The source is the single source of truth. Done when: the `.mmd` file is written.
4. Check the local renderer toolchain. Verify `mmdc` (mermaid-cli) is installed and executable. If not, stop and tell the user to install it: `npm install -g @mermaid-js/mermaid-cli`. Do not improvise a CDN or remote fallback. Offline is the contract. Done when: `mmdc` is confirmed executable, or the run stops with the install instruction.
5. Render SVG. Run `mmdc -i <outdir>/<slug>.mmd -o <outdir>/<slug>.svg`. If the command fails, show the parse error to the user, fix the Mermaid source, and retry. Done when: the `.svg` file is written.
6. Rasterize PNG. Run `mmdc -i <outdir>/<slug>.mmd -o <outdir>/<slug>.png -w <width>` where width is computed as placed width in inches times 300. Done when: the `.png` file is written.
7. For flowcharts only, generate an Excalidraw scene. If the local toolchain supports Mermaid-to-Excalidraw conversion (check for `@mermaid-js/mermaid-cli` Excalidraw support or a local converter script), run the converter with the Mermaid source and write the scene JSON to `<outdir>/<slug>.excalidraw`. For other Mermaid types, skip the Excalidraw artifact and tell the user: sequence and other non-flowchart diagrams render but are not Excalidraw-editable yet. Done when: the `.excalidraw` file is written for flowcharts, or the limitation is stated for other types.
8. Embed the rendered SVG (preferred for documents) or PNG into the target document at the requested location. Done when: the render is embedded in the target document.
9. Show the PNG to the user, list the artifact paths, and note that the `.excalidraw` file opens at excalidraw.com for editing. Done when: the PNG is shown and artifact paths are listed.
10. For changes, edit the `.mmd` source and re-run rendering from step 5. To re-render an edited `.excalidraw` scene from a user round-trip, load the scene file and export to SVG and PNG without touching the Mermaid. Done when: the change cycle is documented for both Mermaid and Excalidraw round-trips.

## Failure and recovery

- Local renderer missing: `mmdc` is not installed or not executable. Stop and tell the user to run `npm install -g @mermaid-js/mermaid-cli`. Do not improvise a CDN or remote fallback. Offline is the contract.
- Mermaid parse error: show the parse error to the user, fix the Mermaid source, and retry. Do not deliver a broken source file.
- Excalidraw conversion fails on a non-flowchart type: skip the `.excalidraw` artifact, deliver the SVG and PNG, and state the limitation.
- Rasterize fails: fall back to mounting the SVG in a headless browser page and taking a screenshot.
- Target document missing or unwritable: stop and state the path. Do not create or embed elsewhere.
- Partial-result rule: never ship the artifacts without rendering them. A `.mmd` file alone is not a diagram.
- Rollback: rendering writes only to the output directory and the target document. A failed render leaves the target document unchanged until the embed step succeeds.

## Output

A rendered diagram (SVG and PNG) embedded in the target document, plus the Mermaid source (`.mmd`) and, for flowcharts, an editable Excalidraw scene (`.excalidraw`) in the output directory. Terminal status: DONE when the embed is confirmed, BLOCKED when the renderer or target document is unavailable.
