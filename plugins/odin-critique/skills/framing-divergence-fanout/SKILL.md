---
name: framing-divergence-fanout
description: 'Use when a user suspects the current direction is tunnel-visioned or inherited its framing: spawn 2-5 independent reads, classify each, cluster by shared root, and surface divergent-incompatible reads first. Not for framing-bias checks on a question — use prism.'
---

# Framing divergence fanout

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User invokes a check that the current direction is tunnel-visioned or inherited its framing |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | None. Bounded fresh sub-sessions used only as inputs to classification. |
| Done | Bait stripped from the direction statement; every read classified incompatible/compatible/convergent; shared-root clustering complete; divergent-incompatible reads listed first; convergent reads labeled reassurance only; no consensus wording present. |

## Inputs

- Direction of work (required): the current plan, approach, or framing the user wants stress-tested.
- Context (optional): background material that may inform the reads but must not constrain them to a single frame.

## Procedure

1. **Strip bait.** Remove leading, suggestive, or conclusory language from the direction statement. Restate it as a neutral description of what is being attempted and why, preserving the decision's substance without its rhetorical frame. Done when: the direction statement is restated in neutral terms with bait removed.
2. **Fan out 2-5 reads.** Spawn between 2 and 5 independent sub-sessions. Each read examines the stripped direction from a distinct vantage point (e.g., opposing assumption, adjacent domain, historical failure mode, resource constraint, user-population segment). No read may copy or restate another. No majority vote, no averaging, no consensus synthesis across reads. Done when: 2 to 5 independent reads are spawned from distinct vantage points.
3. **Classify each read.** Assign exactly one label to every completed read:
   - Incompatible: the read identifies a framing flaw, hidden assumption, or outcome that contradicts the direction's intent.
   - Compatible: the read accepts the direction's goal but proposes a meaningfully different path or emphasis.
   - Convergent: the read independently arrives at the same framing as the direction.
   Done when: every completed read has exactly one classification label.
4. **Cluster by shared root.** Group reads that share the same underlying assumption, evidence source, or structural concern. Label each cluster by its root. Reads with no shared root form single-member clusters. Done when: every read is assigned to a cluster with its root labeled.
5. **Order the report.** List divergent-incompatible clusters first, then compatible clusters, then convergent clusters. Within each cluster, order by relevance to the direction's core claim. Done when: the report is ordered incompatible-first, compatible second, convergent last.
6. **Label convergence as reassurance.** Every convergent read or cluster carries the explicit note: "Convergent = reassurance, not validation. It confirms the framing was inherited, not chosen." Do not use the words consensus, agreement, majority, or weight when describing the reads collectively. Done when: every convergent read carries the reassurance label and no consensus wording is present.

## Failure and recovery
- Fewer than 2 distinct reads produced: stop. Report the single read with its classification. Do not pad with variations of the same vantage point.
- Read classification ambiguous: mark the read as ambiguous with a one-sentence explanation. Do not force-fit it into a category.
- Consensus language detected in output: rewrite the affected sentence. Replace any phrasing that implies the reads collectively agree or disagree with per-read or per-cluster attribution.
- Direction statement cannot be stripped: proceed with the original statement and note which bait elements could not be removed.

## Output
A structured report containing:
1. The stripped direction statement.
2. Each read with its classification label and a one-sentence summary.
3. Shared-root cluster map (cluster root → member reads).
4. Ordered presentation: divergent-incompatible first, compatible second, convergent last.
5. Convergence-reassurance label on every convergent read.
6. No consensus, agreement, majority, or weight language anywhere in the report.
