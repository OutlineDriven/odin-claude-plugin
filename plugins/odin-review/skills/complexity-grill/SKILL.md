---
name: complexity-grill
description: 'Use when a user wants to identify the true sources of complexity qualitatively before counting metrics. Not for source or remote mutation.'
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

1. Bound scope to the named region and read it. Do not mutate anything. Done when: the region is read and scope is bounded.
2. Enumerate candidate complexity sources qualitatively. For each, state where it lives and what effort it forces: coupling that blocks independent change, hidden state that must be tracked by hand, leaky abstractions, special-case proliferation, accidental concurrency, premature generality, or indirection that exceeds the complexity it hides. Done when: every candidate source is named with its location and forced effort.
3. Rank candidates by the real cognitive or maintenance effort they force, not by any numeric metric. Break ties by root cause: a source that produces other sources ranks above a symptom it creates. Done when: candidates are ranked by effort with root-cause tie-breaking.
4. Only after the qualitative ranking is settled, optionally attach a metric to confirm a ranked source. Metrics confirm; they never discover, reorder, or lead the ranking. If no metric is available, the ranking stands on its qualitative evidence. Done when: a metric is attached as confirmation or the ranking stands on qualitative evidence alone.
5. Return the ranked report. Done when: the ranked report is returned.

## Failure and recovery

- Metrics-first: if a numeric metric is introduced before the ranking is settled, discard it, return to step 2, and re-rank qualitatively.
- Symptom-as-root: if a ranked source is itself produced by a deeper source, demote it, promote the deeper source, and re-rank.
- Unbounded scope: if the region cannot be read in one pass, narrow to a named sub-region and state the narrowing. Never widen scope to force a result.
- Boundary breach: if any edit or mutation is attempted, stop and report the read-only breach. No partial mutation is retained.

## Output

Ranked complexity-source report: ordered root causes, each naming its location, the effort it forces, and whether a deeper source produces it. Any metric appears only as a confirmation footnote after the ranking.
