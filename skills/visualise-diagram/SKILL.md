---
name: visualise-diagram
description: 'Use when the user asks to diagram, draw, map out, walk through, or illustrate a system, process, or structure. Returns a valid SVG fragment in a visualizer fence rendered by the client in a sandboxed iframe. Don''t use for tasks that require source or remote-system changes.'
---

# Visualise diagram

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to diagram, draw, map out, walk me through steps, or illustrate a system, process, or structure |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only: a visualizer fence containing an SVG fragment, rendered by the client in a sandboxed iframe. |
| Done | A valid SVG diagram of the requested family (flowchart, structural, or illustrative) is present in the visualizer fence. |

## Inputs

- **Diagram request** (required): the system, process, or structure to diagram, and optionally the diagram family (flowchart, structural, illustrative). If no family is stated, infer from context.
- **Surrounding context** (optional): code, architecture, or conversation context that informs the diagram content.

## Procedure

1. **Identify the diagram family.** Read the request and context. Classify as one of:
   - *Flowchart*: sequential steps, decision points, process walkthrough. Use when the user says "walk me through", "steps", or "process".
   - *Structural*: components, relationships, containment, data flow between parts. Use when the user says "architecture", "where X lives", "how X connects", or "map out".
   - *Illustrative*: conceptual explanation of how something works, not strictly sequential or structural. Use when the user says "how does X work", "draw", or "illustrate".
   If the request is ambiguous, ask the user to clarify which family before generating.

2. **Extract the entities and relationships.** From the request and any supplied context, identify the nodes (components, steps, concepts), edges (connections, transitions, data flows), and any labels or annotations. Do not invent entities not grounded in the request or context.

3. **Compose the SVG.** Build a self-contained SVG element:
   - Set `xmlns="http://www.w3.org/2000/svg"` and a `viewBox` that fits the content with padding.
   - Use `<g>` groups for logical clusters.
   - Use `<rect>`, `<circle>`, `<ellipse>`, `<polygon>`, `<path>`, `<line>`, and `<text>` for nodes and edges.
   - For flowcharts: top-to-bottom or left-to-right flow with arrow markers defined in `<defs>`. Decision nodes use diamond polygons. Start/end nodes use rounded rectangles or stadium shapes.
   - For structural: boxes for components, lines or arrows for relationships, containment via nested `<g>` or visual grouping. Label every edge.
   - For illustrative: free-form layout that best explains the concept. Use visual metaphor where it aids understanding.
   - Every text label must be a `<text>` element with `font-family`, `font-size`, and `fill` attributes. No text-as-path.
   - Define arrow markers in `<defs>` with unique `id` values. Use `marker-end` on edge paths.
   - Set explicit `width` and `height` or rely on `viewBox` with `preserveAspectRatio="xMidYMid meet"`.
   - No external resources: no `href` to external files, no `<image>` references, no CSS `url()` to external assets. Inline all styles.

4. **Validate the SVG.** Before returning, confirm:
   - The root element is `<svg>` with the correct `xmlns`.
   - Every opening tag has a matching closing tag or is self-closing.
   - All `id` references (marker-end, fill, etc.) resolve to defined elements.
   - No unclosed paths or malformed polygon points.
   - Text elements have content and positioning attributes.

5. **Wrap in the visualizer fence.** Emit the SVG inside a fenced code block tagged for the client's visualizer renderer. The fence must contain exactly one `<svg>` root element and nothing else outside it.

6. **Stop.** Do not modify any file, repository, or external resource. Do not offer to save, export, or deploy the diagram.

## Failure and recovery
- **Unmappable request**: the request does not correspond to any diagram family and clarification was not possible. Return a message stating the request could not be mapped to a diagram, and ask the user to specify whether they want a flowchart, structural diagram, or illustrative diagram.
- **Malformed SVG**: the generated SVG fails the validation in step 4. Regenerate the SVG once, applying the specific fix identified by validation. If it fails a second time, return the partial SVG with a note listing the remaining structural issues.
- **Scope violation**: the procedure would require file mutation, external resource access, or entity invention beyond the request and context. Stop immediately and report which boundary was hit. Do not widen scope.

No failure class swallows an error or pretends the done predicate holds when it does not.

## Output
A single SVG diagram wrapped in a visualizer fence. The SVG:
- Declares `xmlns="http://www.w3.org/2000/svg"`.
- Has a `viewBox` that contains all content with visible padding.
- Uses `<text>` elements for all labels (never text-as-path).
- Defines arrow markers in `<defs>` where directional edges exist.
- Contains no external resource references.
- Groups logically related elements in `<g>` elements.

## Provenance

Adapted from bentossell/visualise (https://github.com/bentossell/visualise), revision 35cd185b58af5db2f9d0fe13d9872b544a467483. License: MIT as declared in the upstream README. No dedicated LICENSE file exists at the pinned revision. All SVG examples and diagram patterns are clean-room rederived; no third-party expression is copied. Copyright notice and full MIT text are preserved as required by the upstream license declaration.
