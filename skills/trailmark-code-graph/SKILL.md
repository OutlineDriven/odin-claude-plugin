---
name: trailmark-code-graph
description: 'Build a multi-language Trailmark graph for call paths, attack surface, coarse taint, boundaries, types, proxies, and cross-system links. Not for a quick overview — use trailmark-summary; not for a fixed snapshot report — use trailmark-structural.'
---

# Trailmark code graph

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user needs a multi-language source graph for call paths, attack surface, entrypoints, blast radius, coarse taint reachability, boundaries, types, proxies, or declared cross-system links. |
| Authority | Reversible local writes only: Trailmark graph exports, preanalysis subgraphs and annotations, and optional .trailmark/links.toml declarations. State the rollback path before writing. |
| Side effect | Trailmark graph exports, preanalysis subgraphs and annotations, and optional .trailmark/links.toml declarations. Rollback: delete exported graph files and .trailmark/links.toml; annotations are in-memory and vanish on engine disposal. |
| Done | The correct languages are parsed, preanalysis runs, requested queries return evidence with version and parser limits, and graph reachability is not overstated as data-flow or vulnerability proof. |

## Inputs

- **Required**: A target directory containing source code to parse.
- **Optional**: Explicit language list when the target is known polyglot or single-language; otherwise use `auto`. Existing `.trailmark/links.toml` for cross-boundary edge declarations. An external binary-analysis graph JSON for augmentation (v0.4+).

## Refusals

- Will not present call-graph reachability or taint-subgraph membership as data-flow or vulnerability proof.
- Will not fall back to manual analysis when Trailmark is unavailable.
- Will not invent a supported language list, versioned method, or cross-boundary edge.
- Will not treat proxy or binary-origin nodes as source code functions.

## Procedure

1. **Install Trailmark if missing.** If `trailmark` is not found, run `uv tool install trailmark`. A tool install provides the CLI only; run Python snippets with `uv run --with trailmark python -` to resolve `import trailmark`. If installation fails, report the error to the user; do not fall back to manual code reading. **Done when:** the CLI and Python import are available, or the installation failure is reported.
2. **Check the installed version.** Run `trailmark --version 2>/dev/null || uv run trailmark --version 2>/dev/null`. Compare numerically, not lexically. The version command was added in 0.2.2; a failure means pre-0.2.2 or trailmark missing; distinguish with `trailmark analyze --help`. Record the version in every report. **Done when:** the version or pre-0.2.2 classification is recorded.
3. **Detect languages.** On 0.3+ use `from trailmark.parse import detect_languages, supported_languages`; on 0.2.x import `detect_languages` from `trailmark.query.api`. Call `supported_languages()` to ask the installed build what it supports; do not hardcode a stale language table. Call `detect_languages("{targetDir}")` to see what exists under the tree. Treat any documented parser list as documentation, not a source of truth. **Done when:** detected and supported languages are recorded.
4. **Build the graph.** Create the engine: `QueryEngine.from_directory("{targetDir}", language="auto")` for unknown or polyglot trees, or `language="python,rust"` for an explicit list. Build the full graph; do not sample: sampling misses cross-module attack paths. Use subgraph queries to focus after the full graph is built. **Done when:** the full graph is built for the selected languages.
5. **Run preanalysis.** Call `engine.preanalysis()` before any query that depends on blast radius, entrypoints, privilege boundaries, or taint. Preanalysis enriches the graph with four passes:
   - **Blast radius estimation**: counts downstream (descendants) and upstream (ancestors) nodes per function; annotates every node with `AnnotationKind.BLAST_RADIUS` (format: `"N downstream, M upstream; critical: ..."`); creates subgraph `high_blast_radius` (nodes with >= 10 downstream descendants).
   - **Entry point enumeration**: maps entrypoints by trust level; creates subgraphs `entrypoints`, `entrypoint_reachable` (union of all entrypoint-reachable nodes), and `entrypoints:{trust_level}` where trust_level is `untrusted_external`, `semi_trusted_external`, or `trusted_internal`.
   - **Privilege boundary detection**: finds call edges where source and target are reachable from entrypoints at different trust levels; annotates boundary nodes with `AnnotationKind.PRIVILEGE_BOUNDARY` (format: `"trust transition across call: X -> Y"`); creates subgraph `privilege_boundary`.
   - **Taint propagation**: propagates taint from untrusted and semi-trusted entrypoints through call edges; trusted entrypoints do not generate taint; annotates tainted nodes with `AnnotationKind.TAINT_PROPAGATION` (format: `"tainted via: ep1, ep2"`); creates subgraph `tainted` (all nodes reachable from non-trusted entrypoints).
   **Done when:** all four preanalysis passes complete.
