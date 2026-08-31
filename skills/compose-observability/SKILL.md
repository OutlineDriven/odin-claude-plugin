---
name: compose-observability
description: 'Use when a user wants to add the smallest signal, cardinality, dashboard, and trace surface the system will keep. The minimal durable observability surface is in place. No remote, credential, publish, deploy, or irreversible mutation.'
---

# Compose observability

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to add the smallest signal, cardinality, dashboard, and trace surface the system will keep. |
| Authority | Write only named local instrumentation, dashboard, and trace configuration in the codebase; rollback is reverting the local files. |
| Side effect | Instrumentation, dashboard, and trace configuration added to the codebase; no remote, credential, deployed, or published mutation. |
| Done | The minimal durable observability surface (signals, cardinality, dashboard, trace) is in place. |

## Inputs

Supply the target system or module, the existing observability stack and conventions, and the load-bearing failure modes or behaviors that an operator must see. Dashboard and alerting targets are optional; reuse them when present.

## Procedure

1. Identify the smallest set of signals (metrics, logs, counters) that reveal the system's load-bearing failure modes and behaviors. Reject any signal that does not map to a decision an operator will act on. Done when: every signal maps to an operator action or is rejected.
2. Bound cardinality: choose labels and dimensions with finite, low-cardinality value sets. Reject user-supplied or unbounded identifiers as label values; bucket or drop them instead. Done when: every label has a finite, low-cardinality value set or is bucketed/dropped.
3. Add trace instrumentation that links the critical request path across the boundaries identified, keeping span count to the minimum that reconstructs the path. Done when: the critical path is traced with minimum span count.
4. Build the dashboard around the failure modes revealed by the chosen signals and traces. Omit charts no one will read. Done when: every dashboard panel maps to a failure mode and no unread panel remains.
5. Keep only the surface the system will maintain: delete any instrumentation, label, span, or panel that duplicates another or that no owner will keep current. Done when: no duplicate or unowned surface remains.
6. Verify the surface compiles, loads, and emits the intended signals against the running system or a representative test before declaring done. Done when: the surface compiles, loads, and emits intended signals.

## Failure and recovery

- Unbounded cardinality: if a proposed label has unbounded values, drop the label or bucket it; do not ship high-cardinality instrumentation.
- Duplicate signal: if a new signal duplicates an existing one, reuse the existing and do not add the duplicate.
- No owner for a panel or signal: remove it; a surface no one maintains is not durable.
- Partial result: if any component cannot be verified, ship only the verified components and report the unverified ones as blocked.
- Non-mutation and rollback: all changes are local reversible writes; no remote, credential, deployed, or published mutation. Revert any local file that fails verification.

## Output

Minimal verified observability surface in the codebase: bounded signals, cardinality-bounded label scheme, trace path across critical boundaries, dashboard grouped by failure mode.
