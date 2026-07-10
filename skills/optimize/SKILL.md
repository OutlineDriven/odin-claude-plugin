---
name: optimize
description: Locates a hot path, benchmarks candidate transformations, and commits the proven winner. Use when the user asks to optimize something, make code faster, reduce allocations, or fix a performance regression.
metadata:
  short-description: 'Applied optimization op: transform a hot path and prove the win'
---

# Optimize: applied hot-path transform with a proven win

A self-contained diagnose→optimize→verify loop. Locate the hot path (lightly, no full
investigation ledger), fan out five candidate transformations as worktree-isolated `Agent` calls,
benchmark each, gate on behavior, commit the winner. The deliverable is a **committed, measured
change**. It is not a verdict, report, or list of suggestions.

Stop condition is context-dependent: budget-driven when a `--budget` or a named
regression is the target; `compress` when removing wasted work with no stated budget; `extend` when
the winning change adds an approximation or cache contract that changes observable semantics.
Avoid: **unmeasured micro-optimization** (no measured hotspot), **misplaced optimization** (applied
before the hotspot is confirmed), **Sprawl** (added complexity that outweighs the earned speedup).

The skill wraps the append-only run log, per-run crash-recovery markers, and stopping rules around the
locate→fan-out→benchmark→gate→commit loop with durability and bounded iteration; they do not change
what the loop does.

**Reference files (verbatim prompts, agent dispatch shapes, harness templates):**
- `references/lenses.md`: five lens prompts sent to candidate agents, one per lens
- `references/tooling.md`: per-language benchmark/profile tooling matrix + minimal harness
  templates for the author-a-harness phase

### Optional: Experiment Mode

When the optimization target has a broad search space (parameter tuning, threshold finding, prompt optimization, configuration search) rather than a single hot-path transform, the metric-driven experiment loop in `references/experiment-mode.md` applies. It covers benchmark loop discipline, stopping rules, an experiment-log schema, and judge-rubric heuristics for qualitative targets. This is a reference-only extension -- the primary workflow above remains the default.

## Constitutional Rules (Non-Negotiable)

1. **No optimization without a measured hotspot.** Accept a supplied profile or named symbol, or run Phase 2's light locate. Never fan out candidates against unmeasured code.
2. **Benchmark before landing.** Every accepted change carries a before/after `hyperfine --warmup 3 --min-runs 10` measurement (variance-aware). If no harness exists, author a minimal throwaway under `.outline/optimize/`. Fall back to a rigorous complexity/allocation argument only when benchmarking is genuinely impractical. Label it `[UNMEASURED]` in the commit body.
3. **Behavior preservation is a gate, not a guideline.** Observable output must be identical by default. Approximation (lossy fast-path, float reassociation, bounded staleness, bounded cache eviction) is permitted only when the user explicitly requests it in prose AND the skill presents the exact contract change for confirmation before applying anything.
4. **One optimization concern per atomic commit.** Algorithmic change + data-structure swap in one commit trips exit 15; split first.
5. **Auto-skip for trivial targets.** A single function <50 LOC with an obvious single-concern win runs a single-pass optimize-and-measure, not a five-agent fleet. Name the auto-skip in the output so the user knows.
6. **Disk is the run's source of truth.** Append each fact to `.outline/optimize/<target>/log.jsonl` the moment it is known (baseline, each candidate as it returns, each gate verdict) and never rewrite a line. An interrupted run resumes from the log and skips re-benchmarking recorded candidates, but only when the run fingerprint and re-measured baseline still match; otherwise the numbers are stale. Discard them and start fresh.

## When to Apply

- The user says "optimize this", "make X faster", "speed up the hot path in Y", "reduce allocations in Z", "fix the perf regression", "profile and optimize `<symbol>`".
- A hotspot has already been identified (profiler output, flamegraph, or named symbol) and the next step is transformation.
- A performance budget is stated (`--budget`) and the current code does not meet it.
- Active context (current diff/file/stack) is measurably slow and the user wants the fix landed, not analyzed.

## When NOT to Apply

- **Diagnosis with no transform authorized**: locate and measure the hotspot first, then come back here.
- **Behavior-preserving entropy reduction on a diff**: that is `simplify`. It runs no benchmarks and explicitly forbids behavior-affecting speedups.
- **Unmeasured code with speculative "this might be slow"**: Graft rejection; locate the hotspot first.
- **No measurable improvement expected**: if the candidate analysis shows noise-level gains, exit 12.
- **Architecture-level redesign**: a plain planning session. Optimization surgery within a hot path is in scope; full module rewrites are not.

