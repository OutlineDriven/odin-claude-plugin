---
name: fail-design
description: 'Use when a user wants to define failure states, recovery, bypasses, and degraded modes during design. The outcome is a design document where failure states, recovery, bypasses, and degraded modes are defined at design time. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Fail design

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to define failure states, recovery, bypasses, and degraded modes during design. |
| Authority | Reversible local writes only: produce a failure-state design document and degraded-mode specifications. No code, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Local write of a failure-state design document and degraded-mode specifications. |
| Done | Failure states, recovery, bypasses, and degraded modes are defined at design time. |

## Inputs

- The design artifact or component under design (spec, plan, architecture sketch, or named subsystem). Required.
- Known constraints, SLAs, dependencies, and prior failure history, if available. Optional.

## Procedure

1. Enumerate the failure states the component can reach: input violations, dependency outages, resource exhaustion, partial data loss, and timeout.
2. For each failure state, define the recovery action: retry, fallback, circuit break, shed load, or fail closed.
3. Define each bypass: which path is taken when a dependency is unavailable and what correctness or consistency it sacrifices.
4. Define each degraded mode: which features are reduced, disabled, or served from stale data, and the user-visible signal that degradation is active.
5. Record the failure states, recovery actions, bypasses, and degraded modes in the design document so they are decided at design time rather than discovered at runtime.
6. Stop when every enumerated failure state has a named recovery, bypass, or degraded mode; do not implement the design or write production code.

## Failure and recovery
- Unenumerated failure state: stop and report the gap; do not invent a recovery for a state not yet identified.
- Contradictory recovery: if two failure states demand mutually exclusive actions, record the conflict and ask the human to resolve it; do not silently pick one.
- Scope creep: if the request shifts to runtime recovery, breakage surfacing, or implementation, stop; this skill defines failure at design time, it does not execute recovery or surface breakage.
- Partial result: emit the design document with the failure states covered so far and an explicit list of uncovered states; the done predicate does not hold until the uncovered list is empty.

## Output
A failure-state design document containing the enumerated failure states, the recovery action for each, the defined bypasses with their trade-offs, and the degraded-mode specifications with their user-visible signals.

## Provenance

Origin: user-curated design-time failure-engineering workflow recorded in the Skill Foundry curated-ideas source. Revision: null. License: null (project-owned). Adapted as a clean-room self-contained procedure; no third-party expression copied. The design-time definition boundary is distinct from runtime recovery and the fail-fast principle, expressed here as an operational scope limit rather than a dependency.
