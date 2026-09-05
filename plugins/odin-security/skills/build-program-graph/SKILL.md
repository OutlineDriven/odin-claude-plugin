---
name: build-program-graph
description: 'Use when a multi-language program graph is needed for call paths, entrypoints, blast radius, or taint reachability. Not for overview (trailmark-structural) or snapshot (trailmark-structural).'
---

# Build a program graph

A program graph turns a source tree into nodes (functions, methods, types, modules, contracts) and edges (calls, inheritance, imports, containment) that queries can answer: who calls this sink, what can this entrypoint reach, where do trust levels change across a call. This skill builds the graph for the whole tree, runs the preanalysis passes that security queries depend on, and reports evidence with its version and parser limits attached. Reachability answers where a call path exists; it never proves that attacker-controlled data flows anywhere.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user needs a multi-language source graph for call paths, attack surface, entrypoints, blast radius, coarse taint reachability, boundaries, types, proxies, or declared cross-system links. |
| Authority | Reversible local: writes only graph exports, preanalysis subgraphs and annotations, and an optional declared-links file; rollback is deleting the written files. No remote mutation. The graph tool must already be installed; this skill never installs or upgrades tooling. |
| Side effect | Graph export files, preanalysis subgraphs and annotations (in-memory), and an optional declared-links file at the analysis root. Rollback: delete the written files; in-memory annotations vanish when the engine is disposed. |
| Done | The correct languages are parsed, preanalysis has run, requested queries return evidence with the version and parser limits stated, and no reachability result is presented as data-flow or vulnerability proof. |

## Inputs

- Required: A target directory containing source code to parse.
- Optional: An explicit language list when the target is known polyglot or single-language; otherwise use the tool's auto-detection. An existing declared-links file for cross-boundary edges. An external binary-analysis graph export for augmentation where the tool supports it.

## Refusals

- Will not present call-graph reachability or taint-subgraph membership as data-flow or vulnerability proof.
- Will not fall back to manual analysis when the graph tool is unavailable or fails; manual reading misses what the graph catches.
- Will not invent a supported language list, a versioned method, or a cross-boundary edge.
- Will not treat proxy or binary-origin nodes as source code functions.

## Procedure

1. **Confirm the tool.** Verify the installed graph analyzer is on PATH and importable from scripts. If it is missing, report that to the user and stop; do not install anything and do not substitute manual analysis. Record the installed version in every report. **Done when:** tool availability is confirmed or the installation gap is reported.
2. **Detect languages.** Ask the installed build what it supports (supported-language query) and what exists under the tree (detection query over the target directory). Treat any documented parser list as documentation, not a source of truth; the installed build answers for itself. If detection returns nothing parseable, report the gap and stop. **Done when:** detected and supported languages are recorded.
3. **Build the full graph.** Construct the engine over the target directory with auto-detected languages, or an explicit list when the user supplied one. Build the full graph; do not sample: sampling misses cross-module attack paths. Use subgraph queries to focus after the full graph is built. **Done when:** the full graph is built for the selected languages.
4. **Run preanalysis.** Run the preanalysis pass before any query that depends on blast radius, entrypoints, privilege boundaries, or taint. The passes, under their usual names:
   - Blast radius estimation: counts downstream and upstream nodes per function, annotates every node, and creates a `high_blast_radius` subgraph (commonly nodes with 10 or more downstream descendants).
   - Entry point enumeration: maps entrypoints by trust level and creates `entrypoints`, `entrypoint_reachable`, and per-trust-level subgraphs (`untrusted_external`, `semi_trusted_external`, `trusted_internal`).
   - Privilege boundary detection: finds call edges whose source and target are reachable from entrypoints at different trust levels, annotates the boundary nodes, and creates a `privilege_boundary` subgraph.
   - Taint propagation: propagates taint from untrusted and semi-trusted entrypoints along call edges; trusted entrypoints generate none; annotates tainted nodes and creates a `tainted` subgraph.
   **Done when:** all four passes complete.