## State and artifacts: append-only log + crash recovery

Run state lives on disk, not in context. The one run-state file is
`.outline/optimize/<target>/log.jsonl` is one JSON object per line, **append-only**: a record is
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

## Workflow

### Phase 1: Resolve target

If `/optimize <path|symbol|diff>` was given, use that as the target. If no arg, detect active
context (current diff, current file in editor, top of git stack). If the context is
empty or unresolvable, error explicitly rather than guessing.

**Auto-skip check:** if the resolved target is a single function <50 LOC and only one obvious
concern is visible, declare auto-skip, note it aloud, and proceed with a single-pass loop (Phases
3 → 5 single-agent → 6 → 7 → 8). Otherwise proceed with the full five-agent fan-out.

Parse `--budget <metric>` (e.g. `--budget p95<3ms`, `--budget throughput>10k/s`,
`--budget alloc<1MB`). This sets the stop condition.

**Resume / log init.** Once the target is resolved above (and only then, since the path is keyed
by `<target>`), read `.outline/optimize/<target>/log.jsonl` if it exists. If the last `run` record
is `in-progress`, run the resume check from the State section (recompute fingerprint, re-measure
baseline) and offer resume on a clean match. Otherwise start fresh. With no log or a `done`
marker, `mkdir -p .outline/optimize/<target>/` and treat this as a fresh run; the first `run`
marker is written at Phase 4 fan-out.

### Phase 2: Locate / accept the hotspot

If a profile artifact, flamegraph, or named symbol was supplied, accept it and skip profiling.

Otherwise run a light locate:
1. `hyperfine '<workload cmd>'`: confirm the workload takes measurable wall-clock time.
2. One profiler pass at the right level (see `references/tooling.md` for per-language choice).
3. Identify the top self-time function or widest plateau. Document it as `HOT_PATH`.

If no hotspot clears a 5 % share of total time, exit 11. No actionable target.

### Phase 3: Establish baseline benchmark

Author or locate a benchmark harness for `HOT_PATH` (see `references/tooling.md`). If none exists,
write a minimal throwaway harness under `.outline/optimize/<target>/bench.*` that exercises the hot
function in isolation. Run:

```
hyperfine '<bench cmd>' --warmup 3 --min-runs 10 --export-json .outline/optimize/<target>/before.json
```

Record: median, stddev, min/max. This is the before measurement. **Do not proceed if stddev >
20 % of median**. Fix measurement noise first (pin CPU frequency, isolate the process, widen
`--min-runs`).

Append a `baseline` record (`median_ms`, `stddev_ms`, `bench_cmd`) to the log. This is the base
every candidate `speedup_ratio` is measured against and the value the resume baseline re-check
compares to.

### Phase 4: Fan out candidate agents

Write a `run` marker with `status: in-progress` (carrying `run_id`, `target`, `started_at`, the
`fingerprint`, and the active `stop` config) to the log before dispatch. A crash mid-fan-out is
then detectable on the next invocation.

Launch five worktree-isolated agents in **one tool-call message** (independent by construction:
disjoint lenses, no shared files). For each lens `L` in {`algo`, `data`, `cache`, `concur`,
`arch`}:

```
Agent(
  prompt  = references/lenses.md § <L> + "\n\n---\n\nHOT_PATH: " + <symbol> +
            "\n\nCODE:\n" + <hot-path source> +
            "\n\nBEFORE (hyperfine median): " + <before_median>,
  isolation = "worktree"
)
```

Each agent must:
1. Apply its transformation inside the worktree.
2. Run the harness: `hyperfine '<bench cmd>' --warmup 3 --min-runs 10 --export-json after.json`.
3. Report back a JSON result: `{lens, change_summary, before_median, after_median, speedup_ratio, behavior_self_assessment, readability_cost, diff_patch}`.

Document the independence argument in the spawn message: "disjoint lenses, isolated worktrees,
read-only phase after reporting".

