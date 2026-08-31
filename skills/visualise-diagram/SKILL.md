---
name: visualise-diagram
description: 'Use when the user asks to diagram, draw, map out, walk through, or illustrate a system, process, or structure. Returns a valid SVG fragment in a visualizer fence for sandboxed iframe rendering. Don''t use for tasks that require source or remote-system changes.'
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

1. Identify the diagram family from the request and context. Classify as flowchart (sequential steps, decision points, process walkthrough), structural (components, relationships, containment, data flow), or illustrative (conceptual explanation, not strictly sequential or structural). If ambiguous, ask the user to clarify before generating. Done when: family is classified or clarification is requested.
2. Extract the entities and relationships from the request and any supplied context: nodes (components, steps, concepts), edges (connections, transitions, data flows), and labels or annotations. Do not invent entities not grounded in the request or context. Done when: entities and relationships are extracted from grounded sources.
3. Compose the SVG following the shared rules and the per-family composition rules in `references/svg-families.md`: set `xmlns="http://www.w3.org/2000/svg"` and a `viewBox` that fits content with padding; use `<g>` groups for logical clusters; use `<rect>`, `<circle>`, `<ellipse>`, `<polygon>`, `<path>`, `<line>`, and `<text>` for nodes and edges; every text label is a `<text>` element with `font-family`, `font-size`, and `fill` (no text-as-path); define arrow markers in `<defs>` with unique `id` values and use `marker-end` on edge paths; set explicit `width`/`height` or rely on `viewBox` with `preserveAspectRatio="xMidYMid meet"`; no external resources (no `href` to external files, no `<image>`, no CSS `url()` to external assets, inline all styles). Done when: SVG element is composed with all family-specific rules applied.
4. Validate the SVG: root element is `<svg>` with correct `xmlns`; every opening tag has a matching closing tag or is self-closing; all `id` references resolve to defined elements; no unclosed paths or malformed polygon points; text elements have content and positioning attributes. Done when: all validation checks pass.
5. Wrap the SVG in a fenced code block tagged for the client's visualizer renderer. The fence must contain exactly one `<svg>` root element and nothing else outside it. Done when: SVG is wrapped in the visualizer fence.
6. Stop. Do not modify any file, repository, or external resource. Do not offer to save, export, or deploy the diagram. Done when: no mutation has occurred and the fenced SVG is the sole output.

## Failure and recovery
- **Unmappable request**: the request does not correspond to any diagram family and clarification was not possible. Return a message stating the request could not be mapped to a diagram, and ask the user to specify whether they want a flowchart, structural diagram, or illustrative diagram.
- **Malformed SVG**: the generated SVG fails validation. Regenerate once, applying the specific fix identified by validation. If it fails a second time, return the partial SVG with a note listing the remaining structural issues.
- **Scope violation**: the procedure would require file mutation, external resource access, or entity invention beyond the request and context. Stop immediately and report which boundary was hit. Do not widen scope.

No failure class swallows an error or pretends the done predicate holds when it does not.

## Output
A single SVG diagram wrapped in a visualizer fence, declaring `xmlns`, with a `viewBox` containing all content, `<text>` elements for all labels, arrow markers in `<defs>` where directional edges exist, no external resource references, and logical grouping via `<g>` elements.
