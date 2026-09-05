# Optimize run state: append-only log and crash recovery

Run state lives on disk, not in context. The single run-state file,
`.outline/optimize/<target>/log.jsonl`, is one JSON object per line, **append-only**: a record is
written the moment its fact is known and never rewritten. It sits beside the `agent-*` worktree
dirs but is not matched by the Phase 7 cleanup glob (`…/agent-*`), so it survives the run.

A five-agent fan-out can crash mid-benchmark. Every benchmarked candidate is already a durable
line, so resume re-dispatches only the lenses with no `candidate` record. Benchmarked work is
never repeated.

Records (last `run` record wins for overall status):

| record | written | key fields |
|---|---|---|
| `run` | Phase 4 start (`in-progress`), Phase 7 end (`done`) | `status`, `run_id`, `target`, `started_at`, `fingerprint`, `stop` config, `exit_code` |
| `baseline` | Phase 3 | `median_ms`, `stddev_ms`, `bench_cmd` |
| `candidate` | Phase 4, as each agent returns | `lens`, `after_median_ms`, `speedup_ratio`, `behavior_self_assessment`, `test_result`, `readability_cost` |
| `rank` | Phase 5 | `winner`, `runner_up`, `composite` |
| `gate` | Phase 6, each pass | `candidate`, `passed`, `failure_scenario`, `iteration` |
| `integrated` | Phase 7 | `median_ms`, `integrated_speedup` |

Once the Phase 4 `in-progress` marker is written, **every** terminal exit (0, 12, 13, 14, 16)
appends a `done` marker carrying its `exit_code`. An `in-progress` marker as the last record
therefore means a genuine crash. Only that offers resume; a clean non-zero exit does not.

**`fingerprint`** = `{source_rev, bench_cmd, target}`, where `source_rev` is HEAD plus a hash of
the uncommitted diff over the target files. It pins the base the recorded numbers were measured
against. Candidate diffs are regenerated fresh each run and never cached, so a per-candidate hash
buys nothing. The run-level fingerprint plus the resume baseline re-check are the only staleness
guard needed.

**Resume.** Phase 1 reads the target's log if present. A terminal `done` marker → start fresh
(new `run_id`). An `in-progress` marker → recompute the fingerprint and re-measure the baseline.
Honor the skip-re-benchmark path **only if** the fingerprint matches the logged `run` marker AND
the re-measured baseline median falls inside the logged baseline's stddev band; then replay the
`baseline` and `candidate` records, skip lenses already recorded, and continue at Phase 5 once the
remaining lenses report. If either check fails (source edited, bench command changed, different
machine, environment drift), the recorded numbers are stale. Discard the candidate records, write
a fresh `run` marker, and start over.
