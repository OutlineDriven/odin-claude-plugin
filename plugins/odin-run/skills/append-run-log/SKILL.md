---
name: append-run-log
description: 'Use when a completed agent run must be recorded as durable, queryable evidence. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Append run log

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A completed agent run must be recorded as durable, queryable evidence. |
| Authority | Reversible local: writes only the run log by appending; prior entries are never rewritten; rollback is version control. No remote mutation. |
| Side effect | Appends one entry to the append-only JSONL run log under an ISO-only date guard, prunes entries older than the declared retention window, and updates the last-run pointer. |
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
2. Bound scope: open `log_path` in append-only mode. Do not read-modify-write or rewrite any prior line. Done when: `log_path` is open in append-only mode.
3. Compose one JSONL entry as a single line: `run_id`, `started_at`, `ended_at`, `metrics`, and `date` set to the ISO date portion of `ended_at` as the date guard. Done when: the entry is a single line with all fields and metrics sufficient to derive aggregates.
4. Append the entry as exactly one line terminated by a newline, then flush. No other line is altered. Done when: exactly one line with this `run_id` exists in the log.
5. If `retention_window` is supplied, compute the cutoff from the current UTC date minus the window. Delete whole lines whose `date` precedes the cutoff. Never alter the content of a surviving line; deletion is the only mutation permitted on prior entries. Done when: expired lines are deleted and surviving lines are unaltered.
6. Update the last-run pointer at `last_run_pointer_path` to an object containing the new `run_id` and `ended_at`. Done when: the pointer contains the new `run_id` and `ended_at`.

## Failure and recovery
- `rejected-invalid-input`: a required input is missing, a timestamp is not ISO-only, or `metrics` is not a JSON object. No mutation occurs. Report the rejected field and stop.
- `rejected-duplicate`: a line with the same `run_id` already exists. No mutation occurs. Report the existing entry and stop; never append a second entry for one run.
- `malformed-existing-line`: a prior line fails to parse as JSON or lacks required fields. Ignore it for aggregation and duplicate checks; never rewrite or delete it unless it is pruned by the retention window. It must not corrupt the log.
- `partial-write`: if an interrupted append leaves a line that fails the parse check, treat it as a malformed line (ignored), do not rewrite it, and re-append the intended entry only if no line with this `run_id` parses correctly.
- Rollback rule: append-only. Validation failures before step 4 leave the log untouched. After a successful append, prior entries are never rolled back; only retention pruning may delete expired lines.
- Blocked result: if the done predicate cannot hold because the log is unwritable or the pointer path is unwritable, report `blocked` with the failing path and the unrecorded entry; do not claim the run is recorded.

## Output
One new JSONL line in the run log, an updated last-run pointer, and any retention-pruned expired lines. Terminal classification is one of `recorded`, `rejected-duplicate`, `rejected-invalid-input`, or `blocked`. On `recorded`, aggregate metrics are derivable from the log alone.
