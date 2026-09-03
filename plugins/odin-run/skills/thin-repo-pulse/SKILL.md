---
name: thin-repo-pulse
description: 'Use when a scheduled or watcher tick fires and a lightweight pulse must capture current external state. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Thin repo pulse

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A scheduled or watcher tick fires and a lightweight pulse must capture current external state. |
| Authority | Reversible-local: write only to named local snapshot and marker artifacts; state the rollback path before writing. |
| Side effect | One bounded snapshot file plus one run marker in the configured output directory. No source, label, workflow, merge, or issue state change. |
| Done | The snapshot file exists, the run marker attributes it to exactly one run with `status: success` or `status: empty`, the snapshot contains the requested state (empty when the source returned no matching state), and zero action side effects were produced. A run with `status: error` does not satisfy Done. |

## Inputs

1. **Snapshot source** (required): the external endpoint, API, or command whose state the pulse captures.
2. **Output directory** (required): local path where the snapshot and run marker are written.
3. **Scope filter** (optional): a selector or query that narrows which state is captured. When omitted, the pulse captures the full available state.
4. **Run marker path** (optional): defaults to `<output-directory>/.last-run.json`.

## Refusals

- Will not trigger downstream workflows, open issues, update labels, or mutate the source.
- Will not write to an alternate path if the primary write fails.
- Will not retry a failed source query — record the failure in the run marker and stop.

## Procedure

1. Generate a unique run identifier from the current timestamp and a random suffix. **Done when:** the run identifier is generated.
2. Read the snapshot source configuration. If the source is unreachable or the configuration is malformed, stop and record the failure in the run marker. **Done when:** the source configuration is valid and reachable.
3. Query the configured source for its current state, applying the scope filter if supplied. Capture the raw response without transformation. **Done when:** the raw state is captured or a failure is recorded.
4. Write the captured state to `<output-directory>/snapshot.json`. An empty result is a valid snapshot. If the write fails, stop immediately; do not write to an alternate path. **Done when:** snapshot.json is written to disk.
5. Write the run marker to the configured marker path. The marker contains: `run_id`, `timestamp`, `source`, `status` (`success`, `empty`, or `error`), `snapshot_bytes`, and `reason` (the failure description when `status` is `error`; omitted otherwise). **Done when:** the run marker is written with all fields appropriate to its status.
6. Verify both artifacts exist on disk. If the marker status is `success` or `empty`, the run is verified. If either artifact is missing or the marker status is `error`, classify the run as `error` and rewrite the marker with the reason. **Done when:** both artifacts are verified on disk with a status of `success` or `empty`.
7. Stop. Do not trigger downstream workflows, open issues, update labels, or mutate the source. **Done when:** the pulse is complete with zero action side effects.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Source query failure | Write a run marker with `status: error` and the failure reason. Do not retry. The snapshot file is not created. |
| Empty snapshot | Write the empty snapshot file and a marker with `status: empty`. The empty result is evidence that the source had no matching state, not a skill failure. |
| Write failure (permissions, disk space) | Stop immediately. Do not write partial artifacts or fall back to an alternate directory. The run is incomplete. |
| Rollback | Delete the snapshot file for the current run. Before deleting the run marker, read it and confirm its `run_id` matches the current run; if a subsequent run has overwritten the shared `.last-run.json` marker, leave it in place. To avoid the conflict entirely, use a per-run marker path (`<output-directory>/.last-run-<run_id>.json`) instead of the shared default. |

## Output

Two artifacts in the configured output directory: `snapshot.json` (captured external state, empty when the source returned no matching state) and `.last-run.json` (run metadata: run_id, timestamp, source, status, snapshot_bytes, and reason when status is error) — ordering: snapshot first, then marker.
