---
name: thin-repo-pulse
description: 'Use when a scheduled pulse or watcher tick fires, snapshot external job or tracker state into a local artifact without taking any action. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Thin repo pulse

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A scheduled or watcher tick fires and a lightweight pulse must capture current external state. |
| Authority | Reversible-local: write only to named local snapshot and marker artifacts; state the rollback path before writing. |
| Side effect | One bounded snapshot file plus one run marker in the configured output directory. No source, label, workflow, merge, or issue state change. |
| Done | The snapshot file is non-empty, the run marker attributes it to exactly one run, the snapshot contains the requested state, and zero action side effects were produced. |

## Inputs

1. **Snapshot source** (required): the external endpoint, API, or command whose state the pulse captures.
2. **Output directory** (required): local path where the snapshot and run marker are written.
3. **Scope filter** (optional): a selector or query that narrows which state is captured. When omitted, the pulse captures the full available state.
4. **Run marker path** (optional): defaults to `<output-directory>/.last-run.json`.

## Procedure

1. Generate a unique run identifier from the current timestamp and a random suffix.
2. Read the snapshot source configuration. If the source is unreachable or the configuration is malformed, stop and record the failure in the run marker (see Failure and recovery).
3. Query the configured source for its current state, applying the scope filter if supplied. Capture the raw response without transformation.
4. Write the captured state to `<output-directory>/snapshot.json`. If the write fails, stop immediately; do not write to an alternate path.
5. Write the run marker to the configured marker path. The marker contains: `run_id`, `timestamp`, `source`, `status` (`success`, `empty`, or `error`), and `snapshot_bytes`.
6. Verify both artifacts exist on disk and the snapshot is non-empty. If verification fails, classify the run as `error` and rewrite the marker.
7. Stop. Do not trigger downstream workflows, open issues, update labels, or mutate the source.

## Failure and recovery
- **Source query failure**: write a run marker with `status: error` and the failure reason. Do not retry. The snapshot file is not created.
- **Empty snapshot**: write the empty snapshot file and a marker with `status: empty`. The empty result is evidence that the source had no matching state, not a skill failure.
- **Write failure** (permissions, disk space): stop immediately. Do not write partial artifacts or fall back to an alternate directory. The run is incomplete.
- **Rollback**: delete the snapshot file and run marker for the current run. No other state is affected.

## Output
Two artifacts in the configured output directory:
- `snapshot.json`: the captured external state.
- `.last-run.json`: run metadata (`run_id`, `timestamp`, `source`, `status`, `snapshot_bytes`).

## Provenance

Adapted from cobusgreyling/loop-engineering, revision d03dcb92cc1e0efb59789a2557131c6ad5897ccc, MIT license. Source paths: `/patterns/thin-loop.md`, `/starters/thin-loop/.github/workflows/thin-loop.yml`, `/starters/thin-loop/LOOP.md`, `/examples/mcp/safe-write-pattern.md`. Clean-room adaptation for ODIN 2.0; no third-party expression copied.
