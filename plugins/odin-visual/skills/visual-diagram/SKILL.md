---
name: visual-diagram
description: 'Use when the user asks to diagram, draw, map out, walk through, or visually explain a topic, system, process, or architecture. Produces a durable self-contained HTML file opened in the browser, or an ephemeral inline SVG fragment in a visualizer fence. Not for Excalidraw diagrams or document-embedded diagrams; use visual-argument-diagram or embed-diagram.'
---

# Visual diagram

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to diagram, draw, map out, walk through, illustrate, or visually explain a topic, system, process, or architecture |
| Authority | Stated by output mode. HTML mode: reversible-local; write only one named local HTML artifact; state the rollback path. SVG mode: read-only; no file, VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | Stated by output mode. HTML mode: writes one self-contained HTML file under the user diagrams directory; opens the page in a browser or reports the path. SVG mode: chat output only; a visualizer fence containing an SVG fragment, rendered by the client in a sandboxed iframe |
| Done | Stated by output mode. HTML mode: complete document passing the final checklist: no console errors, no horizontal overflow, dual-theme or deliberate single theme, labeled Mermaid edges, figure captions with claims. SVG mode: a valid SVG diagram of the requested family is present in the visualizer fence |

## Inputs

Required:
- Diagram request: the concept, system, process, or structure the user wants visualised, and optionally the diagram family (flowchart, structural, illustrative). If no family is stated, infer from context.
- Output modality: HTML artifact (durable file) or inline SVG (ephemeral chat). Infer from the request; see Procedure step 1.

Optional:
- Style direction: preferred color palette, font, or layout hint from the user (HTML mode).
- Surrounding context: code, architecture, or conversation context that informs the diagram content.

## Procedure

1. **Choose the output modality** from the user's request. Select HTML mode when the user asks for a file, a page, a browser-opened diagram, or a durable artifact they can revisit. Select SVG mode when the user asks for a quick inline diagram, a fence-rendered diagram, or says "draw"/"illustrate"/"map out" without requesting a file. If the modality is ambiguous, ask the user to clarify before generating. State the chosen mode and its authority. **Done when:** modality is chosen and its authority is stated, or clarification is requested.
2. **Classify the diagram family** from the request and context. Classify as flowchart (sequential steps, decision points, process walkthrough), structural (components, relationships, containment, data flow), or illustrative (conceptual explanation, not strictly sequential or structural). This classification applies to both modalities. If ambiguous, ask the user to clarify before generating. **Done when:** family is classified or clarification is requested.
3. **Extract entities and relationships** from the request and any supplied context: nodes (components, steps, concepts), edges (connections, transitions, data flows), and labels or annotations. Do not invent entities not grounded in the request or context. **Done when:** entities and relationships are extracted from grounded sources.
4. **Compose the diagram** per the chosen modality, applying the per-family composition rules in `references/svg-families.md` to both modalities:
   - HTML mode: write a self-contained HTML file using the template rules:
     - Embed all CSS inline in a `<style>` block.
     - Embed all JavaScript inline in a `<script>` block.
     - If using Mermaid, include the Mermaid CDN script or embed the Mermaid library.
     - Apply a dual-theme strategy (light and dark via `prefers-color-scheme` or a manual toggle) unless the user explicitly requests a single theme.
     - Ensure no horizontal overflow by using responsive layout, flexbox, or CSS grid with overflow containment.
     - Label every Mermaid edge with a descriptive text annotation.
     - Add a `<figcaption>` or equivalent caption to each figure that states the claim it illustrates.
     - Derive the filename from the topic: convert to lowercase, replace spaces with hyphens, append `.html`. Resolve the output directory from the user diagrams directory if known, else derive from session context or use a standard `diagrams/` folder under the project root. Create the directory if it does not exist.
   - SVG mode: compose the SVG following the shared rules and the per-family composition rules in `references/svg-families.md`:
     - Set `xmlns="http://www.w3.org/2000/svg"` and a `viewBox` that fits content with padding.
     - Use `<g>` groups for logical clusters.
     - Use `<rect>`, `<circle>`, `<ellipse>`, `<polygon>`, `<path>`, `<line>`, and `<text>` for nodes and edges.
     - Every text label is a `<text>` element with `font-family`, `font-size`, and `fill` (no text-as-path).
     - Define arrow markers in `<defs>` with unique `id` values and use `marker-end` on edge paths.
     - Set explicit `width`/`height` or rely on `viewBox` with `preserveAspectRatio="xMidYMid meet"`.
     - No external resources (no `href` to external files, no `<image>`, no CSS `url()` to external assets, inline all styles).
   **Done when:** the diagram is composed with all family-specific rules applied for the chosen modality.