**Append-on-return (orchestrator).** Worktree-isolated agents only return text; the orchestrator
owns the log. As each result object arrives, append a `candidate` record immediately (before
scoring it, before the next result lands). This is the crash-recovery win: an interrupted fan-out
loses nothing, because resume reads the log and re-dispatches only lenses with no `candidate`
record. A failed agent (`null`) is **not** recorded. Its absent record is exactly what makes
resume retry it (a transient worktree crash should re-run, not be skipped). In-run, Phase 5 drops
the nulls with `.filter(Boolean)` before ranking.

### Phase 5: Score and rank candidates

Collect the five result objects (null = agent failed; `.filter(Boolean)` before ranking). Compute:

```
composite = speedup_ratio × behavior_safety × (1 - readability_cost × 0.3)
```

Where `behavior_safety` = 1.0 (exact behavior claimed), 0.7 (approximation with disclosed
contract), or 0.0 (unsafe / undisclosed). Sort descending. Name the winner and the runner-up.
Append a `rank` record (`winner`, `runner_up`, `composite`) to the log.

If `speedup_ratio < 1.05` for all candidates, exit 12. No candidate clears noise.

If the winner relies on approximation (behavior_safety < 1.0) and the user has not already
confirmed in prose: present the exact contract change and wait for confirmation. If declined, exit
14. If confirmed, document the contract change in the commit body.

### Phase 6: Adversarial behavior gate

Dispatch a single adversarial reviewer agent:

```
Agent(
  prompt = "You are an adversarial reviewer. The following optimization diff was applied to <HOT_PATH>.
            Try hard to construct any input or call sequence where the optimized version produces
            a different observable result than the original. Check: output identity, error
            semantics, public API contract, edge inputs (empty, max, negative, NaN, concurrent).
            If approximation is claimed, check that the contract was disclosed correctly.
            Return: {passed: bool, failure_scenario: string|null}"
)
```

Append a `gate` record (`candidate`, `passed`, `failure_scenario`, `iteration`) each pass.

If `passed = false`, log the failure scenario, revert the candidate worktree, and (before
promoting the runner-up) evaluate the Phase 6.5 stopping rules. If none trips, promote the
runner-up and repeat Phase 6. If all candidates fail the gate, exit 13.

### Phase 6.5: Stopping rules

The Phase 6 promote-runner-up loop is otherwise bounded only by candidate exhaustion (exit 13).
Three rules cap it. Evaluate all three before each promotion; stop on the first that trips. Flags
set the thresholds, and the active config is recorded in the `run` marker's `stop` field:

- **Max iterations** (`--max-iters N`, default = number of viable candidates): gate passes attempted.
- **Max wall-hours** (`--max-wall-hours H`, default unset): wall-clock since the Phase 4 `run` marker's `started_at`.
- **Marginal-speedup floor** (`--min-marginal 1.0X`, default `1.02`): this skill's reading of the spec's third stopping rule (confidence that further search will not pay off): if the next runner-up's claimed `speedup_ratio` over the current best is below the floor, the remaining candidates cannot earn their gate cost. Governs the runner-up floor only. Measurement noise is gated separately at Phase 3 (stddev <20 % of median).

On a trip:
- A gate-cleared winner already exists → take it: proceed to Phase 7 (exit 0).
- No winner yet → record best-so-far in the log, append the `done` `run` marker with `exit_code: 16`, commit nothing.

### Phase 7: Apply winner + commit

1. Apply the winner's `diff_patch` to the main worktree.
2. **Integrated benchmark gate (pre-commit).** Run hyperfine on the main tree (not the worktree) to confirm the win survives integration:

   ```
   hyperfine '<bench_cmd>' --warmup 3 --min-runs 10 \
     --export-json .outline/optimize/<target>/after-integrated.json
   ```

   Compute `integrated_speedup = before_median / after_integrated_median`. Values > 1.0 mean
   faster; values < 1.0 mean a regression. If `integrated_speedup < 1.05` the win fell into noise
   Discard the patch with `git restore .` and exit 12. Do not commit a change whose speedup
   cannot survive integration; the deliverable is a proven win, not a worktree artifact.

   Append an `integrated` record (`median_ms`, `integrated_speedup`) to the log.

3. Run repo-native tests. On red, discard the patch with `git restore .` (nothing is committed yet) and exit 13. Do **not** use `git revert HEAD`. That would revert the previous commit, not the uncommitted patch.
4. Commit with:

