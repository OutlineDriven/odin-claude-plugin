---
name: diagramming-code
description: 'Use when the user asks for a call graph, class hierarchy, module dependency map, containment view, complexity heatmap, or attack-surface/data-flow view derived from code. Produces valid Mermaid graph text scoped to a readable size or honestly reports why no matching edges exist. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Diagramming code

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks for a call graph, class hierarchy, module dependency map, containment view, complexity heatmap, or attack-surface/data-flow view derived from code. |
| Authority | Write only generated Mermaid graph text or an embedded Mermaid diagram to the local response or a named local file. No source, VCS, credential, paid, published, deployed, or remote mutation. Roll back by deleting the emitted artifact. |
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

1. Confirm the target directory and diagram type. Do not widen to other types or mutate source files.
2. Derive graph edges from actual code structure by reading and searching the target, not by inventing relationships. Map the request to its diagram type and Mermaid form:
   - call-graph → `flowchart`; edges from call relationships; arrow style by confidence: `-->` certain (direct call), `-.->` inferred (attribute access on non-self), `..->` uncertain (dynamic dispatch).
   - class-hierarchy → `classDiagram`; `<|--` inherits, `<|..` implements.
   - module-deps → `flowchart LR`; edges from import relationships.
   - containment → `classDiagram` with member lists; edges from containment relationships.
   - complexity → `flowchart` with `classDef` styles; include only nodes meeting the threshold; color scale: `low` green CC < 5, `medium` yellow CC 5-10, `high` red CC > 10.
   - data-flow → `flowchart`; paths from entrypoints (user input, API endpoints) to sensitive functions; style entrypoints blue. Without focus, target the top 10 complexity hotspots reachable from entrypoints.
3. Sanitize every node ID: replace any non-alphanumeric character except `_` with `_`, and prefix `n_` if the result starts with a digit. Quote all labels with `["..."]`; escape a literal `"` in a label as `#quot;`. Use fully qualified IDs (module-prefixed) to avoid reserved words `end`, `graph`, `subgraph`, `style`, `classDef`, `click`.
4. Scope to a readable size. Use focus-equivalent centering for call-graph and data-flow on non-trivial codebases; default depth 2; if the graph would exceed roughly 100 nodes, narrow focus or reduce depth rather than emit an unreadable diagram.
5. Verify the output starts with `flowchart` or `classDiagram` and contains at least one node with valid Mermaid syntax. If no edges of the required type exist, emit a single-node diagram with an explanatory message instead of failing or fabricating edges.
6. Wrap the result in a ` ```mermaid ` fence and deliver it.

## Failure and recovery
- No matching edges (e.g., no inheritance edges in a Go or C codebase): emit a single-node explanatory diagram; do not invent edges.
- Empty or malformed output: re-check the diagram-type mapping and node ID sanitization; do not hand-wave or suppress the error.
- Graph too large (>100 nodes): apply focus or reduce depth; never emit an unreadable graph.
- Language auto-detection wrong: re-derive with an explicit language.
- Rollback: delete the emitted artifact. No source mutation occurred, so no source rollback is needed.
- Blocked result: report exactly which diagram type and target could not be resolved and why; do not claim the done predicate holds.

## Output
A fenced `mermaid` code block (`flowchart` or `classDiagram`) scoped to a readable size, or a single-node explanatory diagram when no matching edges exist.

## Provenance

Origin: https://github.com/trailofbits/skills. Pinned revision: d1f1575cff97816e5cc08af66cd2506099c681d3. License: CC-BY-SA-4.0; source https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3; preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding. Clean-room adaptation: the source mechanism is preserved (six code-derived diagram types, edge-confidence arrow styling, node ID sanitization and label escaping, complexity color scale, data-flow entrypoint styling, empty-diagram honesty, and size scoping) while the expression is rewritten and the original tool-backed script dependency is removed for a self-contained, runtime-dependency-free procedure.
