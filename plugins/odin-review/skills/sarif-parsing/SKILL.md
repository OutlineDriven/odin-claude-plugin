---
name: sarif-parsing
description: 'Use when a user supplies existing SARIF to inspect, filter, aggregate, deduplicate, diff, convert, or gate findings without running a scanner. Produces the requested findings or derived artifacts. Not for running a scanner — use the relevant security-review skill.'
---

# SARIF analysis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User supplies existing SARIF and asks to inspect, filter, aggregate, deduplicate, diff, convert, or gate findings without running a scanner. |
| Authority | Reversible-local: write only named local artifacts derived from the provided SARIF; no scanner execution, no credential access, no remote mutation. |
| Side effect | Reads provided SARIF and may emit requested derived summaries or transformed SARIF/CSV/HTML artifacts. Does not run source scanners. |
| Done | Requested findings or derived artifacts are produced with optional fields handled, paths normalized where comparison requires it, inherited severity resolved correctly, and aggregation metadata retained. |

## Inputs

- Required: SARIF content: a file path to a local `.sarif` or `.json` file, or raw SARIF JSON pasted directly.
- Optional, context-dependent:
  - Target format for conversion (CSV, HTML, or a SARIF variant such as a specific schema version).
  - Filter criteria for inspection (e.g., rule ID pattern, file path glob, severity threshold).
  - Aggregation strategy (count by rule, by file, by severity, by tool).
  - Deduplication scope (exact match, or relaxed by ignoring line numbers or fingerprints).
  - A second SARIF file for diff.
  - A gating threshold or rule list.

## Procedure

1. Load and parse the provided SARIF as JSON. If the input is a file path, read it from the local filesystem. If parsing fails, stop with `invalid-input`.
2. Validate the top-level structure of the SARIF object (must contain `runs` as an array). If the structure is invalid, stop with `invalid-sarif`.
3. Resolve inherited severity for every result that omits an explicit `level`: walk the `rules`/`ruleDescriptors` lookup table in the same `run` object, then fall back to the tool default (`warning`).
4. Apply the user request:
   - Inspect / Filter: apply the stated filter criteria to `runs[].results[]`, keeping every result that matches.
   - Deduplicate: within each run, group results by the deduplication scope (exact, or relaxed) and retain one representative per group.
   - Aggregate / Summarize: compute the requested aggregation over the full run set and emit the summary table.
   - Diff: align results from two SARIF inputs by normalized file path plus rule ID; report added results (in B not A) and removed results (in A not B). Normalize file URIs to filesystem paths before comparison.
   - Convert: transform the SARIF into the requested format (CSV, HTML summary, or SARIF variant) preserving the results, rules, and tool metadata.
   - Gate: evaluate each result against the stated threshold or rule list; report pass/fail per rule and overall.
   - Any other request: stop with `unsupported-request`.
5. If the requested artifact must be written to a local file, write it to the stated path. Roll back by deleting the file if a subsequent step fails.
6. Return the produced findings or derived artifact inline or confirm the written path.

## Failure and recovery
- **`invalid-input`**: SARIF is not valid JSON or the file does not exist. Do not produce any artifact.
- **`invalid-sarif`**: JSON parses but does not conform to the SARIF 2.1.0+ structure. Do not produce any artifact.
- **`unsupported-request`**: The request is not inspect, filter, aggregate, deduplicate, diff, convert, or gate. State that the operation is unsupported and stop without writing.
- **`results-not-produced`**: A request for a derived artifact cannot be satisfied (e.g., empty result set after filter). Return an empty result set with a note; do not fabricate findings.

## Output
One of:
- A filtered or deduplicated SARIF JSON object.
- A diff report listing added and removed results with rule ID and normalized file path.
- A converted artifact in the requested format (CSV, HTML, or SARIF variant).
- An aggregation summary table with row counts grouped by the requested dimension and any aggregation metadata (tool name, run date, total result count).
- A gating report listing each evaluated rule and its pass/fail status.