6. **Execute requested queries.** Use the v0.2-safe baseline unless the installed version is 0.4.0+ or the method exists when probed with `hasattr()`. Available queries:
   - `callers_of(name)`, `callees_of(name)`: direct callers and callees of a function.
   - `paths_between(entry, sink)`: call paths between two functions.
   - `ancestors_of(sink)`: upward transitive slice: who could eventually reach this sink.
   - `reachable_from(entry)`: downward transitive slice: what could this entrypoint or helper eventually call.
   - `entrypoint_paths_to(target)`: paths from any entrypoint to a target function.
   - `complexity_hotspots(threshold=N)`: functions above a cyclomatic complexity threshold.
   - `attack_surface()`: all entrypoints with trust levels, kinds, and (v0.5+) optional `attributes`.
   - `summary()`, `to_json()`: graph summary and full JSON export (summary, nodes, edges, subgraphs).
   - `subgraph(name)`, `subgraph_names()`: query named subgraphs created by preanalysis.
   - `annotate(node, kind, text, source)`, `annotations_of(node, kind)`, `nodes_with_annotation(kind)`, `clear_annotations(node, kind)`: annotation workflow. Annotation kinds: `ASSUMPTION`, `PRECONDITION`, `POSTCONDITION`, `INVARIANT` (user-added); `BLAST_RADIUS`, `PRIVILEGE_BOUNDARY`, `TAINT_PROPAGATION` (preanalysis-added). Source convention: `"llm"`, `"docstring"`, `"manual"`, `"preanalysis"`.
   - v0.4+: `connect_subgraphs(a, b)` (connect named subgraphs and return induced edges), `subgraph_edges(name)` (edges within a subgraph), `generic_parameters(name)`, `type_references(name)`, `augment_binary(json_path)` (import external binary-analysis graph JSON).
   **Done when:** every requested query returns evidence or a named version limitation.
7. **Gate version-specific features.** Before using any v0.4+ or v0.5+ feature, probe with `hasattr(engine, "method_name")` and fall back only to the documented v0.2-safe alternative. For v0.5+ features that add no new `QueryEngine` methods, gate on the reported version or probe structurally: `from trailmark.models.nodes import NodeKind; has_v05 = "SCHEMA" in NodeKind.__members__`. On v0.2.x, export `engine.to_json()` and filter edges whose endpoints are both in `engine.subgraph(name)` as the fallback for `subgraph_edges()`. **Done when:** every versioned feature is either safely used or reported unavailable.
8. **Declare cross-boundary links when needed (v0.5+).** When the parser cannot see a call across an FFI, RPC, IPC, or contract boundary, create `.trailmark/links.toml` at the analysis root:
   ```toml
   [[link]]
   source = "backend:submit"
   target = "contract:Verifier.verify"
   kind = "calls"
   confidence = "certain"
   description = "JSON-RPC eth_call"

   [[link]]
   source = "backend:notify"
   target = "payments-webhook"
   target_external = true
   ```
   Endpoint references may be exact node IDs or unique names or suffixes. Validation fails closed: ambiguous references, unknown internal endpoints, invalid enum values, and malformed TOML raise `ValueError` rather than silently weakening the graph. Configured edges carry `configured_by = .trailmark/links.toml`. External endpoints (`target_external = true` or `source_external = true`) appear as `proxy.external:<symbol>` nodes; treat them as system boundaries, not source. **Done when:** each required boundary link validates or no declaration is needed.
