---
name: history-forget
description: 'Use when the user human-confirmedly asks to remove a session or note from recall, this skill tombstones or excludes the record and atomically rebuilds the index so the record never re-ingests. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# History forget

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User explicitly and human-confirmedly asks to remove a session or note from recall. |
| Authority | Reversible local writes only — tombstones, exclusions, and an atomic index rebuild; no deletion of source records. |
| Side effect | Writes tombstones or exclusions to the local index overlay and atomically rebuilds the index before the effect takes hold; supports list and unforget. |
| Done | Tombstoned records never re-ingest; exclusions also block export; unforget reverses a tombstone; the rebuild completes atomically before effect; stale exclusions are narrated. |

## Inputs

The target session or note identifier to forget, unforget, or inspect. The operation mode: forget, list, or unforget. A human-confirmed target identifier must be supplied for forget and unforget; list takes no target.

## Procedure

1. Require a human-confirmed request naming one concrete session or note identifier; if confirmation is absent or the target is ambiguous, stop before any write.
2. Bound scope to the named record only; do not read or mutate unrelated records or the underlying source files.
3. For forget: write a tombstone overlay marker for the target record, or add it to the exclusion set, without deleting the source record.
4. Atomically rebuild the index so the tombstone or exclusion is in effect before any recall query can observe the record; the rebuild must complete before the effect is reported.
5. For list: enumerate current tombstones and exclusions, and narrate any stale exclusion whose target no longer exists rather than silently dropping it.
6. For unforget: remove the tombstone for the named record and atomically rebuild the index, reversing the forget.
7. Verify the done predicate holds: the record no longer re-ingests on recall, exclusions also block export, and the rebuild is reported complete.

## Failure and recovery
- Unconfirmed or ambiguous request: stop, do not write; request human confirmation or a disambiguating target.
- Rebuild failure: abort the effect, discard the partial rebuild, and leave the index in its pre-mutation state; never report done.
- Stale exclusion: narrate it during list; do not silently remove it.
- Blocked or non-converged result: report the exact record, the failed step, and that the index was not changed; do not swallow the error or pretend the done predicate holds.

## Output
A terminal report naming the operation performed (forget, list, or unforget), the affected record, whether the atomic rebuild completed, and any stale exclusions narrated. For list, the full enumeration of current tombstones and exclusions.

## Provenance

Adapted from the runForget tombstone mechanism and the cmdIndex exclusion-changed notice in cmd/deja/main.go, and the local-writes security model in docs/SECURITY-MODEL.md, of github.com/vshulcz/deja-vu at revision 6f766fd4716edcaf24662c794368e420e5058f47. License: MIT, Copyright (c) 2026 Vladislav Shulcz; the copyright and permission notice are retained. Mechanisms rewritten in ODIN style; no third-party expression is copied.
