---
name: fixed-view-visual-benchmark
description: 'Use when a visual needs repeatable fixed-view rendering and independent rubric scoring: render the fixed view, score it against a frozen rubric, and prove the saved render clears the threshold. Not for free-form visual review or subjective critique.'
---

# Fixed-view visual benchmark

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A visual needs repeatable fixed-view rendering and independent rubric scoring. |
| Authority | Reversible local with capture consent: write only named local artifacts; capture consent required before rendering. |
| Side effect | Fixed-view visual benchmark: renders and scores the fixed view against the frozen rubric. |
| Done | The saved render clears the frozen rubric threshold. |

## Inputs

- The fixed view rig (camera, scene, settings), the frozen rubric threshold, and the render budget. Required.
- The bound: freeze all three before any mutation.

## Procedure

1. Bind the fixed view rig, rubric threshold, and render budget; freeze all three before any mutation. Done when: the rig, threshold, and budget are named and frozen.
2. Render the fixed view inside the bound. Done when: a render is produced from the frozen rig.
3. Score the render against the frozen rubric independently. Done when: the rubric score is recorded.
4. Stop at success (score clears the threshold), any non-success terminal (stagnation, render blocked, budget exhausted), or the bound. Done when: a terminal class is reached and named.
5. Persist the run per the durability policy; emit the receipt before return. Done when: the run record and receipt are written.

## Failure and recovery

- **Stagnation**: repeated renders do not improve the score. Terminal `stalled`; report the score plateau and the renders attempted.
- **Render blocked**: the rig cannot produce a render. Terminal `blocked`; report the blocking condition.
- **Budget exhausted**: the render budget is spent before the threshold is cleared. Terminal `capped`; report the best score achieved. Budget exhaustion is never success unless it is the predeclared success predicate.
- **Partial result**: emit the best render and score obtained; never present a sub-threshold render as clearing the rubric.

## Output

A terminal classification (`success`, `capped`, `stalled`, `blocked`, `exhausted`, or `pending`) plus the saved render, its rubric score, and the run receipt.
