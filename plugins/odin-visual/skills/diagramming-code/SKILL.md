---
name: diagramming-code
description: 'Use when asked for a call graph, class hierarchy, dependency map, containment or complexity view, a data-flow view, including attack-surface views, or to render an offline Mermaid diagram and embed it in a document. Modes: code-derived or document-embed. Not for interactive architecture visuals: use visual-diagram. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Diagramming code and embedding diagrams

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks for a code-derived call graph, class hierarchy, module dependency map, containment view, complexity heatmap, or a data-flow view, including an attack-surface view, or asks to render a Mermaid diagram offline and embed it in a document. |
| Authority | `code-derived` reads target code and writes only Mermaid graph text to the response or a named local file; it does not mutate source. `document-embed` writes Mermaid source, SVG, PNG, and (when supported) Excalidraw files only in the selected output directory and edits the existing target document to embed the render. Both modes are reversible local work with no remote mutation. |
| Side effect | `code-derived` emits a fenced Mermaid graph. `document-embed` emits the `.mmd`, rendered SVG and PNG, an optional Excalidraw scene, and an embedded SVG or PNG in the target document. |
| Done | `code-derived` produces valid, readable Mermaid with at least one node or an explanatory singleton. `document-embed` embeds a rendered diagram in the target document, keeps the `.mmd` source and rendered artifacts in the output directory, and states any Excalidraw limitation. |

## Inputs

- Mode (optional): `code-derived` or `document-embed`; when omitted, infer it from the request as specified in step 1.
- `code-derived` mode:
  - Target code directory or path (required).
  - Diagram type, one of: call-graph, class-hierarchy, module-deps, containment, complexity, data-flow (use this type for attack-surface views) (required).
  - Focus node (optional; required for call-graph and data-flow on non-trivial codebases).
  - Traversal depth (optional; default 2).
  - Layout direction, TB or LR (optional; default TB; prefer LR for module-deps).
  - Complexity threshold (optional; default 10; only for complexity).
  - Source language or auto (optional; default auto).
- `document-embed` mode:
  - Diagram request: an English description of the structure to diagram, or Mermaid source (required).
  - Target document path (required). The document must exist and be writable.
  - Output directory (optional): `./diagrams/` when the cwd is a git repo, otherwise `/tmp/odin-diagrams/`.
  - Output slug (optional): derive kebab-case from the diagram subject, 40 characters or fewer.
  - Embed location (optional) and placed width in inches (optional; when omitted, let `mmdc` retain its intrinsic output width).

## Procedure

1. Select the mode from the request and bind its inputs: honor an explicitly supplied `code-derived` or `document-embed`; otherwise choose `document-embed` for an offline Mermaid render or document-embedding request and `code-derived` for a code-relationship request. In `code-derived`, confirm the target code path and diagram type, using `data-flow` for an attack-surface request. In `document-embed`, confirm the target document exists and is writable, choose the output directory and slug, accept an optional positive placed width in inches, and bound all writes to that directory and document. Done when: the mode, required inputs, output location, optional width, and write boundary are explicit.

2. Derive or author Mermaid source from grounded input. In `code-derived`, read and search the target code and derive actual relationships without inventing edges:
   - call-graph → `flowchart`; direct calls use `-->`, inferred attribute access uses `-.->`, and uncertain dynamic dispatch uses `..->`.
   - class-hierarchy → `classDiagram`; inheritance uses `<|--` and implementation uses `<|..`.
   - module-deps → `flowchart LR` with import edges.
   - containment → `classDiagram` with member lists and containment edges.
   - complexity → `flowchart` with `classDef` styles; include nodes meeting the threshold, using low green for CC < 5, medium yellow for CC 5-10, and high red for CC > 10.
   - data-flow (including attack-surface scope) → `flowchart` from entrypoints such as user input or API endpoints to sensitive functions, with blue entrypoint styles; without a focus, target the top 10 complexity hotspots reachable from entrypoints.
   In `document-embed`, author Mermaid from the description or accept the supplied source; prefer `graph LR` for pipelines and flows and `graph TD` for hierarchies, keep labels short, put detail in edge labels, and keep each diagram to 5-15 nodes. Split a larger request into multiple diagrams and explain the split. Done when: the source and its diagram type are grounded and ready for normalization or rendering.

