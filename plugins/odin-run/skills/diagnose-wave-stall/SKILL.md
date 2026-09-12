---
name: diagnose-wave-stall
description: 'Use when a dispatched agent wave idles on a result that never arrives and the blocking node must be named and cleared. Not for a configured loop misbehaving: use diagnose-loop-health. Not for re-dispatching a known dead worker: use partition-scopes-to-subagents.'
---

# Diagnose wave stall

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A dispatched wave has stopped progressing and the blocking node is unknown. |
| Authority | Read-only diagnosis; writes only the named stall report. Cancelling or re-dispatching a node happens only on an explicit instruction recorded in the report. No remote mutation. |
| Side effect | A stall report naming the blocking node, its classification, and the clearing action taken or withheld. |
| Done | Every non-progressing node is classified (including unresolved) with evidence, and a blocking edge is named when one exists; otherwise a documented non-edge cause is recorded, or the wave is shown to be progressing and no stall exists. |

## Inputs

- Dispatched nodes (required): The wave's node list with handles or ids, and how to observe each node's live status. Supplied by the caller; if absent, stop and ask.
- Dependency edges (optional): The declared edges between nodes, if the wave was compiled from a map. Without them, blocking edges are reconstructed from each node's stated wait.
- Stall report path (required): Where the report is written. No other file is created or mutated.

This skill owns a dispatched wave blocked on a dependency edge. A configured loop whose setup soundness is questioned belongs to `diagnose-loop-health`; hand it there instead.

## Procedure

1. Enumerate dispatched nodes and their live status. For each node record its id, current state (running, exited, completed, unknown), and the observation evidence. **Done when:** every dispatched node carries a recorded live status with its evidence.

2. Separate still-working nodes from non-progressing ones. A node that is running and producing output is slow, not stalled; only a node with no observable progress across the observation window enters the non-progressing set. **Done when:** the two sets are partitioned and the non-progressing set is named.

3. Classify each non-progressing node into exactly one cause: dead worker (exited without returning a result), unsatisfiable input (waiting on an artifact no node in the wave produces), external limit (quota, rate limit, or credential), satisfied-but-unconsumed (its result exists but nothing consumes it), dependency cycle, or unresolved (the available evidence cannot determine the cause). Attach the evidence for each classification. **Done when:** every non-progressing node carries exactly one classification with evidence.

4. Name the blocking edge for each non-progressing node when one exists: which node, waiting on which artifact or result, produced by whom. For an edgeless cause such as an external limit or observation failure, record that non-edge cause and its evidence instead; do not invent a producer. **Done when:** every non-progressing node has a named edge or documented non-edge cause.

5. Choose the clearing action per class — re-dispatch for a dead worker, cut the edge for an unsatisfiable input, wait with a stated bound for an external limit, consume the result for satisfied-but-unconsumed — and record it in the stall report. This step is record-only: no procedure step re-dispatches, cuts an edge, waits on a bound, or consumes a result; a chosen action is executed only on an explicit caller instruction recorded in the report, outside this skill. **Done when:** every non-progressing node has its clearing action named in the report, or withheld where its class is unresolved.

6. Write the stall report to the named path: the partition, every classification with its evidence, every blocking edge, and every clearing action named or withheld. **Done when:** the report exists with all recorded classifications and named actions.

## Failure and recovery

- No stall found: report the wave as progressing and change nothing; write no stall report and take no clearing action.
- A cycle is discovered as the real cause: classify it as a dependency cycle, record the cycle evidence, do not emit a clearing action, and hand off to `schedule-dependency-waves` in the report.
- A class that cannot be determined: record the node as unresolved with the evidence inspected rather than guessing a clearing action; no action is taken on an unresolved node.
- Node status unreadable: record the node as unresolved rather than classify it as stalled; never swallow the observation error.

## Output

A stall report at the named path listing every non-progressing node with its classification, evidence, a blocking edge when one exists or a documented non-edge cause, and a clearing action named or withheld — the report names the chosen action and never executes one; execution follows only an explicit caller instruction recorded in the report. Or a progressing verdict with no artifact written when no stall exists.
