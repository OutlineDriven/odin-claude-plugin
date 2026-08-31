---
name: swarm
description: 'Use when asked to run partitioned parallel coverage or races across isolated workers, producing a consolidated evidence table with gaps and dropouts. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Swarm

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Run partitioned parallel coverage or races. |
| Authority | reversible-local: write only named local artifacts; state the rollback path. |
| Side effect | Spawns isolated cloud workers. Workers run session-scoped; nothing published. |
| Done | Consolidated evidence table with gaps and dropouts returned. |

## Inputs

Must supply:
- **Partition strategy or count.** A partition count (integer, minimum 2) or a custom strategy that assigns disjoint work slices to each worker.
- **Test target or scope.** The exact test suite, file set, coverage mode, or race condition to run in each partition.

Optional:
- **Concurrency cap.** Defaults to 3. Cap concurrency even when more partitions are independent. Workers do not automatically scale up unbounded.
- **Session label.** A string to prefix each worker session name for traceability.

## Procedure

1. **Bound the scope.** Accept only the partition strategy and the test target. Stop if the request does not name a concrete target or a partition count. Do not infer or extend the target.
2. **Derive partitions.** Convert the partition strategy into N disjoint work slices, where N equals the partition count or the number of slices the strategy produces. Each slice must be independently runnable with no shared state.
3. **Cap concurrency.** If concurrency cap is not supplied, default to 3. Do not spawn more than the cap simultaneously even if more partitions are available.
4. **Spawn isolated workers.** Spawn each worker in a fresh, isolated session. Each worker receives exactly one slice and runs the test target against that slice only. Workers do not coordinate; no shared state is assumed.
5. **Run to completion.** Wait for each worker to finish. Each worker produces a local evidence artifact scoped to its slice: pass/fail per test, coverage percentage, and any dropouts (skipped, timed out, panicked).
6. **Consolidate evidence.** Collect every worker artifact. Merge into one table with one row per partition: partition ID, tests run, tests passed, coverage delta, dropouts. Add a summary row: combined tests, combined coverage, total dropouts.
7. **Report gaps and dropouts.** Name every partition that produced a dropout or a coverage below the expected threshold. Describe each gap as: partition ID, symptom, and affected slice.
8. **Stop, do not widen.** Return the consolidated table and the gap report. Do not trigger additional workers, re-run failed partitions, or mutate the original source.

## Failure and recovery
- **Partial failure.** One or more workers failed but at least one produced evidence. Return the consolidated partial evidence with the non-converged result. List the failed partitions by ID.
- **Complete failure.** All workers failed. Return a blank table with the non-converged result. Name the failure class and the request that caused it.
- **No rollback needed.** Local artifacts are append-only evidence; the rollback path is: discard evidence artifacts and close worker sessions.
- **Non-converged result.** Use `non-converged` when all workers fail, a batch produces broad unplanned edits, or the evidence cannot be consolidated.

## Output
A consolidated evidence table with columns: partition ID, tests run, tests passed, coverage delta, dropouts. One summary row. A gap report naming every partition with a dropout or coverage below threshold, describing each gap by partition ID, symptom, and affected slice.

## Provenance

Origin: `pstack/skills/swarm/SKILL.md` from https://github.com/cursor/plugins, ref `68836ddaf5697224520f1847d90cdb90ca8babaa`. License: MIT (`pstack/LICENSE` blob `6b5400237fdf6545be0b8fae370d6f2fcff8fb25`; pstack authored by Lauren Tan under MIT per audit license block). Adaptation: clean-room structural derivation — partitioned parallel worker dispatch mechanism adapted to ODIN 2.0 authority model (reversible-local, no publish), ODIN contract table, explicit concurrency cap, evidence consolidation with gap reporting.
