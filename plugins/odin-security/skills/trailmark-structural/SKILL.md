---
name: trailmark-structural
description: 'Use when a target needs a Trailmark summary of languages, entrypoints, dependencies, or a snapshot of hotspots, taint, blast radius, subgraphs. Not for graph queries: use build-program-graph.'
---

# Trailmark structural analysis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A target needs a quick structural overview (languages, entrypoints, dependencies) before deeper analysis, or a detailed single-snapshot analysis (hotspots, entrypoints, coarse taint, blast radius, privilege boundaries, proxies, subgraphs, available type references). |
| Authority | Read-only: reads the target source tree and writes nothing; there is nothing to roll back. Never install, upgrade, or clone trailmark or any dependency. No remote mutation. |
| Side effect | Mode summary emits the language list and summary output. Mode full emits a full JSON structural-analysis payload. |
| Done | Mode summary: detected languages, `Entrypoints:`, and `Dependencies:` are all present in the returned report, or an installation or language gap is reported. Mode full: languages, summary, attack surface, hotspots, proxies, all named subgraph counts, available edge/type details, and empty-pass results are returned without fabrication. |

## Inputs

- Mode: `full` (default) or `summary`. `summary` returns detected languages, entrypoints, and dependencies without running the query engine.
- Target directory path. Required; supplied by the invoker with no default.
- Trailmark installed in the environment. Required; the user installs it themselves.

## Refusals

- Will not install, upgrade, or clone Trailmark or any dependency.
- Will not substitute manual analysis when Trailmark imports fail.
- Will not fabricate missing payload sections or treat an empty pass as failure.
- Will not assume a version-gated method exists without `hasattr()` proof.
- Will not widen a summary run into full structural analysis, hotspot scores, or taint data.

## Procedure

1. Validate the target at its trust boundary: confirm the supplied path exists and is a readable directory. If not, report the invalid target and stop; never probe a guessed path. **Done when:** the target is confirmed as a readable directory.
2. Check that trailmark is available. Verify the `trailmark` command is on PATH or the `trailmark` Python module is importable; `uv run trailmark analyze --help` is an acceptable fallback probe. If every check fails, report "trailmark is not installed" and return. Do not run `pip install`, `uv pip install`, `git clone`, or any install command. Optionally record the version; do not fail if the version command is missing. Use API feature probes in step 4 instead. **Done when:** Trailmark availability is confirmed or the installation gap is reported.
   ```bash
   command -v trailmark >/dev/null 2>&1 || \
     python3 -c "import trailmark" 2>/dev/null || \
     uv run trailmark analyze --help >/dev/null 2>&1
   ```
   ```bash
   trailmark --version 2>/dev/null || true
   ```
3. Detect languages with Trailmark's parse API. Run the snippet below with `python3`; if the `trailmark` module is not installed, rerun the same snippet with `uv run --with trailmark python3 -`. If the import still fails, report the exact import failure and return; do not install. If the result is `[]`, report "Trailmark found no supported languages under target" and return. **Done when:** supported languages are detected or the language gap is reported.
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
4. Run the mode's analysis.
   - Mode summary: run `trailmark analyze --language auto --summary <target-directory> 2>&1`, falling back to `uv run trailmark analyze --language auto --summary <target-directory> 2>&1`. Run only this summary pass; do not widen into full structural analysis, hotspot scores, or taint data. Verify the output includes the detected languages from step 3, an `Entrypoints:` line, and a `Dependencies:` line; if any is missing, report the specific missing field and stop. **Done when:** the summary output is captured with all three fields.
   - Mode full: run the full structural analysis via `QueryEngine` with `python3`; if the import fails, report the exact import failure and return; do not install. The snippet builds a graph, runs `engine.preanalysis()` (all four pre-analysis passes), and assembles the payload with version-gated feature probes. Probe v0.4-only methods with `hasattr()` before querying them. **Done when:** the full JSON payload is assembled or the exact import failure is reported.

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
5. Verify the output. Mode summary: the report carries the language list, the full summary output with its `Entrypoints:` and `Dependencies:` lines, and the version when captured. Mode full: the payload must include `languages`, `summary`, `preanalysis`, `hotspots` (possibly empty), `proxy_nodes` (empty on v0.2.x or when there are no unresolved calls; on 0.5.0+ may include `proxy.external:*` entries declared in `.trailmark/links.toml`), and `subgraphs` with counts and sample IDs. On Trailmark 0.5.0+, `attack_surface` entries may carry an `attributes` object; pass it through unchanged. Some subgraphs may have zero nodes; this is normal. Return the full output regardless. **Done when:** every required field for the mode is present and empty sections remain explicit.

## Failure and recovery

- Invalid target: the supplied path does not exist or is not a directory. Report and stop; never probe a guessed path.
- Trailmark not installed: report "trailmark is not installed" and return. Do not install, upgrade, or clone anything.
- No supported languages detected: report "Trailmark found no supported languages under target" and return.
- Import fails under `python3` and the `uv run --with trailmark` retry: report the import error and return. Do not attempt manual analysis as a substitute; manual analysis misses what tooling catches.
- Missing summary field: report the specific missing field; a partial summary never satisfies Done.
- Empty pass output: some passes produce no data for some codebases (e.g., no privilege boundaries). Return the full output regardless; empty is not failure.
- v0.4-only method absent: users may have Trailmark 0.2.x installed. Probe with `hasattr()` before querying version-gated methods. Never assume a v0.4 field is always present.
- Partial-result rule: return whatever the engine produced up to the failure point. Do not fabricate missing sections. Never swallow errors or pretend the done predicate holds.

## Output

- Mode summary: a report containing the detected language list, the full `trailmark analyze --language auto --summary` output including its `Entrypoints:` and `Dependencies:` lines, and the trailmark version in the metadata when captured; or a terminal gap classification: `trailmark is not installed`, `Trailmark found no supported languages under target`, or the named missing-field gap.
- Mode full: a JSON payload ordered as languages, summary, preanalysis, attack_surface, hotspots, proxy_nodes, subgraphs, then type_reference_samples when supported; empty sections remain explicit and no missing evidence is fabricated.
