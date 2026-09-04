---
name: diagramming-code
description: 'Use when asked for a call graph, class hierarchy, dependency map, containment or complexity view, or data-flow view. Not for embedding: use embed-diagram. Not for architecture: use visual-diagram.'
---

# Diagramming code

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks for a call graph, class hierarchy, module dependency map, containment view, complexity heatmap, or attack-surface/data-flow view derived from code. |
| Authority | Reversible local: writes only generated Mermaid graph text or an embedded Mermaid diagram to the local response or a named local file; rollback is deleting the emitted artifact. No remote mutation. No source mutation. |
| Side effect | Generated Mermaid graph text or an embedded Mermaid diagram in the local response or a named local file. |
| Done | The requested graph type is non-empty or honestly explains why no matching edges exist, is scoped to a readable size, and uses valid Mermaid syntax. |

## Inputs

- Target code directory or path (required).
- Diagram type, one of: call-graph, class-hierarchy, module-deps, containment, complexity, data-flow (required).
- Focus node (optional; required for call-graph and data-flow on non-trivial codebases).
- Traversal depth (optional; default 2).
- Layout direction, TB or LR (optional; default TB; prefer LR for module-deps).
- Complexity threshold (optional; default 10; only for complexity).
- Source language or auto (optional; default auto).

## Procedure

1. Confirm the target directory and diagram type. Do not widen to other types or mutate source files. Done when: the target directory and diagram type are confirmed.

2. Read and search the target code to derive graph edges from its actual structure. Do not invent relationships. Map the request to its diagram type and Mermaid form:
   - call-graph → `flowchart`; edges from call relationships; arrow style by confidence: `-->` certain (direct call), `-.->` inferred (attribute access on non-self), `..->` uncertain (dynamic dispatch).
   - class-hierarchy → `classDiagram`; `<|--` inherits, `<|..` implements.
   - module-deps → `flowchart LR`; edges from import relationships.
   - containment → `classDiagram` with member lists; edges from containment relationships.
   - complexity → `flowchart` with `classDef` styles; include only nodes meeting the threshold; color scale: `low` green CC < 5, `medium` yellow CC 5-10, `high` red CC > 10.
   - data-flow → `flowchart`; paths from entrypoints (user input, API endpoints) to sensitive functions; style entrypoints blue. Without focus, target the top 10 complexity hotspots reachable from entrypoints.

   Done when: edges are derived from actual structure and mapped to the diagram type's Mermaid form.

3. Sanitize every node ID: replace any non-alphanumeric character except `_` with `_`, and prefix `n_` if the result starts with a digit. Quote all labels with `["..."]`; escape a literal `"` in a label as `#quot;`. Use fully qualified IDs (module-prefixed) to avoid reserved words `end`, `graph`, `subgraph`, `style`, `classDef`, `click`. Done when: every node ID and label is sanitized and escaped.

4. Scope the graph to a readable size. Center call-graph and data-flow diagrams on the focus node for non-trivial codebases. Use the default depth of 2. If the graph would exceed roughly 100 nodes, narrow the focus or reduce the depth rather than emit an unreadable diagram. Done when: the graph is centered on the focus node where required and stays within the readable size bound.

5. Verify the output starts with `flowchart` or `classDiagram` and contains at least one node with valid Mermaid syntax. If no edges of the required type exist, emit a single-node diagram with an explanatory message instead of failing or fabricating edges. Done when: the output is valid Mermaid with at least one node, or a single-node explanatory diagram is emitted.

6. Wrap the result in a ` ```mermaid ` fence and deliver it. Done when: the fenced mermaid block is delivered.

## Failure and recovery
- No matching edges (e.g., no inheritance edges in a Go or C codebase): emit a single-node explanatory diagram; do not invent edges.
- Empty or malformed output: re-check the diagram-type mapping and node ID sanitization; do not hand-wave or suppress the error.
- Graph too large (>100 nodes): apply focus or reduce depth; never emit an unreadable graph.
- Language auto-detection wrong: re-derive with an explicit language.
- Rollback: delete the emitted artifact. No source mutation occurred, so no source rollback is needed.
- Blocked result: report exactly which diagram type and target could not be resolved and why; do not claim the done predicate holds.

## Output
A fenced `mermaid` code block (`flowchart` or `classDiagram`) scoped to a readable size, or a single-node explanatory diagram when no matching edges exist, ordered confirm → derive-edges → sanitize → scope → verify → deliver.