5. **Execute requested queries.** Use the version-safe baseline unless a capability probe proves the richer method exists. The standard vocabulary:
   - Direct neighbors: callers and callees of a function.
   - Paths: between two functions; from any entrypoint to a target function.
   - Transitive slices: everything that can eventually reach a sink (ancestors); everything an entrypoint or helper can eventually call (descendants).
   - `complexity_hotspots(threshold=N)`: functions above a cyclomatic complexity threshold.
   - `attack_surface()`: entrypoints with trust levels, kinds, and, on newer builds, optional attributes.
   - Summary and export: graph summary, full JSON export (summary, nodes, edges, subgraphs).
   - Subgraphs: query named subgraphs created by preanalysis.
   - Annotations: add and read structured notes on nodes (`ASSUMPTION`, `PRECONDITION`, `POSTCONDITION`, `INVARIANT` are user-added; blast radius, privilege boundary, and taint annotations come from preanalysis). Record a source convention for annotations (`llm`, `docstring`, `manual`, `preanalysis`).
   **Done when:** every requested query returns evidence or a named version limitation.
6. **Gate version-specific features.** Before using a feature that arrived after the baseline version, probe for it (method or attribute presence on the engine object, or a structural probe of the data model). Fall back only to the documented baseline alternative; on older builds, export the graph and compute the answer from the export (for example, subgraph edges as the edges whose endpoints are both in the named subgraph). Never assume a method exists because documentation mentions it. **Done when:** every versioned feature is either safely used or reported unavailable.
7. **Declare cross-boundary links when needed.** When the parser cannot see a call across an FFI, RPC, IPC, or contract boundary, declare it in the tool's links file at the analysis root. The declaration format is TOML with one block per edge:
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
   Endpoint references may be exact node ids or unique names or suffixes. Validation fails closed: ambiguous references, unknown internal endpoints, invalid enum values, and malformed TOML raise an error rather than silently weakening the graph. Declared edges carry a `configured_by` marker pointing at the links file. External endpoints appear as `proxy.external:<symbol>` nodes; treat them as system boundaries, not source. **Done when:** each required boundary link validates or no declaration is needed.
8. **Record graph model metadata.** Node kinds: `function`, `method`, `class`, `module`, `struct`, `interface`, `trait`, `enum`, `namespace`, `contract`, `library`, `template`; newer builds add `proxy` for unresolved calls and, where SQL parsing exists, `schema`, `table`, `view`, `procedure`. Node origins where present: `source`, `proxy`, `binary`, `synthetic`. Edge kinds: `calls`, `inherits`, `implements`, `contains`, `imports`, plus `resolves_to`, `type_uses`, `specializes`, `corresponds_to` where supported. Edge confidence: `certain` (direct call such as `self.method()`), `inferred` (attribute access on a non-self object), `uncertain` (dynamic dispatch). Per code unit: parameters with types, return types, exception types, cyclomatic complexity, branch metadata. State which of these the installed build actually emits. **Done when:** model metadata in the report reflects the installed build, not the documentation.
9. **Bound the security claims.** Reachability is not taint. Path queries report call-graph reachability; the taint subgraph marks nodes reachable from untrusted entrypoints as a coarse signal. Most graph tools perform no interprocedural data-flow analysis: neither result proves attacker-controlled data reaches a sink, and membership in `tainted` means reachable-from-untrusted, not demonstrable data flow. Verify data flow by hand before claiming it. Account for `uncertain` edges in every security claim: dynamic dispatch is where type confusion bugs hide. Do not treat `origin=proxy` or `origin=binary` nodes as source code functions. **Done when:** each security claim in the report is stated at the strength its evidence supports.
10. **Export if requested.** Write the JSON export (summary, nodes, edges, subgraphs) to a local file when the user asked for one. Query attack surface and annotations directly for entrypoint metadata. Note in the export record which proxy nodes, external endpoints, and origins the installed build emits. **Done when:** the requested export is written or no export was requested.

## Failure and recovery

- Tool missing or failing to install: report the gap and stop. No manual-analysis fallback.
- Import error in snippets: stop and report the missing tool or import; do not use `uv run --with` or any other install step. The graph analyzer must already be installed.
- Version-gated method unavailable: probe before calling; fall back to the baseline alternative and say so in the report.
- Language detection failure: report the finding; do not invent a language list.
- Preanalysis not run: blast radius, taint, and privilege data exist only after preanalysis; run it before retrying any dependent query. Never claim preanalysis results without running it.
- Overstated reachability: if any claim presents reachability or taint-subgraph membership as data-flow or vulnerability proof, correct the claim.
- Rollback: delete the written files (exports, declared-links file). In-memory annotations vanish when the engine is disposed.

## Output

A graph evidence report ordered as installed version and parser coverage, languages, graph summary, preanalysis results, requested query results, then limitations; every query cites its version gates, and the report states that reachability is not data-flow proof.
