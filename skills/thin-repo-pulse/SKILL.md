---
name: thin-repo-pulse
description: 'Snapshot external job or tracker state into a local artifact on a scheduled pulse or watcher tick, without taking action. Not for remote, credential, publish, deploy, or irreversible changes.'
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

## Refusals

- Will not trigger downstream workflows, open issues, update labels, or mutate the source.
- Will not write to an alternate path if the primary write fails.
- Will not retry a failed source query — record the failure in the run marker and stop.

## Procedure

1. Generate a unique run identifier from the current timestamp and a random suffix. **Done when:** the run identifier is generated.
2. Read the snapshot source configuration. If the source is unreachable or the configuration is malformed, stop and record the failure in the run marker. **Done when:** the source configuration is valid and reachable.
3. Query the configured source for its current state, applying the scope filter if supplied. Capture the raw response without transformation. **Done when:** the raw state is captured or a failure is recorded.
4. Write the captured state to `<output-directory>/snapshot.json`. If the write fails, stop immediately; do not write to an alternate path. **Done when:** snapshot.json is written and non-empty.
5. Write the run marker to the configured marker path. The marker contains: `run_id`, `timestamp`, `source`, `status` (`success`, `empty`, or `error`), and `snapshot_bytes`. **Done when:** the run marker is written with all five fields.
6. Verify both artifacts exist on disk and the snapshot is non-empty. If verification fails, classify the run as `error` and rewrite the marker. **Done when:** both artifacts are verified on disk.
7. Stop. Do not trigger downstream workflows, open issues, update labels, or mutate the source. **Done when:** the pulse is complete with zero action side effects.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Source query failure | Write a run marker with `status: error` and the failure reason. Do not retry. The snapshot file is not created. |
| Empty snapshot | Write the empty snapshot file and a marker with `status: empty`. The empty result is evidence that the source had no matching state, not a skill failure. |
| Write failure (permissions, disk space) | Stop immediately. Do not write partial artifacts or fall back to an alternate directory. The run is incomplete. |
| Rollback | Delete the snapshot file and run marker for the current run. No other state is affected. |

## Output

Two artifacts in the configured output directory: `snapshot.json` (captured external state) and `.last-run.json` (run metadata: run_id, timestamp, source, status, snapshot_bytes) — ordering: snapshot first, then marker.

## Provenance

Adapted from cobusgreyling/loop-engineering, revision d03dcb92cc1e0efb59789a2557131c6ad5897ccc, MIT license. Source paths: `/patterns/thin-loop.md`, `/starters/thin-loop/.github/workflows/thin-loop.yml`, `/starters/thin-loop/LOOP.md`, `/examples/mcp/safe-write-pattern.md`. Clean-room adaptation for ODIN 2.0; no third-party expression copied.