5. **Validate the output** per the chosen modality:
   - HTML mode: validate against the final checklist:
     - Open the file in a headless browser or use an equivalent DOM check to confirm zero console errors.
     - Confirm that no element exceeds the viewport width (no horizontal overflow).
     - Confirm a dual theme or a documented, deliberate single theme.
     - Confirm that every Mermaid edge has a label.
     - Confirm that every figure has a caption stating a claim.
   - SVG mode: validate the SVG:
     - Root element is `<svg>` with correct `xmlns`.
     - Every opening tag has a matching closing tag or is self-closing.
     - All `id` references resolve to defined elements.
     - No unclosed paths or malformed polygon points.
     - Text elements have content and positioning attributes.
   **Done when:** every validation check for the chosen modality passes.
6. **Deliver the result** per the chosen modality:
   - HTML mode: open the HTML file in the default browser and report its path. If opening is not possible, report the file path and ask the user to open it.
   - SVG mode: wrap the SVG in a fenced code block tagged for the client's visualizer renderer. The fence must contain exactly one `<svg>` root element and nothing else outside it. Do not modify any file, repository, or external resource. Do not offer to save, export, or deploy the diagram.
   **Done when:** the file is opened or its path reported (HTML mode), or the fenced SVG is the sole chat output (SVG mode).

## Failure and recovery

| Failure class | Mode | Condition | Result |
|---|---|---|---|
| `unsupported-diagram-type` | both | Request does not match any diagram family and clarification was not possible | Stop; report the request could not be mapped to a diagram; ask the user to specify flowchart, structural, or illustrative |
| `write-error` | HTML | File write fails (permissions, disk full, path not found) | Stop; report the error; do not claim the file exists |
| `console-error` | HTML | Headless DOM check detects a console error | Stop; report the error; do not open the file |
| `overflow-error` | HTML | Horizontal overflow detected | Stop; report the overflow; do not open the file |
| `missing-labels` | HTML | Unlabeled Mermaid edge or unlabelled figure caption | Stop; report the missing labels; do not open the file |
| `malformed-svg` | SVG | Generated SVG fails validation | Regenerate once, applying the specific fix identified by validation; if it fails a second time, return the partial SVG with a note listing the remaining structural issues |
| `scope-violation` | SVG | Procedure would require file mutation, external resource access, or entity invention beyond the request and context | Stop immediately; report which boundary was hit; do not widen scope |

Partial-result rule (HTML mode): if write succeeds but validation fails, delete the written file before reporting the failure.
Rollback (HTML mode): `rm <written-filename>` restores the pre-invocation state.
No failure class swallows an error or pretends the done predicate holds when it does not.

## Output

Stated by output mode.

HTML mode: one self-contained HTML file at `<user diagrams directory>/<derived-filename>.html`, opened in the browser or its path reported. The file contains inline CSS/JS, dual-theme support, labeled Mermaid edges, and figcaption claims.

SVG mode: a single SVG diagram wrapped in a visualizer fence, declaring `xmlns`, with a `viewBox` containing all content, `<text>` elements for all labels, arrow markers in `<defs>` where directional edges exist, no external resource references, and logical grouping via `<g>` elements.
