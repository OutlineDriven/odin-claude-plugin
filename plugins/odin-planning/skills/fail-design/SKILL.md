---
name: fail-design
description: 'Use when a user wants to define failure states, recovery actions, bypasses, and degraded modes for a component during design. Not for runtime recovery.'
---

# Fail design

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to define failure states, recovery, bypasses, and degraded modes at design time for a component. |
| Authority | Reversible local: writes only a failure-state design document and degraded-mode specifications; rollback is deleting those artifacts. No remote mutation. |
| Side effect | Local write of a failure-state design document. |
| Done | A local failure-state design document exists, mapping every bounded failure state to a recovery action, bypass, or degraded mode. |

## Inputs

Required: the design artifact or component under design (spec, plan, architecture sketch, or named subsystem).

Optional: known constraints, SLAs, dependencies, and prior failure history.

## Procedure

1. Establish the system boundary and identify all reachable failure states. The boundary names what is inside the component, what is outside (dependencies, callers, infrastructure), and what crosses the boundary. Enumerate failure states by walking every boundary crossing: input violations, dependency outages, resource exhaustion, partial data loss, and timeout. The enumeration is closed when every boundary crossing has been examined for its failure mode. Done when: the boundary is stated and every reachable failure state is named.

2. Define a specific recovery action or an explicit bypass for each failure state. A recovery action names what the component does (retry, fallback, circuit break, shed load, fail closed). A bypass names which path is taken when a dependency is unavailable and what correctness or consistency it sacrifices. Every failure state gets exactly one: a recovery action or a bypass. Done when: every enumerated failure state has a named recovery action or bypass with its trade-off.

3. Specify the degraded mode and its user-visible signal for each failure state. Name which features are reduced, disabled, or served from stale data, and the signal that tells the user degradation is active. A failure state that has a bypass or recovery action still needs a degraded-mode specification for the case where the recovery or bypass itself fails. Done when: every failure state has a degraded mode with its user-visible signal.

4. Consolidate these definitions into a single local design document. The document maps each failure state to its recovery action or bypass, its degraded mode, and its user-visible signal. Done when: the design document carries every failure state with its recovery, bypass, and degraded mode, and no implementation code is written.

## Failure and recovery

- Unenumerated failure state: stop and report the gap. Do not invent a recovery for a state not yet identified.
- Contradictory recovery actions: if two failure states demand mutually exclusive actions, record the conflict and prompt the user to resolve it. Do not silently pick one.
- Scope creep: if the request shifts to runtime recovery or implementation, stop. This skill defines failure at design time; it does not execute recovery or write production code.
- Partial result: emit the design document with the failure states covered so far and an explicit list of uncovered states. The done predicate does not hold until the uncovered list is empty.

## Output

A failure-state design document containing the system boundary, every enumerated failure state, the recovery action or bypass for each with its trade-off, and the degraded-mode specification with its user-visible signal for each.
