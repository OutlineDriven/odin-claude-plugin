---
name: history-forget
description: 'Use when the user human-confirmedly asks to remove a session or note from recall. Writes a concrete exclusion or tombstone marker to a local overlay schema, atomically rebuilds the recall index, and supports unforget and list. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# History forget

Reversibly remove a memory or session from recall and export.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User explicitly and human-confirmedly asks to remove a session or note from recall, or asks to list or reverse a prior forget. |
| Authority | Reversible local writes to a defined history index overlay; rollback by removing the marker. No deletion of source records. |
| Side effect | Writes tombstone or exclusion markers to the local index overlay and atomically rebuilds the index before the effect takes hold. |
| Done | The target record no longer appears in recall; exclusions also block export; the atomic rebuild is confirmed; stale exclusions are narrated during list. |

## Inputs

- Target identifier (required for forget and unforget): the session or note identifier to forget, unforget, or inspect. Must be human-confirmed.
- Operation mode (required): one of `forget`, `unforget`, or `list`. `list` takes no target.
- Explicit human confirmation (required for forget and unforget): the user must confirm the exact target identifier before any write.

## Overlay schema

The exclusion overlay lives at `$HISTORY_DIR/overlay/exclusions.jsonl`. Each line is:

```json
{"id": "<session-or-note-id>", "mode": "exclude", "ts": "<RFC3339>", "reason": "<user-stated>"}
```

The tombstone overlay lives at `$HISTORY_DIR/overlay/tombstones.jsonl`. Each line is:

```json
{"id": "<session-or-note-id>", "ts": "<RFC3339>", "reason": "<user-stated>"}
```

`$HISTORY_DIR` is the same directory the recall index reads from. If the environment variable is unset, stop and ask the user for the history directory path.

## Procedure

1. **Require human confirmation.** For `forget` and `unforget`, require a human-confirmed request naming one concrete session or note identifier. If confirmation is absent or the target is ambiguous, stop before any write. Done when: the target is confirmed and unambiguous, or the run stopped.
2. **Bound scope.** Bound scope to the named record only. Do not read or mutate unrelated records or the underlying source files. Done when: the scope boundary is stated and no out-of-scope target is queued.
3. **Write the marker.** For `forget`: append a tombstone or exclusion entry to the corresponding overlay file. An exclusion blocks both recall and export; a tombstone blocks recall only. Write the entry atomically (write to a temporary file, then rename). Done when: the marker is written and confirmed by reading it back.
4. **Atomically rebuild the index.** Rebuild the recall index so the tombstone or exclusion is in effect before any recall query can observe the record. The rebuild must complete before the effect is reported. Done when: the rebuild completes and the record is confirmed absent from a recall query.
5. **For unforget**: remove the matching tombstone or exclusion entry from the overlay file (rewrite the file without the entry), then atomically rebuild the index. Done when: the marker is removed and the rebuild completes.
6. **For list**: enumerate current tombstones and exclusions from the overlay files. Narrate any stale exclusion whose target no longer exists rather than silently dropping it. Done when: the full enumeration is returned with stale markers narrated.
7. **Verify done.** Confirm the record no longer re-ingests on recall, exclusions also block export, and the rebuild is reported complete. Done when: all checks pass.

## Failure and recovery

- **Unconfirmed or ambiguous target**: stop, do not write. Request human confirmation or a disambiguating target.
- **`unconfirmed-target`**: the target was not human-confirmed. Stop before any write.
- **`rebuild-failed`**: abort the effect, discard the partial rebuild, and leave the index in its pre-mutation state. Never report done.
- **`blocked-non-converged`**: the index was not changed. Report the exact record, the failed step, and that the index was not changed.
- **Stale exclusion**: narrate it during list. Do not silently remove it.

## Output

A terminal report naming the operation performed (forget, unforget, or list), the affected record, whether the atomic rebuild completed, and any stale exclusions narrated. For list, the full enumeration of current tombstones and exclusions.
