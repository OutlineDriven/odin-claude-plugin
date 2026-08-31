---
name: watch-for
description: 'Use when the user wants to monitor a file, log, endpoint, or stateful artifact for drift, errors, or unexpected changes and receive a per-tick anomaly verdict. Don''t use for tasks that require source or remote-system changes.'
---

# Watch for

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to observe a changing surface and receive a judgment on anomalies. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Local read of the bounded changing surface being observed. |
| Done | An anomaly judgment is emitted each tick; watcher runs until manual stop or supplied stop condition. |

## Inputs

1. **Surface** (required): the file, URL, log, or artifact to observe. Declare its path or address once; do not widen scope during the watch.
2. **Anomaly criteria** (required): the condition, pattern, threshold, or structural rule that classifies a sampled state as anomalous. State it in falsifiable terms.
3. **Stop condition** (optional): a predicate that ends the watch automatically. If omitted, the watch runs until the user manually stops it.

## Procedure

1. Bound the surface. Record the surface address and anomaly criteria. Refuse to observe anything outside this declared scope. Done when: surface address and anomaly criteria are recorded.
2. Capture baseline. Read the surface once. Record the initial state as the baseline snapshot. Done when: baseline snapshot is recorded.
3. Sample. Read the surface at each tick. If the surface is unreadable, emit an error judgment and wait for the next tick rather than widening scope. Done when: a sample is read or an error judgment is emitted.
4. Compare. Diff the current sample against the baseline using the anomaly criteria. Classify the sample as normal or anomalous. Done when: sample is classified.
5. Emit judgment. If anomalous, emit a judgment containing: surface address, timestamp, what changed, why it matches the anomaly criteria, and severity (informational, warning, critical). If normal, emit a brief no-anomaly confirmation. Done when: judgment is emitted.
6. Update baseline. Set the current sample as the new baseline for the next comparison cycle. Done when: baseline is updated.
7. Check stop. If the user signals stop or the optional stop condition is met, end the watch and emit a final summary: total ticks, anomalies found, and final surface state. Otherwise, repeat from step 3. Done when: stop is detected and final summary is emitted, or the next tick begins.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Surface unreadable | Emit an error judgment naming the surface and failure reason. Wait for the next tick. Do not widen scope or invent data. |
| Stale sample | Mark the judgment as stale-data. Continue watching. Do not suppress the tick. |
| Scope-widening request | Refuse. The surface was bounded at step 1. Report the refusal and continue on the declared surface. |
| Stop condition unreachable | If the stop condition depends on an external system that fails, emit a warning and continue until manual stop. |

No failure class causes the watcher to pretend the done predicate holds. Every tick produces a judgment or an explicit error.

## Output
A stream of per-tick judgments (surface address, timestamp, classification: normal/anomalous/error/stale, what changed or why the read failed, severity if anomalous), with a final summary on stop: total ticks, anomaly count, and final surface state.
