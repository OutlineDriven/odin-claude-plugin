---
name: append-run-log
description: 'Use when a completed agent run must be recorded as durable, queryable evidence. Not for remote, credential, publish, deploy, or irreversible changes.'
disable-model-invocation: true
---

# Append run log

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A completed agent run must be recorded as durable, queryable evidence. |
| Authority | Reversible local: writes the run log, last-run pointer, and a same-directory temporary file during retention compaction; without retention it appends, and with retention it atomically removes expired entries while preserving retained lines byte-for-byte. Rollback is version control. No remote mutation. |
| Side effect | Appends one entry to the JSONL run log under an ISO-only date guard; when retention_window is supplied, atomically compacts away expired entries while preserving retained lines byte-for-byte, then updates the last-run pointer. |
| Done | Exactly one entry exists per run with a unique run id, malformed lines are ignored rather than corrupting the log, and aggregate metrics are derivable from the log alone. |

## Inputs

- `run_id`: must be supplied, non-empty, and unique within the log.
- `started_at` and `ended_at`: must be supplied as ISO 8601 UTC timestamps (`YYYY-MM-DDTHH:mm:ssZ`). The entry date guard is derived from `ended_at`.
- `metrics`: must be supplied as a JSON object of run measurements (for example, duration, token count, model, outcome). Aggregates are computed from these fields alone.
- `log_path`: must be supplied; path to the append-only JSONL run log.
- `last_run_pointer_path`: must be supplied; path to the last-run pointer file.
- `retention_window`: optional; an ISO 8601 duration or day count. When omitted, no pruning is performed.

## Procedure

1. Validate inputs at the trust boundary before any mutation: `run_id` is non-empty; `started_at` and `ended_at` parse as ISO 8601 UTC and `ended_at` is not before `started_at`; `metrics` is a JSON object. Reject any timestamp that is not ISO-only. Scan the log for an existing line whose parsed `run_id` equals the supplied one; if found, stop with `rejected-duplicate` and do not mutate. Done when: inputs parse and no duplicate `run_id` exists.
2. Choose the update path. Without `retention_window`, open `log_path` in append-only mode. With `retention_window`, prepare an atomic compaction using a same-directory temporary file; keep `log_path` unchanged until the replacement is complete, and remove incomplete temporary output on failure. Done when: the applicable path is selected.
3. Compose one JSONL entry as a single line: `run_id`, `started_at`, `ended_at`, `metrics`, and `date` set to the ISO date portion of `ended_at` as the date guard. Done when: the entry is a single line with all fields and metrics sufficient to derive aggregates.
4. Without `retention_window`, append the entry as exactly one newline-terminated line and flush; do not alter any prior line. With `retention_window`, add the entry to the staged compacted file instead of appending to `log_path`. Done when: exactly one line with this `run_id` will be present in the final log.
5. If `retention_window` is supplied, compute the cutoff from the current UTC date minus the window. Drop only parseable lines whose `date` precedes the cutoff; preserve all other existing lines byte-for-byte. Atomically replace `log_path` only after the replacement is complete; on staging failure, remove the temporary file and leave `log_path` unchanged. Done when: expired lines are absent and surviving lines are unaltered.
6. Update the last-run pointer at `last_run_pointer_path` to an object containing the new `run_id` and `ended_at`. Done when: the pointer contains the new `run_id` and `ended_at`.

## Failure and recovery
- `rejected-invalid-input`: a required input is missing, a timestamp is not ISO-only, or `metrics` is not a JSON object. No mutation occurs. Report the rejected field and stop.
- `rejected-duplicate`: a line with the same `run_id` already exists. No mutation occurs. Report the existing entry and stop; never append a second entry for one run.
- `malformed-existing-line`: a prior line fails to parse as JSON or lacks required fields. Ignore it for aggregation and duplicate checks; never rewrite or delete it unless it is pruned by the retention window. It must not corrupt the log.
- `partial-write`: if an interrupted append leaves a line that fails the parse check, treat it as a malformed line (ignored), do not rewrite it, and re-append the intended entry only if no line with this `run_id` parses correctly.
- Rollback rule: without retention, successful appends are never rolled back. With retention, prior entries may be removed only by the atomic compaction in step 5; all retained lines remain byte-for-byte unchanged. Validation failures before the update leave the log untouched.
- Blocked result: if the done predicate cannot hold because the log is unwritable or the pointer path is unwritable, report `blocked` with the failing path and the unrecorded entry; do not claim the run is recorded.

## Output
One new JSONL line in the run log, an updated last-run pointer, and any retention-pruned expired lines. Terminal classification is one of `recorded`, `rejected-duplicate`, `rejected-invalid-input`, or `blocked`. On `recorded`, aggregate metrics are derivable from the log alone.
