---
name: watch-for
description: 'Use when monitoring a file, log, endpoint, or artifact for drift or errors, or polling a target until a predicate holds. Modes: watch (default), until. Not for source or remote-system changes.'
---

# Watch for

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to observe a changing surface and receive anomaly judgments, or poll a changing target until a completion predicate holds. |
| Authority | Read-only: local reads of the bounded surface at each sampling interval. No remote mutation. |
| Side effect | Local reads of the bounded surface; a terminal completion verdict in `until` mode. |
| Done | The stop condition is met and a final summary is emitted (`watch` mode), or a terminal classification is returned (`until` mode). |

## Inputs

- Mode (required): `watch` (default) or `until`.
- Surface address / Target (required): the file, URL, log, or artifact to observe or poll.
- Anomaly criteria (required for `watch`): the condition, pattern, threshold, or structural rule that classifies a sampled state as anomalous.
- Completion predicate (required for `until`): a falsifiable condition evaluated against the current observed state of the target each poll.
- Sampling / poll interval (required): time between reads, as a number of seconds, a cron expression, or an event-driven trigger name.
- Stop condition (required for `watch`): a predicate that ends the watch automatically, or an explicit tick count after which the watch stops.
- Deadline or maximum poll count (required for `until`): bounds the watch. The watch stops at whichever comes first.

## Procedure

1. Bound the surface and select the mode. Record the address, the interval, and the mode-specific control (anomaly criteria for `watch`, or completion predicate and deadline/max-poll for `until`). Refuse to observe anything outside the declared scope. Done when: mode, address, interval, and control are recorded.
2. Capture the initial state. Read the surface once. Done when: the baseline snapshot is recorded.
3. Wait the interval and sample the surface. If the surface is unreadable, emit an error judgment (`watch`) or stop and report `blocked` with the last known state (`until`); in `watch`, wait for the next interval rather than widening scope. Done when: a sample is read or an error/blocked judgment is emitted.
4. Evaluate the mode-specific condition.
   - Mode `watch`: compare the sample against the baseline using the anomaly criteria. Classify the sample as normal, anomalous, error, or stale. Emit a judgment containing the address, timestamp, what changed or why the read failed, and severity if anomalous. Update the baseline to the current sample.
   - Mode `until`: evaluate the completion predicate against the current observed state. If it holds, stop and report `predicate-holds` with the final state.
   Done when: a judgment is emitted or the predicate result is known.
5. Check the terminal condition.
   - Mode `watch`: if the stop condition is met, end and emit a final summary (total ticks, anomaly count, error count, final surface state). Otherwise repeat from step 3.
   - Mode `until`: if the deadline or maximum poll count is reached, stop and report `non-converged` with the last observed state and the number of polls performed. If the same two or more distinct states repeat in a cycle of 3 consecutive polls without the predicate holding, stop and report `non-converged` with the oscillation pattern. Otherwise repeat from step 3.
   Done when: a terminal result is emitted.

## Failure and recovery

| Failure class | Mode | Behavior |
|---|---|---|
| Surface unreadable | watch | Emit an error judgment naming the surface and failure reason. Wait for the next interval. Do not widen scope or invent data. |
| Stale sample | watch | Mark the judgment as stale-data. Continue watching. Do not suppress the tick. |
| Scope-widening requested | watch | Refuse. The surface was bounded at step 1. Report the refusal and continue on the declared surface. |
| Stop condition unreachable | watch | Emit a warning and continue until manual stop. |
| Target unreadable or disappeared | until | Stop. Report `blocked` with the read failure and the last known state. Do not restart or recreate the target. |
| Predicate unparseable or ambiguous | until | Stop. Report `blocked` with the ambiguity. Do not infer a different predicate. |
| Deadline or maximum poll count reached | until | Stop. Report `non-converged` with the last observed state and the number of polls performed. |
| Target state oscillates | until | Stop. Report `non-converged` with the oscillation pattern, the last observed state, and the oscillation count. |

No failure class causes the watcher to pretend the done predicate holds. Every poll produces a judgment or an explicit error.

## Output

- Mode `watch`: a stream of per-tick judgments (surface address, timestamp, classification: normal/anomalous/error/stale, what changed or why the read failed, severity if anomalous), with a final summary on stop: total ticks, anomaly count, error count, and final surface state.
- Mode `until`: one terminal classification: `predicate-holds` (with final observed state), `non-converged` (with last observed state, poll count, and the failure class that stopped it), or `blocked` (with the failure reason and last known state).
