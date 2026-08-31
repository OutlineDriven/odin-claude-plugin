---
name: frame-rate-stability
description: 'Use when a rendering path needs stable frame-time, CPU, GPU, and memory evidence: stabilize frame rate against fixed targets, then prove every target with two consecutive same-scenario runs. Not for one-shot profiling or visual quality review.'
---

# Frame-rate stability

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A rendering path needs stable frame-time, CPU, GPU, and memory evidence. |
| Authority | Reversible local: write only named local artifacts; state and follow the rollback path before mutating. |
| Side effect | Multi-metric frame-rate stabilization: local writes to the rendering path and its configuration. |
| Done | Every fixed target holds for two consecutive same-scenario runs. |

## Inputs

- The fixed hardware, build, scene, settings, and budget. Required.
- The bound: freeze all before any mutation.

## Procedure

1. Bind the fixed hardware, build, scene, settings, and budget; freeze all before any mutation. Done when: every bound element is named and frozen.
2. Stabilize frame rate against the fixed targets inside the bound, collecting frame-time, CPU, GPU, and memory evidence. Done when: every target is addressed with evidence.
3. Prove every target with two consecutive same-scenario runs. Done when: both runs hold every target, or a target fails and is revisited.
4. Stop at success (all targets hold for two consecutive runs), any non-success terminal (no safe gain, blocked, budget exhausted), or the bound. Done when: a terminal class is reached and named.
5. Persist the run per the durability policy; emit the receipt before return. Done when: the run record and receipt are written.

## Failure and recovery

- **No safe gain**: no stabilization preserves the targets without a visual or behavioral regression. Terminal `stalled`; report what was attempted and why the gain was unsafe.
- **Blocked**: the hardware, build, or scene cannot be exercised. Terminal `blocked`; report the blocking condition.
- **Budget exhausted**: the declared budget is spent before every target holds for two consecutive runs. Terminal `capped`; report which targets held and which remain. Budget exhaustion is never success unless it is the predeclared success predicate.
- **Partial result**: emit the evidence and target results obtained; never present a single-run pass as two-consecutive-run proof.

## Output

A terminal classification (`success`, `capped`, `stalled`, `blocked`, `exhausted`, or `pending`) plus the per-target frame-time, CPU, GPU, and memory evidence from both consecutive runs, and the run receipt.
