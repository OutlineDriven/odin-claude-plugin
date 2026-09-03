---
name: variant-neighborhood-seeding
description: 'Use when a confirmed or plausible issue maps to a graph node and the user needs a ranked handoff packet of graph-neighborhood review targets to seed variant analysis. Produces a local markdown file with ranked candidates, exclusion rationale, and search guidance. Not for searching codebase manifestations of a root cause — use variant-hunt.'
---

# Variant neighborhood seeding

## Contract

| Field | Bound contract |
|---|---|
| Trigger | One confirmed or plausible issue binds to a graph node and the user needs graph-derived review targets to seed variant analysis, Semgrep, CodeQL, or manual review. |
| Authority | Read-only graph search. Local write of one neighborhood seed document in the current working directory. Delete or edit by hand to reverse. |
| Side effect | Writes one local markdown file containing a ranked candidate list, inclusion reasons, explicit exclusions, and search guidance. No other file is modified. |
| Done | Candidates are bounded, ranked across distinct graph dimensions, labeled as review targets (not vulnerabilities), and exclusions plus handoff guidance are explicit in the artifact. |

## Inputs

Required:
- A program graph already built for the target codebase, or a node mapping that identifies the seed node and its neighbors.
- A node identifier or full node object that the confirmed or plausible issue binds to.
- The project codebase reachable from the current working directory.

Optional:
- A rank-weighting preference (default: equal weight across dimensions).
- An explicit exclusion scope (default: none; include all neighbors within bounds).

## Procedure

1. **Acquire the graph and map the node.** Load the existing program graph with the graph tool's API. If no graph artifact exists, halt with failure state `missing-graph-artifact` and direct the user to build one first. Resolve the supplied node identifier against the graph. If the node is not found in the graph, halt with failure state `node-not-found`. Done when: the graph is loaded and the seed node is resolved.

2. **Compute the k-hop neighbor set.** Query the graph for all nodes within k hops of the seed node, capped at k=3. Record each neighbor with its hop distance, node id, and kind (function, method, class, module). Done when: the k-hop neighbor set is computed and recorded.

3. **Filter exclusions and bound the candidate set.** Exclude nodes that are: the seed node itself, nodes already labeled as confirmed vulnerabilities in the graph, nodes outside the declared exclusion scope, and nodes with no textual or symbol-level content. Bound the total to 50 candidates maximum; if exceeded, rank by degree centrality and truncate, documenting the truncation. If zero candidates remain after filtering, halt with failure state `zero-candidates`. Done when: the candidate set is filtered and bounded to 50 or fewer.

4. **Rank by topology dimensions.** Score each candidate across at least three distinct graph topology dimensions: degree centrality, clustering coefficient, path length from the seed node, and structural similarity to the seed. Each score is a float in [0, 1]. Combine scores using the user's weighting preference or equal weights by default. Sort candidates by combined score descending. Done when: each candidate has scores from at least three dimensions and the list is sorted.

5. **Write the ranked seed list to a local file.** Write `variant-neighborhood-seed.md` with the following ordered sections:
   - Seed Node: the node id, kind, and the issue that binds to it.
   - Candidate Rank Table: rank, node-id, primary-dimension-score, label (`review-target`).
   - Inclusion Reasons: per candidate, one concrete reason from the graph evidence stating which dimension drove the ranking, what structural property was observed, and why the candidate is in scope.
   - Exclusions: every node considered and excluded, with the concrete reason. If none were excluded, state that explicitly.
   - Search Guidance: for each of the top 10 candidates, at least one concrete search-guidance line (a Semgrep rule pattern, a CodeQL query fragment, or a precise manual-review instruction) referencing the candidate's symbol or text content.
   The artifact must be self-contained and require no external reference to interpret. Done when: the file is written with all five ordered sections.

## Failure and recovery

| Failure class | Result |
|---|---|
| Missing graph artifact | Halt. Return `blocked: missing-graph-artifact`. Direct the user to build a program graph first. Do not write an artifact. |
| Node not found in graph | Halt. Return `blocked: node-not-found` with the supplied identifier. Do not write an artifact. |
| Zero candidates after filtering | Halt. Return `blocked: zero-candidates`. Do not write an artifact. |
| Malformed node object | Halt. Return `blocked: invalid node object`. Do not write an artifact. |
| Candidate bound exceeded | Truncate by degree centrality. Document truncation in the artifact header. |
| Write failure | Halt. Do not emit a partial artifact. Return `blocked: write failed`. |

Rollback: delete `variant-neighborhood-seed.md` from the working directory.

## Output

A local file `variant-neighborhood-seed.md` with ordered sections: Seed Node, Candidate Rank Table, Inclusion Reasons, Exclusions, and Search Guidance.
