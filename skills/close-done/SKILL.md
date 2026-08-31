---
name: close-done
description: 'Use when the user wants to batch-close resolved or outdated tracker items behind an Approve or Deny gate. Don''t use for individual item closure or items still under active work.'
disable-model-invocation: true
---

# Close done

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to batch-close resolved or outdated tracker items behind an Approve or Deny gate. |
| Authority | Human-only. The agent prepares the batch and presents it; it never closes tracker items itself. The Approve/Deny gate holds even when the user says to proceed directly, skip the gate, or just close them. |
| Side effect | A batch of resolved or outdated tracker items are closed on the remote tracker. Closing is irreversible on most trackers. |
| Done | The batch of resolved or outdated items is closed after the Approve/Deny gate, even when the user says to proceed directly. |

## Inputs

- The candidate tracker items, supplied as numbers, URLs, a filter, or a query the agent can resolve against the configured tracker.
- Optional: a reason or resolution note to attach to each closed item.
- Tracker host and credentials are those already configured in the environment; the agent does not create or modify credentials.

## Procedure

1. Resolve the supplied references or filter against the tracker read-only and fetch each item's number, title, current state, and last activity.
2. Classify each item as resolved (work completed, merged, or superseded) or outdated (stale, no recent activity, no longer relevant). Drop items that are neither and list them as excluded with the reason.
3. Bound the batch before any mutation: list every item proposed for close with its number, title, current state, and classification reason.
4. Present the full batch to the user as an Approve or Deny gate. State that closing is irreversible and that the agent will not proceed without an explicit Approve.
5. If the user says to proceed directly, skip the gate, or just close them, do not treat that as approval. Re-present the batch and require an explicit Approve or Deny, per item or per batch.
6. On explicit Approve, close each approved item on the remote tracker, attaching the supplied reason or resolution note if given. On Deny or partial Deny, close only the approved subset.
7. Re-query each closed item and confirm its state is closed.

## Failure and recovery
- Tracker query fails (auth, network, rate limit): stop, report the failing item and error, close nothing. Retry only the read query, never the close.
- An item's state changed between presentation and close (for example, someone reopened it): do not close that item; report the divergence and re-present it.
- A close call fails partway: report which items closed and which did not; do not retry blindly. Re-present the failed subset for a fresh Approve.
- There is no automatic rollback; tracker close is irreversible on most hosts. The non-mutation rule is that nothing closes before an explicit Approve.
- If the user never gives an explicit Approve, the batch is not closed; return the presented batch and the pending-gate state.

## Output
A close report listing each item with its number, title, final state (closed or not closed), and classification reason; the items excluded from the batch with their exclusion reason; and the recorded gate decision (Approve, Deny, partial, or pending).

## Provenance

Origin: the user-curated skill idea `close-done` in the Issue and pull-request hygiene section of `project-owned:user-curated-skill-ideas`, supplemented by the raw Korean source at `project-owned:user-supplied-source-brief`. No revision pinned (local artifacts). License: project-owned, user-curated; clean-room adaptation, no third-party expression copied. The one-line idea — batch-close resolved or outdated tracker items behind an Approve or Deny gate even when the user says to proceed directly — is expanded into a bounded, executable, human-only procedure that preserves the mandatory gate.