```
<type>(optimize): <hot-path>: <lens>: <speedup summary>

<prose rationale + evidence>

Before:      <before_median> ± <stddev>
After:       <after_integrated_median> ± <stddev>  (integrated, main tree)
Win:         <integrated_speedup>× (<pct>%)

```

5. Clean up worktrees: `rm -rf .outline/optimize/<target>/agent-*`. The glob matches only the `agent-*` worktree dirs; `log.jsonl` sits beside them and is spared, staying the durable run record.
6. Append the terminal `run` marker (`status: done`, `exit_code`). The last `run` record is authoritative for the resume decision on a later `/optimize` of this target.

### Phase 8: Guard

The integrated win was already confirmed in Phase 7 before the commit. Phase 8 records the
guard recommendation only.

Suggest (do not force) adding a CI regression guard: a benchmark invocation that fails if the
median regresses past `before_median × 1.05`. Place the guard command in the project's CI config
or a `Justfile` / `Makefile` target named `bench-guard`. The before-benchmark JSON artifact at
`.outline/optimize/<target>/before.json` can seed the threshold.

## Validation Gates

| Gate | Pass Criteria | Blocking |
|---|---|---|
| Hotspot identified | Hot path supplied or located with ≥5 % self-time share | Yes. Exit 11 if no hotspot |
| Baseline captured | Before-benchmark median with stddev <20 % | Yes. Fix measurement noise first |
| Fan-out dispatched | All candidate agents launched in one tool-call message (or auto-skip declared) | Yes |
| Composite score non-zero | At least one candidate speedup_ratio ≥1.05 | Yes. Exit 12 if none |
| Approximation confirmed | If any winner claims approximation, user confirmed contract change | Yes. Exit 14 if declined |
| Adversarial gate cleared | Adversarial reviewer returned passed=true for the winner | Yes. Promote runner-up or exit 13 |
| Tests green | Repo-native tests pass after apply, before commit | Yes. Discard patch with `git restore .` on red, exit 13 |
| Worktrees cleaned | `.outline/optimize/<target>/agent-*` dirs removed | Yes |
| Run state persisted | Baseline, each candidate (on return), gate verdicts, and a terminal `run` marker appended to `log.jsonl`; never rewritten | Yes |
| Stopping rule evaluated | Promote-runner-up loop bounded by max-iters / max-wall-hours / marginal-speedup floor | Yes. Exit 16 if tripped before a gated winner |

## Exit Codes

| Code | Meaning |
|---|---|
| 0 | Clean: optimization landed, win proven, all gates passed |
| 11 | No measurable target: active context too trivial, no hotspot with ≥5 % share, or workload too fast to measure |
| 12 | No winning candidate: all five lens agents ran; none cleared the 1.05× noise threshold; no change committed |
| 13 | Behavior regression: adversarial gate rejected all candidates, or repo tests went red after apply; reverted |
| 14 | Approximation declined: user did not confirm the contract change; optimization aborted |
| 15 | Mixed-concern commit: more than one optimization concern bundled; split before committing |
| 16 | Stopping rule tripped before a gated winner: max-iters, max-wall-hours, or marginal-speedup floor reached during the promote-runner-up loop; best-so-far recorded in `log.jsonl`, nothing committed |

## Anti-patterns

- **Rewriting the log instead of appending.** A truncate-and-rewrite can be interrupted half-written and lose every benchmarked candidate. One `candidate` line per result, appended, never edited.
- **Resuming on a stale fingerprint.** Skipping re-benchmark after the source or bench command changed commits a "winner" measured against a base that no longer exists. The fingerprint + baseline re-check exist to forbid this; do not bypass them to save a run.
- **Recording a failed agent so resume skips it.** A transient worktree crash must re-run. Absence of a `candidate` record is the retry signal; do not paper over a failure with a `speedup_ratio: 1.0` placeholder.
- **Letting the promote-runner-up loop run unbounded.** Without the Phase 6.5 stopping rules the loop burns wall-clock chasing sub-noise runners-up. Cap it; exit 16 with best-so-far is a valid result.

## Disambiguation

- **simplify**: behavior-preserving entropy reduction on a diff; runs no benchmarks; explicitly forbids timing/memory-affecting speedups. Use simplify to compress code structure; use `/optimize` when runtime performance is the target.
- **refactor-break-compat**: contract-breaking modernization. `/optimize` never breaks public API contracts (except the disclosed approximation path, which requires explicit user confirmation).
