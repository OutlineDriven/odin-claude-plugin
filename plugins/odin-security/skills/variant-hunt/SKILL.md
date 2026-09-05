---
name: variant-hunt
description: 'Use when a confirmed root cause must be searched across a codebase, turned into a search rule, or seeded from graph neighbors. Not for building the program graph: use build-program-graph.'
---

# Variant hunt

Hunt variants of a confirmed root cause across a codebase. The default candidate source is pattern search (ripgrep, Semgrep, CodeQL); when a program graph already exists for the codebase, `graph-seeding` ranks k-hop neighbors of the seed node by topology to seed candidate selection.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A specific vulnerability, logic bug, or bad pattern has already been confirmed and the user asks where else the same root cause occurs, asks to generalize it into a search rule, or asks for graph-derived candidates to seed the hunt. |
| Authority | Reversible local: writes only named local artifacts (the variant report and any CI-ready regression rule) to the working directory; graph search is read-only; rollback is deleting or editing those artifacts by hand. No remote mutation. |
| Side effect | Searches the full codebase, may execute ripgrep, Semgrep, or CodeQL, reads an existing program graph in graph-seeding mode, and may write a variant report and CI-ready regression rule. No other repository file is modified. |
| Done | The exact pattern hits the known bug, graph-seeded candidates are bounded and ranked when that mode runs, abstraction changes are calibrated one at a time, and every candidate is triaged. Confirmed variants and false positives are reported with evidence, and a reproducible final pattern and regression guard are supplied. |

## Inputs

Required:
- A confirmed root cause statement: what operation is dangerous, what data makes it dangerous, what protection is missing, and what context enables it.
- The original bug location (file and line) or the vulnerable code snippet.
- The project codebase reachable from the current working directory.

Optional:
- Preferred search tool (default: ripgrep for recon, Semgrep for iteration, CodeQL for precision).
- Candidate source: `pattern-search` (default) or `graph-seeding` when a program graph is already built for the codebase.
- Graph-seeding: a node identifier or full node object that the confirmed or plausible issue binds to; a rank-weighting preference (default: equal weight across dimensions); an explicit exclusion scope (default: none; include all neighbors within bounds).

## Procedure

1. **Receive and validate the root cause.** Require a root cause statement and the original bug location or snippet. If either is absent, stop and return `blocked: root cause and original location required`. Validate the location exists in the codebase before proceeding. **Done when:** the root cause statement and original location are validated.
2. **Enumerate expansion axes.** Ask four questions: what operation is dangerous, what data makes it dangerous, what is missing, and what context enables it. List every independent direction where a variant could hide: related identifiers, other manifestations of the same mistake, and data-type edge cases. Do not skip edge cases: null comparisons, empty strings, zero vs null, unauthenticated callers, boundary values. **Done when:** every expansion axis is enumerated including edge cases.
3. **Write an exact-match pattern.** Write a ripgrep, Semgrep, or CodeQL pattern that matches ONLY the known bug location. Run it; confirm it hits the known instance and nothing else. A pattern that matches zero locations means the root cause is misunderstood; stop and report that before building on it. **Done when:** the pattern hits the known bug location and nothing else.
4. **Generalize one element at a time.** From the exact match, climb the abstraction ladder: variable names, then surrounding structure, then semantics. Make one change per iteration. Run the pattern after each change. If more than half the matches are noise, stop and revert that change. Record every pattern tried with its match count, true-positive count, and false-positive count. **Done when:** the generalized pattern is stable with ≤50% false positives.
5. **Mode graph-seeding (when a program graph is available and the user wants graph-derived candidates):**
   1. Load the existing program graph with the graph tool's API and resolve the seed node against it. If no graph artifact exists, halt with `blocked: missing-graph-artifact` and direct the user to build one first (use build-program-graph). If the node is not found, halt with `blocked: node-not-found` and the supplied identifier; a malformed node object halts with `blocked: invalid node object`. **Done when:** the graph is loaded and the seed node is resolved.
   2. Compute the k-hop neighbor set around the seed node, capped at k=3. Record each neighbor with its hop distance, node id, and kind (function, method, class, module). **Done when:** the k-hop neighbor set is computed and recorded.
   3. Filter and bound the candidate set. Exclude the seed node itself, nodes already labeled as confirmed vulnerabilities in the graph, nodes outside the declared exclusion scope, and nodes with no textual or symbol-level content. Bound the total to 50 candidates; if exceeded, rank by degree centrality and truncate, documenting the truncation. If zero candidates remain after filtering, halt with `blocked: zero-candidates`. **Done when:** the candidate set is filtered and bounded to 50 or fewer.
   4. Rank each candidate across at least three distinct graph topology dimensions: degree centrality, clustering coefficient, path length from the seed node, and structural similarity to the seed. Each score is a float in [0, 1]; combine with the user's weighting preference or equal weights by default, and sort descending. Label every candidate a review target, never a confirmed vulnerability. Feed the ranked list directly into triage (step 6); do not write a separate seed file. **Done when:** each candidate has scores from at least three dimensions, the list is sorted, and triage has the ranked candidates.
6. **Triage every candidate.** Read the surrounding function, callers, and types for each candidate, whether it came from pattern matches or graph seeding. Look specifically for guards, sanitizers, type constraints, or callers that never supply attacker-controlled input. Record the reason every ruled-out candidate is safe. Attach severity and confidence to every verdict. **Done when:** every candidate is triaged with a verdict, severity, and confidence.
7. **Write the report.** Produce a variant report containing: root cause statement, original location, methodology table (pattern version, tool, matches, TP, FP), confirmed findings with evidence, false-positive table grouped by reason, and a CI-ready regression rule derived from the pattern that found the most variants. In graph-seeding mode the methodology section also names the seed node, the k-hop bound, the ranking dimensions with weights, and any truncation. **Done when:** the report contains all six sections with evidence.

## Failure and recovery
| Failure class | Result |
|---|---|
| No root cause or original location supplied | Stop; return `blocked: root cause and original location required`. |
| Exact pattern matches zero locations | Stop; return `blocked: pattern does not match known bug`. |
| Pattern generalization produces >50% false positives | Revert to previous pattern level; record the regression in the report. |
| Tool unavailable (ripgrep, Semgrep, CodeQL) | Fall back to the next available tool in the stated preference order; document the fallback in the report. |
| Missing graph artifact (graph-seeding) | Halt; return `blocked: missing-graph-artifact`; direct the user to build a program graph first; write nothing. |
| Node not found in graph | Halt; return `blocked: node-not-found` with the supplied identifier; write nothing. |
| Malformed node object | Halt; return `blocked: invalid node object`; write nothing. |
| Zero candidates after filtering | Halt; return `blocked: zero-candidates`; write nothing. |
| Candidate bound exceeded before triage | Truncate by degree centrality and document the truncation in the report. |
| Candidate count exceeds 200 before triage | Triage the first 200; document the remainder as not assessed in the report header. |
| Write failure | Stop; do not emit a partial report. Return `blocked: write failed`. |

Partial-result rule: if the write step fails after steps 1–6 succeed, delete any partially written file and return the failure class above.
Rollback: any written artifact is reversed by deleting the named report and any regression rule file from the working directory.

## Output
A local variant report with root cause statement, original location, methodology table, confirmed findings (severity-rated with evidence), false-positive table grouped by reason, and a CI-ready regression rule. In graph-seeding mode the report also carries the seed node, the k-hop bound, the ranking dimensions with weights, and any truncation.