9. **Record graph model metadata.** Node kinds: `function`, `method`, `class`, `module`, `struct`, `interface`, `trait`, `enum`, `namespace`, `contract`, `library`, `template`; v0.4+ adds `proxy` for unresolved calls; v0.5+ adds `schema`, `table`, `view`, `procedure` for SQL graphs. Node origins (v0.4+): `source`, `proxy`, `binary`, `synthetic`; v0.2 exports may omit origin. Edge kinds: `calls`, `inherits`, `implements`, `contains`, `imports`; v0.4+ adds `resolves_to`, `type_uses`, `specializes`, `corresponds_to`. Edge confidence: `certain` (direct call, `self.method()`), `inferred` (attribute access on non-self object), `uncertain` (dynamic dispatch). Per code unit: parameters with types, return types, exception types, cyclomatic complexity, branch metadata, docstrings, annotations. Per edge: source and target node IDs, edge kind, confidence level. Project level: dependencies, entrypoints with trust levels and asset values, named subgraphs. **Done when:** the report carries the graph-model limits needed to interpret its evidence.
10. **Bound security claims.** Reachability is not taint. `entrypoint_paths_to()` and the taint subgraph answer different questions: path queries report call-graph reachability; preanalysis taint marks nodes reachable from untrusted entrypoints as a coarse signal. Trailmark does not perform interprocedural taint analysis; do not present either as proof that attacker-controlled data reaches a sink. Membership in the `tainted` subgraph means an untrusted entrypoint can reach the node, not that attacker-controlled data demonstrably flows into it; verify data flow manually before claiming it. Account for `uncertain` edges in security claims: dynamic dispatch is where type confusion bugs hide. Do not treat `origin=proxy` or `origin=binary` nodes as source code functions; use them to identify resolution gaps, dynamic dispatch, external APIs, or binary linkage candidates. Combine complexity with taint and blast radius data: low-complexity functions on tainted paths are high-value targets. **Done when:** every security claim is phrased within the evidence Trailmark actually supplies.
11. **Export the graph if requested.** `engine.to_json()` produces JSON with summary, nodes, edges, and subgraphs. Write to a local file if the user requested an export. Query `attack_surface()` and `annotations_of()` directly for entrypoint metadata and per-node annotations. v0.4+ exports proxy nodes for unresolved calls and may include `origin` on non-source nodes. v0.5+ exports `proxy.external:<symbol>` nodes for declared external endpoints and materializes proxies and `type_uses` edges for single-language parses (0.4 emitted them only for polyglot parses). **Done when:** the requested export is written or no export was requested.

## Failure and recovery
- **Trailmark not installed**: If `uv tool install trailmark` fails, report the error to the user. Do not fall back to manual code reading, manual verification, or manual analysis. The tool must be installed and used programmatically.
- **Import error in snippets**: Run snippets with `uv run --with trailmark python -` rather than relying on the tool install. This resolves `import trailmark`; it is not a fallback to manual analysis.
- **Version-gated method unavailable**: Probe with `hasattr()` before calling. If the method is absent, fall back to the v0.2-safe alternative. Do not assume a v0.4+ or v0.5+ method exists because documentation mentions it; many environments still have Trailmark 0.2.x installed.
- **Language detection failure**: If `detect_languages()` returns empty or the target directory has no parseable files, report the finding. Do not invent a language list.
- **Preanalysis not run**: Blast radius, taint, and privilege data are only available after `engine.preanalysis()`. If a query depends on preanalysis data and preanalysis was not run, run it before retrying. Do not claim preanalysis results without running it.
- **Overstated reachability**: If a security claim presents call-graph reachability or taint subgraph membership as data-flow proof or vulnerability proof, correct the claim. Reachability means an entrypoint can reach the node, not that attacker-controlled data demonstrably flows into it.
- **Rollback**: All writes target local files (graph exports, `.trailmark/links.toml`). To roll back, delete the written files. Annotations are in-memory and vanish when the engine is disposed.

## Output

A graph evidence report ordered as version and parser coverage, languages, graph summary, preanalysis results, requested query results, then limitations; each query cites version gates and the report states that reachability is not data-flow proof.

## Provenance

Adapted from Trail of Bits trailmark skill.
- Origin: https://github.com/trailofbits/skills
- Revision: d1f1575cff97816e5cc08af66cd2506099c681d3
- License: CC-BY-SA-4.0; source https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3; preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding.
- Adaptation: Clean-room rewrite for ODIN 2.0 module odin-code-advanced. Procedure derived from source mechanisms (graph construction, version gating, preanalysis passes, query patterns, repository links, graph model, security-claim boundaries). No third-party expression copied.
