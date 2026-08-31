---
name: variant-neighborhood-seeding
description: 'Use when a confirmed or plausible issue maps to a Trailmark node and the user needs a ranked handoff packet of graph-neighborhood review targets, exclusion rationale, and search guidance. Not for searching codebase manifestations of a root cause — use variant-hunt.'
---

# Variant neighborhood seeding

## Contract

| Field | Bound contract |
|---|---|
| Trigger | One confirmed or plausible issue binds to a Trailmark node and the user needs graph-derived review targets to seed variant analysis, Semgrep, CodeQL, or manual review. |
| Authority | `reversible-local`: write only named local artifact `variant-neighborhood-seed.md` in the current working directory. Delete or edit by hand to reverse. |
| Side effect | Writes `variant-neighborhood-seed.md` containing a ranked candidate list, inclusion reasons, explicit exclusions, and search guidance. No other file is modified. |
| Done | Candidates are bounded, ranked across distinct graph dimensions, labeled as review targets (not vulnerabilities), and exclusions plus handoff guidance are explicit in the artifact. |

## Inputs

Required:
- A Trailmark node identifier or full node object that the confirmed or plausible issue binds to.
- The project codebase reachable from the current working directory.

Optional:
- A rank-weighting preference (default: equal weight across dimensions).
- An explicit exclusion scope (default: none; include all neighbors within bounds).

## Procedure

1. **Receive the Trailmark node.** Accept a node identifier or the full node object. Reject if neither is supplied. Validate the identifier or object structure at the trust boundary; do not proceed on malformed input. **Done when:** the node is validated and accepted.
2. **Determine graph scope.** Query the local graph for direct and k-hop neighbors of the received node. Cap k at 3. If no graph is reachable, emit `fog` for graph-derived evidence and continue from the node object alone. **Done when:** the neighbor set is queried or `fog` is emitted.
3. **Filter and bound candidates.** Exclude nodes that are: the seed node itself, nodes already labeled as confirmed vulnerabilities in the graph, nodes outside the declared exclusion scope, and nodes with no textual or symbol-level content. Bound the total to 50 candidates maximum; if exceeded, rank by degree centrality and truncate. **Done when:** the candidate set is filtered and bounded to ≤50.
4. **Score across graph dimensions.** Choose at least three distinct dimensions from the graph topology: degree centrality, clustering coefficient, path length from the seed node, and structural similarity to the seed. Each score is a float in [0, 1]. **Done when:** each candidate has scores from at least three dimensions.
5. **Label each candidate.** Assign each candidate the label `review-target` in the output. Do not label any candidate as `vulnerability` or `confirmed-defect`. **Done when:** every candidate is labeled `review-target`.
6. **Record inclusion reason.** For each candidate, write one concrete reason from the graph evidence. State which dimension drove the ranking, what structural property was observed, and why the candidate is in scope. **Done when:** every candidate has a concrete inclusion reason.
7. **Record explicit exclusions.** List every node that was considered and excluded, with the concrete reason for exclusion. If no exclusions were made, state that explicitly. **Done when:** every excluded node is listed with its reason, or the explicit "none excluded" statement is present.
8. **Emit search guidance.** For each of the top 10 candidates, provide at least one concrete search-guidance line: a Semgrep rule pattern, a CodeQL query fragment, or a precise manual-review instruction. Guidance must reference the candidate's symbol or text content, not the seed node alone. **Done when:** each top-10 candidate has at least one search-guidance line.
9. **Assemble the handoff packet.** Write `variant-neighborhood-seed.md` with the following ordered sections: Seed Node, Candidate Rank Table (rank, node-id, primary-dimension-score, label), Inclusion Reasons (per candidate), Exclusions (list with reasons), and Search Guidance (per candidate). The artifact must be self-contained and require no external reference to interpret. **Done when:** the artifact is written with all five ordered sections.

## Failure and recovery
| Failure class | Result |
|---|---|
| No seed node supplied | Stop; return `blocked: seed node required`. Do not write an artifact. |
| Malformed node object | Stop; return `blocked: invalid node object`. Do not write an artifact. |
| No graph reachable | Write artifact with `fog` for graph-derived evidence; procedure continues from node object. |
| Candidate bound exceeded | Truncate by degree centrality; document truncation in the artifact header. |
| Write failure | Stop; do not emit a partial artifact. Return `blocked: write failed`. |
| Zero candidates after filtering | Return `fog: no review targets within graph bounds`; do not write an artifact. |

Partial-result rule: if step 9 fails after steps 1–8 succeed, delete any partially written file and return the failure class above.
Rollback: delete `variant-neighborhood-seed.md` from the working directory to reverse any artifact write.

## Output
A local file `variant-neighborhood-seed.md` with ordered sections: Seed Node, Candidate Rank Table, Inclusion Reasons, Exclusions, and Search Guidance.

## Provenance

Adapted from `trailmark-variant-neighborhood` (Trail of Bits, CC-BY-SA-4.0). Source: https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3/plugins/trailmark/skills/trailmark-variant-neighborhood. Pinned revision: `d1f1575cff97816e5cc08af66cd2506099c681d3`. Adaptation: scoped to emit review-target seeds only (not asserted variants, semantic root-cause search, or CI rules); removed dependency on other Trailmark skills; authority restricted to `reversible-local` local artifact write; graph scope capped and bounded. Attribution preserved per license. Modifications marked inline.
