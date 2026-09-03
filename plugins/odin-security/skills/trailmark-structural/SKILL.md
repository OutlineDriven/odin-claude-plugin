---
name: trailmark-structural
description: 'Use when a target needs a detailed single-snapshot structural analysis for hotspots, entrypoints, coarse taint, blast radius, privilege boundaries, proxies, subgraphs, and type references. Not for a quick overview — use trailmark-summary. Does not diff between branches or snapshots.'
---

# Trailmark structural analysis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A target needs detailed single-snapshot hotspots, entrypoints, coarse taint, blast radius, privilege boundaries, proxies, subgraphs, and available type references. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. Never install, upgrade, or clone trailmark or any dependency. |
| Side effect | Reads the target source tree and emits a full JSON structural-analysis payload. |
| Done | Languages, summary, attack surface, hotspots, proxies, all named subgraph counts, available edge/type details, and empty-pass results are returned without fabrication. |

## Inputs

- Required: Target directory path, passed via the `args` parameter.
- Required: Trailmark installed in the environment; the user must install it themselves.

## Refusals

- Will not install, upgrade, or clone Trailmark or any dependency.
- Will not substitute manual analysis when Trailmark imports fail.
- Will not fabricate missing payload sections or treat an empty pass as failure.
- Will not assume a version-gated method exists without `hasattr()` proof.

## Procedure

1. Check that trailmark is available. If both commands fail, report "trailmark is not installed" and return. Do not run `pip install`, `uv pip install`, `git clone`, or any install command. Optionally record the version; do not fail if the version command is missing. Use API feature probes in step 3 instead. **Done when:** Trailmark availability is confirmed or the installation gap is reported.
   ```bash
   trailmark analyze --help 2>/dev/null || \
     uv run trailmark analyze --help 2>/dev/null
   ```
   ```bash
   trailmark --version 2>/dev/null || uv run trailmark --version 2>/dev/null || true
   ```

2. Detect languages with Trailmark's parse API. If the import fails, rerun the same snippet with `uv run --with trailmark python - "{args}"`. If the result is `[]`, report "Trailmark found no supported languages under target" and return. **Done when:** supported languages are detected or the language gap is reported.
   ```bash
   python3 - "{args}" <<'PY'
   import json
   import sys

   try:
       from trailmark.parse import detect_languages  # canonical location since 0.3.x
   except ModuleNotFoundError:
       # v0.2.x predates trailmark.parse; the same function lives in query.api
       from trailmark.query.api import detect_languages

   print(json.dumps(detect_languages(sys.argv[1])))
   PY
   ```

3. Run the full structural analysis via `QueryEngine`. Run with `python3`; if the import fails, rerun under `uv run --with trailmark python - "{args}"`. The snippet builds a graph, runs `engine.preanalysis()` (all four pre-analysis passes), and assembles the payload with version-gated feature probes. Probe v0.4-only methods with `hasattr()` before querying them. **Done when:** the full JSON payload is assembled or the exact import failure is reported.
   ```bash
   python3 - "{args}" <<'PY'
   import json
   import sys

   try:
       from trailmark.parse import detect_languages  # canonical location since 0.3.x
   except ModuleNotFoundError:
       # v0.2.x predates trailmark.parse; the same function lives in query.api
       from trailmark.query.api import detect_languages

   from trailmark.query.api import QueryEngine

   target = sys.argv[1]
   languages = detect_languages(target)
   engine = QueryEngine.from_directory(target, language="auto")
   preanalysis = engine.preanalysis()

   def summarize_subgraph(name: str, limit: int = 25) -> dict[str, object]:
       nodes = engine.subgraph(name)
       summary = {
           "count": len(nodes),
           "sample_ids": [node["id"] for node in nodes[:limit]],
       }
       if hasattr(engine, "subgraph_edges"):
           summary["edge_count"] = len(engine.subgraph_edges(name))
       return summary

   graph = json.loads(engine.to_json())
   nodes = graph.get("nodes", {})
   proxy_nodes = [
       node_id for node_id, node in nodes.items()
       if node.get("kind") == "proxy" or node.get("origin") == "proxy"
   ]

   payload = {
       "languages": languages,
       "summary": engine.summary(),
       "preanalysis": preanalysis,
       "attack_surface": engine.attack_surface()[:25],
       "hotspots": engine.complexity_hotspots(10)[:25],
       "proxy_nodes": proxy_nodes[:25],
       "subgraphs": {
           name: summarize_subgraph(name)
           for name in engine.subgraph_names()
       },
   }

   if hasattr(engine, "type_references"):
       payload["type_reference_samples"] = {
           node_id: engine.type_references(node_id)[:10]
           for node_id in list(nodes)[:25]
       }

   print(json.dumps(payload, indent=2))
   PY
   ```

4. Verify the output. The payload must include `languages`, `summary`, `preanalysis`, `hotspots` (possibly empty), `proxy_nodes` (empty on v0.2.x or when there are no unresolved calls; on 0.5.0+ may include `proxy.external:*` entries declared in `.trailmark/links.toml`), and `subgraphs` with counts and sample IDs. On Trailmark 0.5.0+, `attack_surface` entries may carry an `attributes` object; pass it through unchanged. Some subgraphs may have zero nodes; this is normal. Return the full JSON payload regardless. **Done when:** every required field is present and empty sections remain explicit.

## Failure and recovery
- Trailmark not installed: Report "trailmark is not installed" and return. Do not install, upgrade, or clone anything.
- No supported languages detected: Report "Trailmark found no supported languages under target" and return.
- Import fails under both python3 and uv run: Report the import error and return. Do not attempt manual analysis as a substitute; manual analysis misses what tooling catches.
- Empty pass output: Some passes produce no data for some codebases (e.g., no privilege boundaries). Return the full output regardless; empty is not failure.
- v0.4-only method absent: Users may have Trailmark 0.2.x installed. Probe with `hasattr()` before querying version-gated methods. Never assume a v0.4 field is always present.
- Partial-result rule: Return whatever the engine produced up to the failure point. Do not fabricate missing sections. Never swallow errors or pretend the done predicate holds.

## Output

A JSON payload ordered as languages, summary, preanalysis, attack_surface, hotspots, proxy_nodes, subgraphs, then type_reference_samples when supported; empty sections remain explicit and no missing evidence is fabricated.
