---
name: complexity-grill
description: 'Use when a user wants to identify the true sources of complexity qualitatively before counting metrics. Returns a qualitative complexity-source report with ranked root causes before any metric is counted. Don''t use for tasks that require source or remote-system changes.'
---

# Complexity grill

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to identify the true sources of complexity qualitatively before counting metrics. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only: a qualitative complexity-source report with ranked root causes. |
| Done | True complexity sources are identified qualitatively and ranked before any metric is counted. |

## Inputs

The code region, module, or design surface to analyze must be supplied. Optional: a named concern to weight (coupling, hidden state, leaky abstraction, special-case proliferation, accidental concurrency, premature generality, indirection exceeding what it hides). No metric input is accepted before the qualitative ranking is settled.

## Procedure

1. Bound scope to the named region and read it. Do not mutate anything.
2. Enumerate candidate complexity sources qualitatively. For each, state where it lives and what effort it forces: coupling that blocks independent change, hidden state that must be tracked by hand, leaky abstractions, special-case proliferation, accidental concurrency, premature generality, or indirection that exceeds the complexity it hides.
3. Rank candidates by the real cognitive or maintenance effort they force, not by any numeric metric. Tie-break by root-causedness: a source that produces other sources ranks above a symptom it creates.
4. Only after the qualitative ranking is settled, optionally attach a metric to confirm a ranked source. Metrics confirm; they never discover, reorder, or lead the ranking. If no metric is available, the ranking stands on its qualitative evidence.
5. Return the ranked report.

## Failure and recovery
- Metrics-first: if a numeric metric is introduced before the ranking is settled, discard it, return to step 2, and re-rank qualitatively.
- Symptom-as-root: if a ranked source is itself produced by a deeper source, demote it, promote the deeper source, and re-rank.
- Unbounded scope: if the region cannot be read in one pass, narrow to a named sub-region and state the narrowing. Never widen scope to force a result.
- Boundary breach: if any edit or mutation is attempted, stop and report the read-only breach. No partial mutation is retained.

## Output
A qualitative complexity-source report: an ordered list of root causes, each naming its location, the effort it forces, and whether a deeper source produces it. Any metric appears only as a confirmation footnote after the ranking, never as a ranked entry.

## Provenance

Origin: `project-owned:user-curated-skill-ideas`, entry `complexity-grill` ("identify the true sources of complexity qualitatively before counting metrics"), supplemented by the raw Korean source at `project-owned:user-supplied-source-brief`. No upstream revision or third-party license pin; project-owned user-curated brief. Adapted into a self-contained read-only qualitative-analysis procedure that preserves the metrics-after-ranking mechanism.
