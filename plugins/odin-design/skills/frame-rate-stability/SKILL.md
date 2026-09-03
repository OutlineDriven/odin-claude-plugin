---
name: frame-rate-stability
description: 'Use when a rendering path needs stable frame-time, CPU, GPU, and memory evidence against fixed targets: stabilize the configuration, define a sampling window, and prove every target with two consecutive comparable runs. Not for one-shot profiling or visual quality review.'
---

# Frame-rate stability

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A rendering path needs stable multi-metric performance against fixed targets. |
| Authority | Reversible local: write only named local artifacts; state and follow the rollback path before mutating. |
| Side effect | Multi-metric frame-rate stabilization: local writes to the rendering path and its configuration. |
| Done | Every fixed target holds for two consecutive comparable runs. |
| Stop | Stalled; blocked; capped. Bound: fixed hardware, build, scene, settings, budget, and target values. |

## Inputs

- Fixed hardware, build, scene, settings, and budget (required): all parameters that affect rendering performance, named and frozen before any mutation.
- Target values (required): fixed numeric thresholds for each metric: frame-time (ms or FPS), CPU (ms or %), GPU (ms or %), and memory (MB or GB). Every target must be a concrete number, not a directional goal like "lower" or "faster".

## Procedure

1. Bind the fixed hardware, build, scene, settings, budget, and target values. Freeze all before any mutation. Done when: every bound element is named and frozen, including a concrete numeric target for each metric.
2. Stabilize the configuration against the fixed targets. Adjust rendering-path settings (quality levels, resolution scaling, draw-call batching, shader complexity, asset streaming) to meet every target. Collect frame-time, CPU, GPU, and memory evidence per change. Done when: every target is addressed with evidence showing the current configuration meets or misses it.
3. Define the sampling window and run-comparability rules. The sampling window is the fixed duration or frame count over which metrics are measured (for example, 10 seconds or 600 frames at a fixed scene position). Run-comparability requires: same hardware, same build, same scene, same settings, same sampling window, same measurement tool. Declare the window and rules before running. Done when: the sampling window and comparability rules are declared in writing.
4. Execute two consecutive comparable runs. Both runs use the frozen inputs, the declared sampling window, and the same measurement tool. Record per-target results for each run. A target holds only if both runs meet its threshold. If a target fails in either run, revisit step 2. Done when: both runs complete with per-target results recorded, or a target fails and is revisited.
5. Stop at success (all targets hold for two consecutive comparable runs), any non-success terminal, or the bound. Done when: a terminal class is reached and named.
6. Persist the run record to `.outline/loops/frame-rate-stability/<run_id>/` when durable. Emit `receipt.json` before return. Done when: the receipt is written with per-target evidence from both runs, the sampling window, and the terminal class.

## Failure and recovery

- No safe gain: no stabilization preserves the targets without a visual or behavioral regression. Terminal `stalled`; report what was attempted and why the gain was unsafe.
- Blocked: the hardware, build, or scene cannot be exercised. Terminal `blocked`; report the blocking condition.
- Budget exhausted: the declared budget is spent before every target holds for two consecutive runs. Terminal `capped`; report which targets held and which remain. Budget exhaustion is never success unless it is the predeclared success predicate.
- Incomparable runs: if the second run uses different inputs, sampling window, or measurement tool than the first, the runs are not comparable. Re-run with identical conditions; do not compare incomparable runs.
- Partial result: emit the evidence and target results obtained; never present a single-run pass as two-consecutive-run proof.

## Output

A terminal classification (`success`, `capped`, `stalled`, `blocked`, `exhausted`, or `pending`) plus the per-target frame-time, CPU, GPU, and memory evidence from both consecutive runs, the sampling window, comparability rules, and the run receipt.
