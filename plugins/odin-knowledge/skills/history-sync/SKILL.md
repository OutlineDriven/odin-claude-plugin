---
name: history-sync
description: 'Use when the user requests memory transfer to or from a named peer. Not for recalling a session: use history-recall. Not for store registration: use history-source-registry.'
disable-model-invocation: true
---

# History sync

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user explicitly requests memory transfer to or from their own named peer machine. |
| Authority | Remote: syncs redacted JSONL batches between named peer machines using credentials; requires explicit human invocation. Previews the named peer, direction, record range, exclusions, files, watermark changes, and remote consequences before proceeding. Do not sync an unnamed peer or infer consent. |
| Side effect | Write only redacted static JSONL batches, import their records, and advance the applicable per-peer watermark after confirmed import. Never expose, copy, mount, or make writable a live remote history database. |
| Done | Only records newer than the applicable watermark were exported; redaction and exclusions were applied before a batch crossed the machine boundary; import deduplicated records idempotently; imported records cannot be re-exported; a push-only peer yielded an explicit empty pull; stored alias spelling was preserved; and the resulting watermark and counts were confirmed. |

## Inputs

Required: the user-named peer, transfer direction (`push` or `pull`), the local history store, the peer configuration containing its stable identity, stored aliases, transfer mode, endpoint, and per-peer watermarks, plus the redaction and exclusion policy. The peer must belong to the user.

For a push, require a destination authorized to receive a static JSONL batch. For a pull, require an authorized static JSONL batch from the named peer. Credentials may be used only after the preview. Optional inputs are an explicit upper bound on the record range and a batch-size limit; absence of either does not authorize widening beyond records newer than the watermark.

## Procedure

1. Resolve the supplied peer name through the configured stable identity and aliases. Preserve every alias exactly as stored; use identity equivalence only for routing and deduplication, never to rewrite stored spelling. Reject an unknown, ambiguous, non-user-owned, or unnamed peer.
2. Validate the requested direction against the peer mode. For a pull from a push-only peer, return an explicit empty result with zero records and make no file, import, credential, or watermark change.
3. Read the applicable per-peer watermark and select only locally originated records newer than it for push, or only batch records newer than it for pull. Exclude records previously imported from any peer so they can never echo through a later export. Apply any supplied upper bound and batch-size limit without advancing past unprocessed records.
4. Before accessing credentials or writing data, present the resolved peer without changing its stored spelling, direction, selected range and count, exclusions, redaction policy, static batch path or destination, import target, and proposed watermark transition. Stop if these differ from the user's explicit request.
5. At the exporting boundary, apply the configured exclusions and redact each selected record before serializing it. Write only a static JSONL batch whose records retain the stable record identity and origin needed for deduplication and echo prevention. Do not expose or transfer the source database, a database handle, a writable database path, or an unredacted intermediate batch.
6. Transfer only that static batch to or from the resolved peer endpoint. Treat every received line as untrusted: require valid JSONL, the expected record fields and identities, allowed origin metadata, and conformance to the redaction and exclusion boundary. Reject the batch before import if any line fails.
7. Import valid records transactionally when the store supports it; otherwise record exact per-record outcomes. Deduplicate by the carried stable record identity, mark newly imported records with their origin so export selection excludes them, and leave existing duplicates unchanged. Re-importing the same batch must add zero records and alter no stored spelling.
8. Advance the applicable per-peer watermark only to the greatest contiguous record boundary whose transfer and import were confirmed. Never advance it for rejected, failed, unprocessed, or merely written records.
9. Confirm exported, imported, duplicate, excluded, redacted, and failed counts; the old and new watermark; preserved alias spelling; and absence of any live or writable remote database. Report success only when every Done condition is observed.

## Failure and recovery
- Peer or authority failure: unknown, ambiguous, unauthorized, or request-mismatched peer or direction stops before credentials and mutation. Return `blocked` with the rejected input and no widened target.
- Selection or policy failure: unreadable watermark, unavailable redaction or exclusion policy, or inability to distinguish imported records stops before batch creation. Return `blocked`; never export an uncertain or unredacted set.
- Batch or boundary failure: serialization, transfer, malformed JSONL, schema, origin, redaction, or exclusion failure rejects the affected batch before import. Do not fall back to database transfer or weaker validation.
- Import failure: roll back the import transaction when available. If atomic rollback is unavailable, stop immediately, preserve the batch, report exact successful, duplicate, and failed record identities and counts, and do not advance the watermark past the greatest contiguous confirmed boundary.
- Confirmation failure: if remote import or watermark state cannot be confirmed, return `partial` with the last confirmed boundary and make no success claim. Recovery is an idempotent retry of the same redacted static batch; deduplication must leave already imported records unchanged.

The terminal result is exactly one of `synced`, `empty`, `partial`, or `blocked`. Errors remain visible, and neither `partial` nor `blocked` satisfies the Done predicate.

## Output
Return the terminal classification; resolved peer and direction; static JSONL batch path or identifier when one was written; selected, exported, imported, duplicate, excluded, redacted, and failed counts; old and new per-peer watermark; exact partial boundary or blocker; confirmation that imported records are export-ineligible; confirmation that stored alias spelling was preserved; and confirmation that no live or writable remote database was exposed.
