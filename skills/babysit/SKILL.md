---
name: babysit
description: 'Use when asked to poll a named changing job, log, or artifact until a supplied completion predicate becomes true. Report whether the predicate holds or the watch ended without convergence. Don''t use for tasks that require source or remote-system changes.'
---

# Babysit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to poll a changing job, log, or artifact until a supplied completion predicate becomes true. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Local reads of the named changing job, log, or artifact only. |
| Done | The supplied completion predicate has become true. |

## Inputs

- **Target** (required): the path, handle, or identifier of the changing job, log, or artifact to poll.
- **Completion predicate** (required): a falsifiable condition evaluated against the current observed state of the target each poll.
- **Poll interval** (optional): time between reads. If absent, use a sensible default for the target type.
- **Deadline or maximum poll count** (optional): bounds the watch. If absent, the watch runs until the predicate holds or a failure class stops it.

## Procedure

1. Confirm the target is readable and the completion predicate is unambiguous. If either is missing or unclear, stop and report the problem — do not guess.
2. Read the target surface. Do not write, modify, restart, or trigger anything.
3. Evaluate the completion predicate against the current observed state.
4. If the predicate holds, stop and report `predicate-holds` with the final observed state.
5. If the predicate does not hold, wait the poll interval and repeat from step 2.
6. Stop and report `non-converged` if any failure class in the next section is reached.

## Failure and recovery
- **Target unreadable or disappeared**: stop. Report the read failure and the last known state. Do not restart or recreate the target.
- **Predicate unparseable or ambiguous**: stop. Report the ambiguity. Do not infer a different predicate.
- **Deadline or maximum poll count reached**: stop. Report `non-converged` with the last observed state and the number of polls performed.
- **Target state oscillates without satisfying the predicate**: stop. Report `non-converged` with the oscillation pattern and the last observed state.
- No partial result is ever reported as success. The done predicate either holds or it does not.

## Output
One terminal classification:
- `predicate-holds` — the completion predicate is true; include the final observed state.
- `non-converged` — the watch stopped without the predicate holding; include the last observed state, poll count, and the failure class that stopped it.

## Provenance

- Origin: user-curated watcher workflow (curated-ideas:curated-030).
- Revision: none (local source, no pinned revision).
- License: project-owned; clean-room adaptation from the user's watcher family brief.
- Adaptation: normalized a generic watcher concept into a bounded read-only polling contract with an explicit completion predicate and named failure classes.
