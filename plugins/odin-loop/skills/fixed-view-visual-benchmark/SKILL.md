---
name: fixed-view-visual-benchmark
description: 'Use when a visual needs repeatable fixed-view rendering and independent rubric scoring: render the fixed view through a specified interface, score it against a frozen rubric, and prove the saved render clears the threshold. Not for free-form visual review or subjective critique.'
---

# Fixed-view visual benchmark

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A visual needs repeatable fixed-view rendering and independent rubric scoring. |
| Authority | Reversible local with capture consent: write only named local artifacts; capture consent required before rendering. |
| Side effect | Fixed-view visual benchmark: renders and scores the fixed view against the frozen rubric. |
| Done | The saved render clears the frozen rubric threshold. |
| Stop | Stalled; render blocked; budget exhausted. Bound: fixed view rig, rubric threshold, render budget. |

## Inputs

- Fixed view rig (required): camera position and orientation, scene definition, render settings (resolution, samples, lighting, post-processing). All parameters that affect the rendered output must be named and frozen.
- Frozen rubric threshold (required): the minimum aggregate score that defines a passing render, plus the rubric dimensions and their weights.
- Render budget (required): the maximum render attempts or time allowed, declared before work begins.

## Procedure

1. Bind the fixed view rig, rubric threshold, and render budget. Freeze all three before any mutation. Done when: the rig, threshold, and budget are named and frozen.
2. Render the fixed view through a specified rendering interface with reproducibility controls. The interface must accept the frozen rig parameters and produce a deterministic output: same camera, same scene, same settings, same result. Record the interface name, version, and the exact parameter set used. If the interface is non-deterministic (stochastic sampling, temporal effects), declare the seed or averaging strategy that makes repeated renders comparable. Done when: a render is produced from the frozen rig with the interface and parameters recorded.
3. Score the render against the frozen rubric independently. The rubric defines scoring dimensions (for example: composition, lighting accuracy, material fidelity, geometric correctness), each with a weight summing to 1.0 and a 0–10 scale per dimension. The aggregate score is the weighted sum. Score each dimension against the rubric criteria, not against the previous render. Record per-dimension scores, the aggregate, and the threshold. Done when: the rubric score is recorded with per-dimension breakdown.
4. Stop at success (aggregate score clears the threshold), any non-success terminal, or the bound. Done when: a terminal class is reached and named.
5. Persist the run record to `.outline/loops/fixed-view-visual-benchmark/<run_id>/` when durable. Emit `receipt.json` before return. Done when: the receipt is written with the saved render path, per-dimension scores, aggregate, threshold, and terminal class.

## Failure and recovery

- Stagnation: repeated renders do not improve the score. Terminal `stalled`; report the score plateau and the renders attempted.
- Render blocked: the rig cannot produce a render through the specified interface. Terminal `blocked`; report the blocking condition.
- Budget exhausted: the render budget is spent before the threshold is cleared. Terminal `capped`; report the best score achieved. Budget exhaustion is never success unless it is the predeclared success predicate.
- Non-deterministic output without declared seed: if repeated renders with the same parameters produce different scores and no seed or averaging strategy was declared, the renders are not comparable. Declare the strategy before scoring; do not compare incomparable renders.
- Partial result: emit the best render and score obtained; never present a sub-threshold render as clearing the rubric.

## Output

A terminal classification (`success`, `capped`, `stalled`, `blocked`, `exhausted`, or `pending`) plus the saved render, its per-dimension rubric scores, aggregate score, threshold, and the run receipt.
