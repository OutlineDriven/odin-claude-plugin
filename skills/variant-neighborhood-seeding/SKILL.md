---
name: variant-neighborhood-seeding
description: 'Use when one confirmed or plausible issue binds to a Trailmark node and the user needs a ranked graph-neighborhood handoff packet of review targets with exclusion rationale and search guidance. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

1. **Receive the Trailmark node.** Accept a node identifier or the full node object. Reject if neither is supplied. Validate the identifier or object structure at the trust boundary; do not proceed on malformed input.
2. **Determine graph scope.** Query the local graph for direct and k-hop neighbors of the received node. Cap k at 3. If no graph is reachable, emit `fog` for graph-derived evidence and continue from the node object alone.
3. **Filter and bound candidates.** Exclude nodes that are: the seed node itself, nodes already labeled as confirmed vulnerabilities in the graph, nodes outside the declared exclusion scope, and nodes with no textual or symbol-level content. Bound the total to 50 candidates maximum; if exceeded, rank by degree centrality and truncate.
4. **Score across graph dimensions.** Score each candidate on at least three distinct dimensions drawn from the graph topology: degree centrality, clustering coefficient, path length from the seed node, and structural similarity to the seed. Each score is a float in [0, 1].
5. **Label each candidate.** Assign each candidate the label `review-target` in the output. Do not label any candidate as `vulnerability` or `confirmed-defect`.
6. **Record inclusion reason.** For each candidate, write one concrete reason derived from the graph evidence: which dimension drove the ranking, what structural property was observed, and why the candidate is in scope.
7. **Record explicit exclusions.** List every node that was considered and excluded, with the concrete reason for exclusion. If no exclusions were made, state that explicitly.
8. **Emit search guidance.** For each of the top 10 candidates, provide at least one concrete search-guidance line: a Semgrep rule pattern, a CodeQL query fragment, or a precise manual-review instruction. Guidance must reference the candidate's symbol or text content, not the seed node alone.
9. **Assemble the handoff packet.** Write `variant-neighborhood-seed.md` with the following ordered sections: Seed Node, Candidate Rank Table (rank, node-id, primary-dimension-score, label), Inclusion Reasons (per candidate), Exclusions (list with reasons), and Search Guidance (per candidate). The artifact must be self-contained and require no external reference to interpret.

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
Rollback: any artifact written is reversed by deleting `variant-neighborhood-seed.md` from the working directory.

## Output
A local file `variant-neighborhood-seed.md` containing:
- Seed node identifier and binding context.
- Ranked candidate table with graph-dimension scores.
- Per-candidate inclusion reasons derived from graph evidence.
- Explicit exclusion list with reasons (or an explicit statement that none were excluded).
- Search guidance per top-10 candidate.

The artifact is the sole deliverable. No VCS commit, no remote mutation, no credential access.

## Provenance

Adapted from `trailmark-variant-neighborhood` (Trail of Bits, CC-BY-SA-4.0). Source: https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3/plugins/trailmark/skills/trailmark-variant-neighborhood. Pinned revision: `d1f1575cff97816e5cc08af66cd2506099c681d3`. Adaptation: scoped to emit review-target seeds only (not asserted variants, semantic root-cause search, or CI rules); removed dependency on other Trailmark skills; authority restricted to `reversible-local` local artifact write; graph scope capped and bounded. Attribution preserved per license. Modifications marked inline.
