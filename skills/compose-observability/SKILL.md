---
name: compose-observability
description: 'Use when a user wants to add the smallest signal, cardinality, dashboard, and trace surface the system will keep. The minimal durable observability surface is in place. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

The target system or module to instrument. The existing observability stack, conventions, and any existing dashboard or alerting targets. The load-bearing failure modes or behaviors that must be visible to an operator. Existing dashboard or alerting targets are optional and reused when present.

## Procedure

1. Identify the smallest set of signals (metrics, logs, counters) that reveal the system's load-bearing failure modes and behaviors. Reject any signal that does not map to a decision an operator will act on.
2. Bound cardinality: choose labels and dimensions with finite, low-cardinality value sets. Reject user-supplied or unbounded identifiers as label values; bucket or drop them instead.
3. Add trace instrumentation that links the critical request path across the boundaries identified, keeping span count to the minimum that reconstructs the path.
4. Compose the dashboard that displays the chosen signals and traces grouped by the failure mode they reveal. Include no chart that no one will read.
5. Keep only the surface the system will maintain: delete any instrumentation, label, span, or panel that duplicates another or that no owner will keep current.
6. Verify the surface compiles, loads, and emits the intended signals against the running system or a representative test before declaring done.

## Failure and recovery
- Unbounded cardinality: if a proposed label has unbounded values, drop the label or bucket it; do not ship high-cardinality instrumentation.
- Duplicate signal: if a new signal duplicates an existing one, reuse the existing and do not add the duplicate.
- No owner for a panel or signal: remove it; a surface no one maintains is not durable.
- Partial result: if any component cannot be verified, ship only the verified components and report the unverified ones as blocked.
- Non-mutation and rollback: all changes are local reversible writes; no remote, credential, deployed, or published mutation. Revert any local file that fails verification.

## Output
A minimal, verified observability surface in the codebase: a bounded set of signals, a cardinality-bounded label scheme, a trace path across the critical boundaries, and a dashboard grouped by failure mode.

## Provenance

Origin `project-owned:user-curated-skill-ideas` (candidate `curated:curated-ideas:curated-047`); revision null; license null (project-owned). Adapted from the user-curated observability-instrumentation workflow into a self-contained, bounded procedure.
