---
name: schedule-dependency-waves
description: 'Use when work units carrying declared dependencies must be ordered into execution waves before any dispatch, including detecting a dependency cycle. Not for partitioning one issue into disjoint write sets: use diamond-task. Not for concerns with no dependencies: use parallel-launch.'
---

# Schedule dependency waves

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Work units with declared dependencies must be ordered before dispatch, or a dependency set must be checked for cycles. |
| Authority | Read-only on the work tree; writes only the named schedule artifact. Rollback is deleting that artifact. No remote mutation. Not a write-set partitioner and not a dispatcher. |
| Side effect | On an acyclic graph, one schedule artifact listing waves in topological order. On a cycle or a rejected edge, a named failure report and no schedule artifact. |
| Done | Every supplied unit appears in exactly one wave with all its dependencies in earlier waves, or a cycle is reported with the participating units named and no schedule emitted. |

## Inputs

- Work units (required): The set of units to schedule, each named as the caller names them. Supplied by the caller; the skill never invents units and never splits or merges them.
- Dependency edges (required): Declared edges, each from a unit to a unit it must follow. Only declared edges are used; nothing is inferred from file ownership, write sets, or presumed coupling.
- Schedule artifact path (required): The named local location for the schedule. No other write target is permitted.

## Procedure

1. **Collect the units and their declared dependency edges.** Build the dependency graph from the supplied units and edges only. Reject any edge whose endpoint is not a supplied unit: name the edge and its missing endpoint, emit no schedule, and leave the artifact path unwritten. A schedule built on a silently dropped edge marks work ready that is not. **Done when:** the graph contains exactly the supplied units and only edges whose both endpoints are supplied units, or every rejected edge is named and no schedule is emitted.

2. **Detect cycles before assigning any wave.** Run cycle detection over the graph. If a cycle exists, stop: name the participating units, emit no schedule, and leave the artifact path unwritten. A partial schedule that hides a cycle is worse than no schedule. **Done when:** the graph is shown acyclic, or the cycle members are named and no schedule is emitted.

3. **Assign each unit to the earliest wave after all its dependencies.** A unit's wave is one past the highest wave of its dependencies; units with no dependencies take wave one. Each unit lands in exactly one wave. **Done when:** every supplied unit is assigned to exactly one wave with all its dependencies in strictly earlier waves.

4. **Record the schedule artifact.** Write the named schedule artifact with the per-wave unit lists in topological order and, for each unit, the dependency edges that justify its placement. The artifact is the only write this skill makes. **Done when:** the artifact lists every wave in order, every unit in exactly one wave, and the justifying edges per unit.

5. **State which units are ready now.** Report wave one as the ready-now set: units with no dependencies in the supplied graph. **Done when:** the ready-now set is stated as wave one.

## Failure and recovery

- Cycle detected: Name the participating units, emit no schedule, and leave the artifact path unwritten. Suggest the caller repair the declared edges, then re-run on the corrected set. Never emit a partial schedule for a cyclic graph.
- Edge to an unknown unit: Reject the edge and name it with its missing endpoint. Do not silently drop it and do not guess a substitute unit. Re-run once the caller either supplies the missing unit or withdraws the edge.
- Empty unit set: Report that there is nothing to schedule rather than emitting an empty artifact. Leave the artifact path unwritten.
- Unreadable or duplicated unit names: Ask the caller to disambiguate before scheduling; duplicate names would place one unit in two waves and break the Done condition.

## Output

One schedule artifact at the named path: waves in topological order, each wave listing its units, each unit annotated with the dependency edges that justify its placement, plus the ready-now statement naming wave one. On a cycle, an unknown-endpoint edge, or an empty unit set: a named failure report with no schedule artifact written.