3. Normalize and scope the source. For `code-derived`, replace every node-ID character other than alphanumerics and `_` with `_`, prefix `n_` when the result starts with a digit, quote labels as `["..."]`, escape literal quotes as `#quot;`, and use fully qualified module-prefixed IDs to avoid reserved words such as `end`, `graph`, `subgraph`, `style`, `classDef`, and `click`. Center call-graph and data-flow output on the focus node, use depth 2 by default, and reduce depth or narrow focus when the graph would exceed roughly 100 nodes. For `document-embed`, keep the authored source within the 5-15-node range or use the declared split; flowcharts can become editable Excalidraw scenes, while sequence, state, gantt, and other non-flowchart types remain SVG/PNG outputs. Done when: IDs and labels are safe, and each mode's graph is within its readability bound.

4. Produce the mode-specific source. For `code-derived`, verify the source is a `flowchart` or `classDiagram` and contains at least one node; if no required edges exist, use one explanatory node rather than fabricating relationships. For `document-embed`, write the source of truth to `<outdir>/<slug>.mmd`, then verify that `mmdc` (Mermaid CLI) is installed and executable. If it is absent, stop with `npm install -g @mermaid-js/mermaid-cli` and do not use a CDN or remote fallback. Done when: code output is structurally valid or has an explanatory singleton, or the document mode has a written `.mmd` and a confirmed offline renderer.

5. Verify or render the result. For `code-derived`, re-check Mermaid syntax and retain the valid source for delivery. For `document-embed`, run `mmdc -i <outdir>/<slug>.mmd -o <outdir>/<slug>.svg`, showing any parse error, repairing the source, and retrying until the SVG is valid; then run `mmdc -i <outdir>/<slug>.mmd -o <outdir>/<slug>.png` and add `-w <placed-width-inches*300>` only when a positive placed-width input was supplied. If PNG rasterization fails, mount the SVG in a headless browser and take a screenshot. Done when: code mode has valid Mermaid, or document mode has rendered SVG and PNG artifacts from the local source.

6. Complete document artifacts and embedding. In `document-embed`, for a flowchart check whether the local Mermaid-to-Excalidraw support or converter script is available and, when it is, write `<outdir>/<slug>.excalidraw`; for every other Mermaid type, skip that artifact and state that it is not Excalidraw-editable. Embed the SVG (preferred) or PNG in the target document at the requested location. Do not ship a source-only or partially rendered result. Done when: the rendered diagram is embedded and every produced artifact is under the chosen output directory.

7. Deliver the result. In `code-derived`, wrap the graph in a ` ```mermaid ` fence. In `document-embed`, show the PNG, list the `.mmd`, `.svg`, `.png`, optional `.excalidraw`, and edited-document paths, and note that the Excalidraw scene opens at excalidraw.com. Done when: the requested response or embedded document and its artifact paths are presented.

8. For changes, edit the `.mmd` source and repeat rendering from step 5; for a user-edited Excalidraw round-trip, load that scene and export SVG and PNG without changing the Mermaid source. Re-run the code-derived path from source when its input code or diagram request changes. Done when: the changed source and all dependent renders are synchronized.

## Failure and recovery

- No matching code-derived edges: emit a single explanatory node; do not invent edges.
- Empty or malformed code-derived output: re-check diagram mapping and node-ID sanitization; do not suppress the error.
- Code-derived graph too large (>100 nodes): apply focus or reduce depth; never emit an unreadable graph.
- Wrong code language auto-detection: re-derive with an explicit language.
- Missing document renderer: stop with `npm install -g @mermaid-js/mermaid-cli`; do not improvise a remote fallback.
- Mermaid parse error: show the parse error, repair the `.mmd` source, and retry; do not deliver broken artifacts.
- Excalidraw conversion unavailable or unsupported for a non-flowchart: skip only that artifact, deliver SVG and PNG, and state the limitation.
- PNG rasterization failure: fall back to a headless-browser screenshot of the SVG.
- Missing or unwritable target document: stop and state its path; do not create or embed elsewhere.
- Partial document result: remove unrendered or partial artifacts; a `.mmd` file alone is not a diagram.
- Rollback: delete generated code-mode artifacts or the document-mode output-directory files and revert the target-document embed edit.
- Supplied placed width is missing its required positive value: stop before PNG rendering and report that the width must be positive in inches; when no width is supplied, use the renderer's intrinsic output width.
- Blocked result: report the exact mode, target, or diagram type that could not be resolved and why; do not claim the done predicate holds.

## Output

- `code-derived`: a fenced `mermaid` code block (`flowchart` or `classDiagram`) scoped to a readable size, or a single-node explanatory diagram when no matching edges exist.
- `document-embed`: the embedded rendered diagram in the target document, with Mermaid source (`.mmd`), SVG, PNG, and (for supported flowcharts) an editable Excalidraw scene in the output directory; report `DONE` only after embedding is confirmed and `BLOCKED` when the renderer or document is unavailable.
